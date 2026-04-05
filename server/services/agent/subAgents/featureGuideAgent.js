import { AGENT_RISK_LEVEL } from "../constants.js";
import { INTENT_ID } from "../intents/taxonomy.js";
import {
  buildFeatureGenerationSystemPrompt,
  buildFeatureGuidePromptInput,
  FEATURE_GENERATION_PROMPT_VERSION,
  FEATURE_GENERATION_RESPONSE_SCHEMA,
} from "../prompts/subAgentPrompts.js";

const FEATURE_KEYWORDS = {
  checkin: ["打卡", "checkin", "check-in", "记录"],
  cbt: ["cbt", "认知", "练习"],
  partner: ["伴侣", "partner", "共享"],
  content: ["内容", "推荐", "文章", "课程"],
  ai: ["ai", "助手", "智能问答"],
  settings: ["设置", "提醒", "隐私", "个人资料", "我的"],
};

function containsAny(text, words = []) {
  const safe = String(text || "").toLowerCase();
  return words.some((word) => safe.includes(String(word || "").toLowerCase()));
}

function normalizeString(value, maxLength = 260) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function normalizeStringList(value = [], maxLength = 80, maxItems = 4) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => normalizeString(item, maxLength))
    .filter(Boolean)
    .slice(0, maxItems);
}

function inferFeatureIntentType(message = "", classification = {}) {
  const primaryIntent = classification?.primary_intent;
  const lower = String(message || "").toLowerCase();
  if (lower.includes("区别") || lower.includes("difference") || lower.includes("还是")) return "feature_compare";
  if (lower.includes("哪个") || lower.includes("先用") || lower.includes("该用")) return "next_best_feature";
  if (containsAny(lower, FEATURE_KEYWORDS.settings)) return "settings_help";
  if (primaryIntent === INTENT_ID.APP_FEATURE_EXPLANATION) return "entry_path";
  return "unknown_feature";
}

function inferFeatureTarget(message = "") {
  if (containsAny(message, FEATURE_KEYWORDS.checkin)) return "daily_checkin";
  if (containsAny(message, FEATURE_KEYWORDS.cbt)) return "cbt_center";
  if (containsAny(message, FEATURE_KEYWORDS.partner)) return "partner_sync";
  if (containsAny(message, FEATURE_KEYWORDS.content)) return "content_recommendation";
  if (containsAny(message, FEATURE_KEYWORDS.ai)) return "ai_assistant";
  if (containsAny(message, FEATURE_KEYWORDS.settings)) return "settings_center";
  return "general_feature";
}

function buildFeatureRetrievalQuery(message = "", target = "general_feature") {
  const safeMessage = String(message || "").slice(0, 160);
  const map = {
    daily_checkin: "打卡 首页 记录 入口",
    cbt_center: "CBT 关怀 练习 入口",
    partner_sync: "伴侣同步 绑定 共享 我的 入口",
    content_recommendation: "内容推荐 文章 课程 主题 入口",
    ai_assistant: "AI 助手 打卡 CBT 区别 入口",
    settings_center: "设置 提醒 隐私 我的 入口",
    general_feature: "功能 入口 路径 使用",
  };
  return `${safeMessage} ${map[target] || map.general_feature}`.trim();
}

function buildDeterministicHint(target = "general_feature", lang = "zh") {
  const zh = {
    daily_checkin: {
      acknowledge: "你现在更像是在找打卡入口，我先直接帮你定位。",
      path: "你可以先从首页进入，再看今日记录或每日打卡区域。",
      explain: "打卡更适合快速记录情绪、睡眠和当天状态变化。",
      guide: "如果你愿意，我可以继续把打卡后的下一步也一起说清楚。",
      recommendations: [{ feature_id: "daily_checkin", reason: "快速记录当前状态", cta: "去首页打卡" }],
    },
    cbt_center: {
      acknowledge: "你现在是在找 CBT 的入口或用法，我先给你最直接的路径。",
      path: "你可以先进入关怀页，再打开 CBT 中心查看练习模块和进度。",
      explain: "CBT 更适合你想把一个反复困扰的情绪或想法做结构化梳理的时候。",
      guide: "如果你愿意，我可以继续告诉你先从哪个练习开始更合适。",
      recommendations: [{ feature_id: "cbt_center", reason: "做结构化练习", cta: "打开 CBT 中心" }],
    },
    partner_sync: {
      acknowledge: "你更像是在找伴侣同步入口，我先帮你把路径找清楚。",
      path: "你可以先进入“我的”页，再打开伴侣同步中心进行邀请和绑定。",
      explain: "伴侣同步适合把今天的重点状态和支持任务更清楚地共享给伴侣。",
      guide: "如果你愿意，我可以继续告诉你绑定后怎么设置共享级别。",
      recommendations: [{ feature_id: "partner_sync", reason: "建立伴侣协作支持", cta: "打开伴侣同步" }],
    },
    content_recommendation: {
      acknowledge: "如果你现在是在找内容入口，我可以先带你走最短路径。",
      path: "你可以先进入相关主题内容区，优先看和你当前问题最贴近的推荐内容。",
      explain: "内容推荐更适合你想先看资料、先理解方法，再决定下一步怎么做的时候。",
      guide: "你如果告诉我更偏情绪、睡眠还是饮食，我可以帮你缩小到一个主题。",
      recommendations: [{ feature_id: "content_recommendation", reason: "先看适合当前问题的资料", cta: "查看推荐内容" }],
    },
    ai_assistant: {
      acknowledge: "如果你现在还不确定从哪个功能开始，先从 AI 助手入手会更省力。",
      path: "你可以先进入 AI 助手，把当前最困扰的问题直接说出来。",
      explain: "AI 助手更适合帮你判断当前该先记录、练习，还是先看内容。",
      guide: "如果你愿意，我也可以继续帮你区分 AI 助手、打卡和 CBT 的差别。",
      recommendations: [{ feature_id: "ai_assistant", reason: "先帮你判断最合适的功能入口", cta: "继续和 AI 助手对话" }],
    },
    settings_center: {
      acknowledge: "你现在更像是在找设置或个人入口，我先帮你定位。",
      path: "你可以先进入“我的”页，再查看提醒、隐私或个人资料相关设置。",
      explain: "这个入口更适合管理提醒节奏、账号资料和伴侣共享等设置。",
      guide: "如果你告诉我是提醒、隐私还是资料设置，我可以继续细化路径。",
      recommendations: [{ feature_id: "settings_center", reason: "管理提醒和个人设置", cta: "进入“我的”页" }],
    },
    general_feature: {
      acknowledge: "你现在更像是在找一个合适的功能入口，我可以先帮你缩小范围。",
      path: "这个应用主要从首页、关怀、医疗支持和“我的”这几个主入口开始。",
      explain: "如果你的目标是记录状态，优先看打卡；如果想做练习，优先看 CBT；如果想先说清问题，优先从 AI 助手开始。",
      guide: "你告诉我现在最想解决的是记录、练习、看内容，还是设置功能，我直接帮你选入口。",
      recommendations: [],
    },
  };
  const en = {
    daily_checkin: {
      acknowledge: "It sounds like you are looking for the check-in entry first.",
      path: "Start from Home, then look for the daily record or check-in area.",
      explain: "Check-in is best when you want to quickly log mood, sleep, and daily state changes.",
      guide: "If you want, I can also tell you what to do right after checking in.",
      recommendations: [{ feature_id: "daily_checkin", reason: "Quickly record your current state", cta: "Open Check-in" }],
    },
    cbt_center: {
      acknowledge: "It sounds like you are looking for the CBT entry or how to use it.",
      path: "Go to the Care tab, then open the CBT center to view modules and progress.",
      explain: "CBT fits better when you want to structure a repeating thought or emotional pattern.",
      guide: "If you want, I can suggest which CBT step to start with first.",
      recommendations: [{ feature_id: "cbt_center", reason: "Start a structured exercise", cta: "Open CBT Center" }],
    },
    partner_sync: {
      acknowledge: "It looks like you are trying to find partner sync.",
      path: "Open the Me tab, then enter Partner Sync to invite and bind your partner.",
      explain: "Partner Sync helps you share the most useful updates and support tasks more clearly.",
      guide: "If you want, I can also explain how to set the sharing level afterward.",
      recommendations: [{ feature_id: "partner_sync", reason: "Set up partner support", cta: "Open Partner Sync" }],
    },
    content_recommendation: {
      acknowledge: "It sounds like you want to find the right content entry first.",
      path: "Open the related content area and start with the topic closest to your current concern.",
      explain: "Content recommendations work well when you want to read or learn first before taking the next step.",
      guide: "If you tell me whether this is more about mood, sleep, or diet, I can narrow it down.",
      recommendations: [{ feature_id: "content_recommendation", reason: "Find the most relevant content first", cta: "View Recommendations" }],
    },
    ai_assistant: {
      acknowledge: "If you are not sure which feature to use first, starting with the AI assistant is the easiest path.",
      path: "Open the AI assistant and describe the main problem you want help with.",
      explain: "The AI assistant is best when you need help deciding whether to log, practice, or learn first.",
      guide: "If you want, I can also explain the difference between AI assistant, check-in, and CBT.",
      recommendations: [{ feature_id: "ai_assistant", reason: "Help choose the best next feature", cta: "Continue with AI assistant" }],
    },
    settings_center: {
      acknowledge: "It sounds like you are looking for settings or profile management.",
      path: "Open the Me tab, then look for reminders, privacy, or profile settings.",
      explain: "This area is used for reminders, account info, and partner-sharing settings.",
      guide: "If you tell me whether this is about reminders, privacy, or profile settings, I can narrow the path further.",
      recommendations: [{ feature_id: "settings_center", reason: "Manage reminders and profile settings", cta: "Open Me" }],
    },
    general_feature: {
      acknowledge: "It sounds like you are choosing between feature entry points.",
      path: "The main starting points are Home, Care, Medical, and Me.",
      explain: "If you want to log your state, start with check-in. If you want structured practice, start with CBT. If you want to talk the problem through first, start with the AI assistant.",
      guide: "Tell me whether your goal is logging, practicing, reading, or settings, and I will pick the best entry.",
      recommendations: [],
    },
  };
  return (lang === "en" ? en : zh)[target] || (lang === "en" ? en.general_feature : zh.general_feature);
}

function normalizeFeatureRecommendations(value = []) {
  if (!Array.isArray(value)) return [];
  const list = [];
  for (const item of value) {
    const featureId = normalizeString(item?.feature_id || item?.featureId, 48);
    if (!featureId) continue;
    list.push({
      feature_id: featureId,
      reason: normalizeString(item?.reason, 120),
      cta: normalizeString(item?.cta, 64),
    });
    if (list.length >= 3) break;
  }
  return list;
}

function normalizeGeneratedBlocks(payload = {}, fallbackNeedsClarification = false) {
  const blocks = payload?.response_blocks && typeof payload.response_blocks === "object" ? payload.response_blocks : {};
  const acknowledge = normalizeString(blocks?.acknowledge, 220);
  const path = normalizeString(blocks?.path, 240);
  const explain = normalizeString(blocks?.explain, 240);
  const guide = normalizeString(blocks?.guide, 200);
  if (!acknowledge || !path || !explain || !guide) return null;
  return {
    responseBlocks: { acknowledge, path, explain, guide },
    needsClarification:
      typeof payload?.needs_clarification === "boolean"
        ? payload.needs_clarification
        : Boolean(fallbackNeedsClarification),
    featureRecommendations: normalizeFeatureRecommendations(payload?.feature_recommendations),
    auditReason: normalizeString(payload?.audit_reason, 220),
    evidenceUsed: normalizeStringList(payload?.evidence_used, 80, 4),
    certaintyLevel: normalizeString(payload?.certainty_level, 16) || "low",
    generationMode: normalizeString(payload?.generation_mode, 40) || "grounded_answer",
    featureIntentType: normalizeString(payload?.feature_intent_type, 40) || "unknown_feature",
    pathConfidence: Number.isFinite(Number(payload?.path_confidence))
      ? Math.max(0, Math.min(1, Number(payload.path_confidence)))
      : 0.5,
  };
}

function composeAnswer({ blocks }) {
  return `${blocks.acknowledge}\n\n${blocks.path}\n\n${blocks.explain}\n\n${blocks.guide}`.trim();
}

function buildGroundedContext({ citations = [], usedSources = [], groundingSummary = null, kbFreshness = null, productEvidenceOnly = false, lang = "zh" }) {
  const keyPoints = (Array.isArray(citations) ? citations : []).slice(0, 3).map((item) => {
    const title = normalizeString(item?.title, 80);
    const snippet = normalizeString(item?.snippet || item?.summary, 160);
    return [title, snippet].filter(Boolean).join(": ");
  }).filter(Boolean);
  const kbHitCount = Number(groundingSummary?.total_citations || 0);
  const sources = normalizeStringList(usedSources, 32, 4);
  const hasProductEvidence = sources.some((item) => item === "local_kb" || item === "feishu_sync" || item === "feishu_live");
  const webOnly = sources.length > 0 && !hasProductEvidence;
  let evidenceStrength = "low";
  if (hasProductEvidence && kbHitCount >= 2) evidenceStrength = "high";
  else if (hasProductEvidence && kbHitCount >= 1) evidenceStrength = "medium";
  else if (webOnly && kbHitCount >= 1) evidenceStrength = "low";
  const freshnessHint =
    kbFreshness?.status === "fresh"
      ? lang === "en" ? "Product knowledge freshness looks good." : "当前产品知识新鲜度较好。"
      : kbFreshness?.status === "stale"
        ? lang === "en" ? "Some product knowledge may be outdated; lower certainty." : "部分产品知识可能偏旧，回答强度要保守。"
        : "";
  return {
    used_sources: sources,
    key_points: normalizeStringList(keyPoints, 180, 6),
    kb_hit_count: kbHitCount,
    kb_miss: kbHitCount === 0,
    evidence_strength: evidenceStrength,
    freshness_hint: freshnessHint,
    has_product_evidence: hasProductEvidence,
    web_only: webOnly,
    product_evidence_only: productEvidenceOnly,
  };
}

function buildFeatureUserPrompt({
  lang,
  message,
  classification,
  target,
  featureIntentType,
  promptSignals,
  groundedContext,
  citations = [],
  deterministicHint,
  sourcePreference,
}) {
  return JSON.stringify(
    {
      task: "Generate grounded feature guidance blocks",
      lang: lang === "en" ? "en" : "zh",
      message,
      classification: {
        primary_intent: classification?.primary_intent || INTENT_ID.APP_FEATURE_EXPLANATION,
        confidence: Number(classification?.confidence || 0),
        needs_clarification: Boolean(classification?.needs_clarification),
      },
      feature_target: target,
      feature_intent_type: featureIntentType,
      memory_signals: {
        last_primary_concern: promptSignals?.lastPrimaryConcern || "",
        pregnancy_week: promptSignals?.pregnancyWeek || "",
        tone_preference: promptSignals?.tonePreference || "",
        feature_usage_pref: promptSignals?.featureUsagePreference || null,
        faq_type_top3: Array.isArray(promptSignals?.faqTopIntents) ? promptSignals.faqTopIntents.slice(0, 3) : [],
      },
      deterministic_hint: deterministicHint,
      grounded_context: groundedContext,
      grounding_evidence: (Array.isArray(citations) ? citations : []).slice(0, 4).map((item) => ({
        id: item?.id,
        title: normalizeString(item?.title, 100),
        summary: normalizeString(item?.snippet || item?.summary, 220),
        source_type: normalizeString(item?.source_type || item?.sourceType, 32),
      })),
      source_preference: sourcePreference || "kb_first",
    },
    null,
    2
  );
}

async function generateFeatureAnswer({
  modelGateway,
  modelPreference,
  lang,
  message,
  classification,
  target,
  featureIntentType,
  promptSignals,
  groundedContext,
  citations,
  deterministicHint,
  sourcePreference,
}) {
  if (!modelGateway || typeof modelGateway.completeJson !== "function") {
    return {
      ok: false,
      error: { code: "MODEL_GATEWAY_UNAVAILABLE", message: "Model gateway unavailable." },
      meta: {
        modelRequested: null,
        modelUsed: null,
        fallbackReason: "model_gateway_unavailable",
        latencyMs: 0,
      },
    };
  }
  const result = await modelGateway.completeJson({
    requestedModelKey: modelPreference?.modelKey,
    systemPrompt: buildFeatureGenerationSystemPrompt(),
    userPrompt: buildFeatureUserPrompt({
      lang,
      message,
      classification,
      target,
      featureIntentType,
      promptSignals,
      groundedContext,
      citations,
      deterministicHint,
      sourcePreference,
    }),
    responseSchema: FEATURE_GENERATION_RESPONSE_SCHEMA,
  });

  const meta = {
    modelRequested: result?.modelRequested || null,
    modelUsed: result?.modelUsed || null,
    fallbackReason: result?.fallbackReason || null,
    latencyMs: Number(result?.latencyMs || 0),
  };
  if (!result?.ok) {
    return {
      ok: false,
      error: result?.error || { code: "LLM_GENERATION_FAILED", message: "Feature generation failed." },
      meta,
    };
  }
  const normalized = normalizeGeneratedBlocks(result?.data || {}, classification?.needs_clarification);
  if (!normalized) {
    return {
      ok: false,
      error: { code: "INVALID_LLM_RESPONSE", message: "LLM payload missing required response blocks." },
      meta,
    };
  }
  return {
    ok: true,
    data: normalized,
    meta,
  };
}

function buildSoftFallback({ deterministicHint, needsClarification }) {
  return {
    responseBlocks: {
      acknowledge: deterministicHint.acknowledge,
      path: deterministicHint.path,
      explain: deterministicHint.explain,
      guide: needsClarification ? deterministicHint.guide : deterministicHint.guide,
    },
    needsClarification: Boolean(needsClarification),
    featureRecommendations: deterministicHint.recommendations || [],
    certaintyLevel: "medium",
    generationMode: "soft_template_fallback",
    featureIntentType: "unknown_feature",
    pathConfidence: 0.72,
    auditReason: "Template fallback used for feature guidance.",
    evidenceUsed: [],
  };
}

function buildHardFallback(lang = "zh") {
  return {
    responseBlocks: {
      acknowledge: lang === "en" ? "I want to keep the path accurate." : "我想先确保给你的路径是准确的。",
      path: lang === "en" ? "I may need one more detail before pointing to the exact feature entry." : "在给你精确入口前，我还需要一个更具体的信息。",
      explain: lang === "en" ? "I do not want to guess and invent product paths that may be wrong." : "我不想靠猜测去编一个可能不准确的功能路径。",
      guide: lang === "en" ? "Tell me whether you are looking for check-in, CBT, content, partner sync, or settings." : "请告诉我是打卡、CBT、内容推荐、伴侣同步，还是设置入口。",
    },
    needsClarification: true,
    featureRecommendations: [],
    certaintyLevel: "low",
    generationMode: "hard_safe_fallback",
    featureIntentType: "unknown_feature",
    pathConfidence: 0.32,
    auditReason: "Hard fallback used because grounded feature path could not be confirmed.",
    evidenceUsed: [],
  };
}

function buildDisclaimer(lang) {
  return lang === "en"
    ? "Product guidance only; this does not replace medical or mental health professionals."
    : "仅提供产品功能说明，不替代医疗或心理专业支持。";
}

function buildNextActions(featureRecommendations = [], deterministicHint, lang = "zh") {
  if (Array.isArray(featureRecommendations) && featureRecommendations.length > 0) {
    return featureRecommendations.map((item) => item.cta).filter(Boolean).slice(0, 2);
  }
  return [deterministicHint.guide || (lang === "en" ? "Tell me which feature you need." : "告诉我你想找哪个功能。")];
}

export function createFeatureGuideAgent({ modelGateway = null, groundedRetrievalService = null } = {}) {
  return {
    async handle({
      message,
      lang,
      topic,
      classification,
      memoryPromptContext,
      modelPreference = null,
      sourcePreference = "kb_first",
      feishuScopeId = "",
      clientContext = {},
      riskLevel: routeRiskLevel = AGENT_RISK_LEVEL.R0,
      runTool,
    }) {
      if (routeRiskLevel === AGENT_RISK_LEVEL.R2 || routeRiskLevel === AGENT_RISK_LEVEL.R3) {
        const hardFallback = buildHardFallback(lang);
        const answer = composeAnswer({ blocks: hardFallback.responseBlocks });
        return {
          answer,
          riskLevel: routeRiskLevel,
          nextActions: buildNextActions([], { guide: hardFallback.responseBlocks.guide }, lang),
          escalation: null,
          response_blocks: hardFallback.responseBlocks,
          needs_clarification: true,
          feature_recommendations: [],
          disclaimer: buildDisclaimer(lang),
          audit_reason: "Feature guide avoided normal flow due to elevated risk.",
          citations: [],
          usedSources: [],
          groundingSummary: { total_citations: 0, source_breakdown: {}, primary_source: null },
          confidence: 0.3,
          fallbackReason: "hard_safe_fallback",
          kbFreshness: null,
          feishuMeta: null,
          searchMeta: null,
          generationMeta: {
            generation_source: "template_fallback",
            prompt_version: FEATURE_GENERATION_PROMPT_VERSION,
            kb_hit_count: 0,
            kb_miss: true,
            certainty_level: "low",
            generation_mode: "hard_safe_fallback",
            feature_intent_type: "unknown_feature",
            path_confidence: 0.32,
            used_product_evidence: false,
            llm_error_code: null,
            llm_model_requested: null,
            llm_model_used: null,
            llm_latency_ms: 0,
          },
        };
      }

      const promptInput = buildFeatureGuidePromptInput({
        message,
        lang,
        topic,
        classification,
        memoryPromptContext,
      });
      const featureIntentType = inferFeatureIntentType(message, classification);
      const target = inferFeatureTarget(message);
      const deterministicHint = buildDeterministicHint(target, lang);
      const needsClarification =
        featureIntentType === "unknown_feature" ||
        Boolean(classification?.needs_clarification) ||
        Number(classification?.confidence || 0) < 0.62;

      const groundedResult =
        groundedRetrievalService && typeof groundedRetrievalService.retrieve === "function"
          ? await groundedRetrievalService.retrieve({
              message: buildFeatureRetrievalQuery(message, target),
              lang,
              topic: "feature",
              classification,
              promptSignals: promptInput.signals,
              sourcePreference,
              feishuScopeId: feishuScopeId || "app_features",
              runTool,
              clientContext,
              webSearchAllowed: true,
            })
          : {
              citations: [],
              usedSources: [],
              groundingSummary: { total_citations: 0, source_breakdown: {}, primary_source: null },
              confidence: 0.42,
              fallbackReason: "grounded_retrieval_unavailable",
              kbFreshness: null,
              feishuLiveMeta: null,
              webMeta: null,
            };

      const groundedContext = buildGroundedContext({
        citations: groundedResult.citations,
        usedSources: groundedResult.usedSources,
        groundingSummary: groundedResult.groundingSummary,
        kbFreshness: groundedResult.kbFreshness,
        productEvidenceOnly: sourcePreference !== "web_first",
        lang,
      });

      const llmGenerated = await generateFeatureAnswer({
        modelGateway,
        modelPreference,
        lang,
        message,
        classification,
        target,
        featureIntentType,
        promptSignals: promptInput.signals,
        groundedContext,
        citations: groundedResult.citations,
        deterministicHint,
        sourcePreference,
      });

      let finalPayload;
      let llmErrorCode = null;
      let llmModelRequested = null;
      let llmModelUsed = null;
      let llmLatencyMs = 0;
      let generationSource = "template_fallback";

      if (llmGenerated.ok) {
        finalPayload = llmGenerated.data;
        generationSource = "llm";
        llmModelRequested = llmGenerated.meta.modelRequested;
        llmModelUsed = llmGenerated.meta.modelUsed;
        llmLatencyMs = llmGenerated.meta.latencyMs;
      } else {
        llmErrorCode = llmGenerated.error?.code || "LLM_GENERATION_FAILED";
        llmModelRequested = llmGenerated.meta.modelRequested;
        llmModelUsed = llmGenerated.meta.modelUsed;
        llmLatencyMs = llmGenerated.meta.latencyMs;
        finalPayload = groundedContext.has_product_evidence
          ? buildSoftFallback({ deterministicHint, needsClarification })
          : buildHardFallback(lang);
      }

      const featureRecommendations = finalPayload.featureRecommendations.length > 0
        ? finalPayload.featureRecommendations
        : deterministicHint.recommendations || [];

      const answer = composeAnswer({ blocks: finalPayload.responseBlocks });
      const usedProductEvidence = groundedContext.has_product_evidence;
      const pathConfidence = usedProductEvidence
        ? Math.max(0.7, Number(finalPayload.pathConfidence || 0.72))
        : Math.min(0.58, Number(finalPayload.pathConfidence || 0.5));

      return {
        answer,
        riskLevel: AGENT_RISK_LEVEL.R0,
        nextActions: buildNextActions(featureRecommendations, deterministicHint, lang),
        escalation: null,
        response_blocks: finalPayload.responseBlocks,
        needs_clarification: finalPayload.needsClarification,
        feature_recommendations: featureRecommendations,
        disclaimer: buildDisclaimer(lang),
        audit_reason: finalPayload.auditReason || "Feature guidance generated.",
        citations: groundedResult.citations,
        usedSources: groundedResult.usedSources,
        groundingSummary: groundedResult.groundingSummary,
        confidence: groundedResult.confidence,
        fallbackReason: groundedResult.fallbackReason || llmErrorCode,
        kbFreshness: groundedResult.kbFreshness,
        feishuMeta: groundedResult.feishuLiveMeta || null,
        searchMeta: groundedResult.webMeta || null,
        generationMeta: {
          generation_source: generationSource,
          prompt_version: FEATURE_GENERATION_PROMPT_VERSION,
          kb_hit_count: groundedResult.groundingSummary?.total_citations || 0,
          kb_miss: (groundedResult.groundingSummary?.total_citations || 0) === 0,
          certainty_level: finalPayload.certaintyLevel || groundedContext.evidence_strength || "low",
          generation_mode: finalPayload.generationMode || "grounded_answer",
          feature_intent_type: finalPayload.featureIntentType || featureIntentType,
          path_confidence: Number(pathConfidence.toFixed(2)),
          used_product_evidence: usedProductEvidence,
          evidence_used: normalizeStringList(finalPayload.evidenceUsed, 80, 4),
          llm_error_code: llmErrorCode,
          llm_model_requested: llmModelRequested,
          llm_model_used: llmModelUsed,
          llm_latency_ms: llmLatencyMs,
        },
      };
    },
  };
}
