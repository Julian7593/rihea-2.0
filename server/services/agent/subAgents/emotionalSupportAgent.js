import { AGENT_RISK_LEVEL } from "../constants.js";
import { INTENT_ID } from "../intents/taxonomy.js";
import { buildEscalationPayload } from "../safety/escalationPolicy.js";
import {
  buildEmotionalSupportPromptInput,
  buildEmotionalGenerationSystemPrompt,
  EMOTIONAL_GENERATION_PROMPT_VERSION,
  EMOTIONAL_GENERATION_RESPONSE_SCHEMA,
} from "../prompts/subAgentPrompts.js";

const HIGH_RISK_KEYWORDS = [
  "自杀",
  "不想活",
  "结束生命",
  "伤害自己",
  "伤害他人",
  "kill myself",
  "suicide",
  "end my life",
  "hurt myself",
  "hurt others",
];

const FEATURE_TRIGGER_KEYWORDS = [
  "还能做什么",
  "有什么工具",
  "有没有工具",
  "下一步",
  "怎么跟踪",
  "记录一下",
  "打卡",
  "cbt",
  "功能",
  "what else",
  "next step",
  "tool",
  "track",
  "check-in",
];

const KB_TRIGGER_KEYWORDS = [
  "睡不好",
  "夜醒",
  "失眠",
  "睡眠",
  "饮食",
  "吃什么",
  "运动",
  "焦虑",
  "压力",
  "食欲",
  "sleep",
  "anxiety",
  "diet",
  "exercise",
  "stress",
];

const TREND_ANALYSIS_KEYWORDS = [
  "最近总是",
  "最近一直",
  "这几天",
  "反复",
  "持续",
  "总会",
  "一到晚上",
  "lately",
  "recently",
  "these days",
  "keeps",
  "again and again",
];

const CONTENT_RECOMMENDATION_KEYWORDS = [
  "内容推荐",
  "推荐内容",
  "推荐我",
  "看什么",
  "读什么",
  "学什么",
  "还能做什么",
  "下一步",
  "recommend",
  "what should i read",
  "what else",
  "next step",
];

const BANNED_PHRASES = [
  "一定会好",
  "保证没事",
  "你应该坚强",
  "别想太多",
  "正能量一点",
  "everything will be fine",
  "i guarantee",
  "you should be strong",
  "just stay positive",
];

const RISK_WEIGHT = {
  [AGENT_RISK_LEVEL.R0]: 0,
  [AGENT_RISK_LEVEL.R1]: 1,
  [AGENT_RISK_LEVEL.R2]: 2,
  [AGENT_RISK_LEVEL.R3]: 3,
};

function normalizeRiskLevel(value) {
  if (value === AGENT_RISK_LEVEL.R3) return AGENT_RISK_LEVEL.R3;
  if (value === AGENT_RISK_LEVEL.R2) return AGENT_RISK_LEVEL.R2;
  if (value === AGENT_RISK_LEVEL.R1) return AGENT_RISK_LEVEL.R1;
  return AGENT_RISK_LEVEL.R0;
}

function maxRisk(left, right) {
  const l = normalizeRiskLevel(left);
  const r = normalizeRiskLevel(right);
  return RISK_WEIGHT[l] >= RISK_WEIGHT[r] ? l : r;
}

function containsAny(text, words = []) {
  const safe = String(text || "").toLowerCase();
  return words.some((word) => safe.includes(String(word || "").toLowerCase()));
}

function normalizeConcernLabel(label = "", lang = "zh") {
  const safe = String(label || "").toLowerCase();
  const mapZh = {
    night_waking_with_anxiety: "夜醒伴随焦虑",
    sleep_disturbance: "睡眠困扰",
    emotional_distress: "情绪压力",
    companionship_need: "陪伴需求",
    diet_concern: "饮食担忧",
    exercise_concern: "运动顾虑",
    high_risk_expression: "高风险情绪表达",
  };
  const mapEn = {
    night_waking_with_anxiety: "night waking with anxiety",
    sleep_disturbance: "sleep disturbance",
    emotional_distress: "emotional distress",
    companionship_need: "companionship need",
    diet_concern: "diet concern",
    exercise_concern: "exercise concern",
    high_risk_expression: "high-risk expression",
  };
  const dict = lang === "en" ? mapEn : mapZh;
  return dict[safe] || String(label || "");
}

function inferConcern({ topic, classification, fallbackLabel = "emotional_distress" }) {
  const primary = classification?.primary_intent;
  if (primary === INTENT_ID.SLEEP_ADVICE || topic === "sleep") return "sleep_disturbance";
  if (primary === INTENT_ID.DIETARY_ADVICE || topic === "diet") return "diet_concern";
  if (primary === INTENT_ID.EXERCISE_ADVICE || topic === "exercise") return "exercise_concern";
  if (primary === INTENT_ID.DAILY_COMPANIONSHIP || topic === "companionship") return "companionship_need";
  return fallbackLabel;
}

function buildAcknowledge({ lang, profileName, concernLabel, isCompanion }) {
  const namePrefix = profileName ? `${profileName}${lang === "en" ? ", " : "，"}` : "";
  if (lang === "en") {
    if (isCompanion) return `${namePrefix}I hear you. Feeling overloaded like this can be draining.`;
    if (concernLabel) return `${namePrefix}I hear you. What you described around ${concernLabel} can feel really exhausting.`;
    return `${namePrefix}I hear you. Carrying this much stress is not easy.`;
  }
  if (isCompanion) return `${namePrefix}我听到了。一直这么烦、这么累，真的很消耗。`;
  if (concernLabel) return `${namePrefix}我听到了。你刚提到的“${concernLabel}”确实会让人很耗神。`;
  return `${namePrefix}我听到了。一直扛着这些压力，真的不容易。`;
}

function buildSuggestList({ lang, topic }) {
  if (lang === "en") {
    if (topic === "sleep") {
      return [
        "Do 3 rounds of slow breathing (inhale 4s / exhale 6s).",
        "Write one sentence: what woke you up and one tiny action for tonight.",
      ];
    }
    if (topic === "companionship") {
      return [
        "Name your strongest feeling in one sentence.",
        "Pick one 10-minute calming action (water, stretching, quiet breathing).",
      ];
    }
    return [
      "Do 3 rounds of slow breathing (inhale 4s / exhale 6s).",
      "Write one current concern and one action you can do in the next 10 minutes.",
    ];
  }

  if (topic === "sleep") {
    return [
      "先做3轮慢呼吸（吸4秒、呼6秒）。",
      "写下一句话：今晚最影响入睡的点，以及一个可执行小动作。",
    ];
  }
  if (topic === "companionship") {
    return [
      "先用一句话说出你现在最强烈的感受。",
      "选一个10分钟能完成的小动作（喝水、拉伸、慢呼吸）。",
    ];
  }
  return [
    "先做3轮慢呼吸（吸4秒、呼6秒）。",
    "写下1个当前担忧 + 1个10分钟内可执行动作。",
  ];
}

function shouldRecommendFeatures({ message, riskLevel, lastPrimaryConcern, inferredConcern, classification }) {
  if (riskLevel === AGENT_RISK_LEVEL.R2 || riskLevel === AGENT_RISK_LEVEL.R3) return false;
  if (containsAny(message, FEATURE_TRIGGER_KEYWORDS)) return true;
  if (lastPrimaryConcern && inferredConcern && lastPrimaryConcern === inferredConcern) return true;
  if (classification?.confidence >= 0.75 && classification?.primary_intent === INTENT_ID.SLEEP_ADVICE) return true;
  return false;
}

function buildFeatureRecommendations({ lang, topic }) {
  const zh = [
    { feature_id: "daily_checkin", reason: "帮助记录情绪波动并识别触发点", cta: "现在去打卡" },
    { feature_id: "cbt_center", reason: "用结构化练习降低情绪反应强度", cta: "打开 CBT 中心" },
    { feature_id: "content_recommendation", reason: "获取短时可执行支持内容", cta: "查看推荐内容" },
  ];
  const en = [
    { feature_id: "daily_checkin", reason: "Track mood changes and triggers", cta: "Open Check-in" },
    { feature_id: "cbt_center", reason: "Use structured exercises to lower emotional load", cta: "Open CBT Center" },
    { feature_id: "content_recommendation", reason: "Get short, actionable support content", cta: "View Recommendations" },
  ];
  const base = lang === "en" ? en : zh;
  if (topic === "sleep") return [base[0], base[2], base[1]];
  return base;
}

function buildGuide({ lang, needsClarification, featureRecommendations, handoverRequired }) {
  if (handoverRequired) {
    return lang === "en"
      ? "Please prioritize immediate safety support now."
      : "请先把安全放在第一位，优先执行紧急支持动作。";
  }

  if (needsClarification) {
    return lang === "en"
      ? "To help precisely, tell me your top priority now: mood, sleep, diet, exercise, or app feature guidance?"
      : "为了更准确帮助你，请告诉我你现在最优先的是：情绪、睡眠、饮食、运动，还是功能使用？";
  }

  if (featureRecommendations.length > 0) {
    return lang === "en"
      ? "If you want, I can guide you to one in-app tool for the next step."
      : "如果你愿意，我可以带你用一个应用内工具继续下一步。";
  }

  return lang === "en"
    ? "Which part feels hardest for you right now?"
    : "你现在最卡住的是哪一部分？";
}

function composeAnswer({ lang, blocks }) {
  const suggestPrefix = lang === "en" ? "You can try this first:" : "你可以先这样做：";
  const suggestText = blocks.suggest.map((item, index) => `${index + 1}. ${item}`).join("\n");
  return `${blocks.acknowledge}\n\n${suggestPrefix}\n${suggestText}\n\n${blocks.guide}`.trim();
}

function sanitizeAgainstBannedPhrases(answer = "", lang = "zh") {
  if (!containsAny(answer, BANNED_PHRASES)) return answer;
  return lang === "en"
    ? "I hear this is very hard right now. Let's take one small, realistic step first."
    : "我知道你现在真的很难受。我们先做一个现实、可执行的小步骤。";
}

function buildDisclaimer(lang) {
  return lang === "en"
    ? "Supportive information only; this does not replace licensed medical or mental health professionals."
    : "仅提供支持性信息，不替代执业医生或心理专业人士。";
}

function shouldSearchLocalKb({ topic, message, classification }) {
  if (topic === "sleep" || topic === "diet" || topic === "exercise" || topic === "content") return true;
  if (classification?.primary_intent === INTENT_ID.SLEEP_ADVICE) return true;
  return containsAny(message, KB_TRIGGER_KEYWORDS);
}

function mapTopicToKbCategory(topic = "") {
  if (topic === "sleep") return "second";
  if (topic === "diet") return "nutrition";
  if (topic === "exercise") return "exercise";
  if (topic === "content") return "emotional";
  return "";
}

function buildKbQuery({ message, concernLabel, topic }) {
  const safeMessage = String(message || "").slice(0, 120);
  const safeConcern = String(concernLabel || "").slice(0, 48);
  if (topic === "sleep") return `${safeMessage} 睡眠 焦虑`;
  if (topic === "diet") return `${safeMessage} 饮食 建议`;
  if (topic === "exercise") return `${safeMessage} 运动 安全`;
  if (safeConcern) return `${safeMessage} ${safeConcern}`;
  return safeMessage;
}

function normalizeString(value, maxLength = 300) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
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

function normalizeStringList(value = [], maxLength = 80, maxItems = 4) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => normalizeString(item, maxLength))
    .filter(Boolean)
    .slice(0, maxItems);
}

function normalizeSkillSummary(value, maxLength = 180) {
  return normalizeString(typeof value === "string" ? value : "", maxLength);
}

function detectEvidenceStrength({ citations = [], analysisSignals = {} }) {
  const citationCount = Array.isArray(citations) ? citations.length : 0;
  const analysisCount = Object.values(analysisSignals || {}).filter(Boolean).length;
  if (citationCount >= 2 || (citationCount >= 1 && analysisCount >= 2)) return "high";
  if (citationCount >= 1 || analysisCount >= 1) return "medium";
  return "low";
}

function deriveCertaintyLevel(evidenceStrength = "low", kbMiss = false) {
  if (kbMiss && evidenceStrength === "low") return "low";
  if (evidenceStrength === "high") return "high";
  if (evidenceStrength === "medium") return "medium";
  return "low";
}

function buildFreshnessHint(kbFreshness = null, lang = "zh") {
  if (!kbFreshness || typeof kbFreshness !== "object") return "";
  const status = String(kbFreshness.status || "");
  if (status === "fresh") {
    return lang === "en" ? "Knowledge freshness looks good." : "当前知识新鲜度较好。";
  }
  if (status === "stale") {
    return lang === "en" ? "Knowledge may be slightly outdated; keep certainty modest." : "当前知识可能偏旧，回答强度要保守。";
  }
  if (status === "missing") {
    return lang === "en" ? "No stable knowledge hit was found." : "当前没有稳定命中的知识资料。";
  }
  return "";
}

function shouldAnalyzeEmotionalTrends({ message, clientContext, classification, riskLevel }) {
  if (riskLevel === AGENT_RISK_LEVEL.R2 || riskLevel === AGENT_RISK_LEVEL.R3) return false;
  const checkIns = Array.isArray(clientContext?.checkIns) ? clientContext.checkIns : [];
  if (checkIns.length < 2) return false;
  const intent = classification?.primary_intent;
  return intent === INTENT_ID.EMOTIONAL_SUPPORT || intent === INTENT_ID.DAILY_COMPANIONSHIP || containsAny(message, TREND_ANALYSIS_KEYWORDS);
}

function shouldAnalyzeSleepPattern({ message, topic, classification, clientContext }) {
  const checkIns = Array.isArray(clientContext?.checkIns) ? clientContext.checkIns : [];
  if (checkIns.length < 2) return false;
  if (topic === "sleep") return true;
  return classification?.primary_intent === INTENT_ID.SLEEP_ADVICE || containsAny(message, ["睡", "夜醒", "sleep", "wake"]);
}

function shouldSearchContentRecommendations({ message, riskLevel, classification }) {
  if (riskLevel === AGENT_RISK_LEVEL.R2 || riskLevel === AGENT_RISK_LEVEL.R3) return false;
  return classification?.primary_intent === INTENT_ID.CONTENT_RECOMMENDATION || containsAny(message, CONTENT_RECOMMENDATION_KEYWORDS);
}

function buildAnalysisSignals({ emotionTrendResult, sleepPatternResult, contentRecommendationResult }) {
  const trendSummary = emotionTrendResult?.ok ? normalizeSkillSummary(emotionTrendResult.data?.summary) : "";
  const sleepSummary = sleepPatternResult?.ok ? normalizeSkillSummary(sleepPatternResult.data?.summary) : "";
  const contentItems = contentRecommendationResult?.ok && Array.isArray(contentRecommendationResult.data?.items)
    ? contentRecommendationResult.data.items.slice(0, 3)
    : [];

  return {
    emotionalTrend: trendSummary
      ? {
          summary: trendSummary,
          trend: normalizeString(emotionTrendResult.data?.trend, 40),
          averageMood: Number.isFinite(Number(emotionTrendResult.data?.average_mood))
            ? Number(emotionTrendResult.data.average_mood)
            : null,
        }
      : null,
    sleepPattern: sleepSummary
      ? {
          summary: sleepSummary,
          pattern: normalizeString(sleepPatternResult.data?.pattern, 48),
          averageSleepHours: Number.isFinite(Number(sleepPatternResult.data?.average_sleep_hours))
            ? Number(sleepPatternResult.data.average_sleep_hours)
            : null,
        }
      : null,
    contentRecommendations: contentItems.length > 0
      ? contentItems.map((item) => ({
          title: normalizeString(item?.title, 80),
          reason: normalizeString(item?.recommendation_reason || item?.summary, 120),
          sourceType: normalizeString(item?.source_type, 32),
        }))
      : [],
  };
}

function buildGroundedContext({ citations = [], usedSources = [], groundingSummary = null, kbFreshness = null, analysisSignals = {}, lang = "zh" }) {
  const keyPoints = [];
  for (const citation of Array.isArray(citations) ? citations.slice(0, 3) : []) {
    const title = normalizeString(citation?.title, 80);
    const snippet = normalizeString(citation?.snippet || citation?.summary, 160);
    if (title || snippet) keyPoints.push([title, snippet].filter(Boolean).join(": "));
  }
  if (analysisSignals?.emotionalTrend?.summary) keyPoints.push(analysisSignals.emotionalTrend.summary);
  if (analysisSignals?.sleepPattern?.summary) keyPoints.push(analysisSignals.sleepPattern.summary);
  if (Array.isArray(analysisSignals?.contentRecommendations) && analysisSignals.contentRecommendations.length > 0) {
    keyPoints.push(
      lang === "en"
        ? `Relevant content suggestions: ${analysisSignals.contentRecommendations.map((item) => item.title).filter(Boolean).join(", ")}`
        : `相关内容建议：${analysisSignals.contentRecommendations.map((item) => item.title).filter(Boolean).join("、")}`
    );
  }

  const evidenceStrength = detectEvidenceStrength({ citations, analysisSignals });
  const kbHitCount = Number(groundingSummary?.total_citations || 0);
  const kbMiss = kbHitCount === 0;

  return {
    used_sources: normalizeStringList(usedSources, 40, 4),
    key_points: normalizeStringList(keyPoints, 180, 6),
    kb_hit_count: kbHitCount,
    kb_miss: kbMiss,
    evidence_strength: evidenceStrength,
    freshness_hint: buildFreshnessHint(kbFreshness, lang),
  };
}

function buildSoftFallbackBlocks({ lang, profileName, concernLabel, isCompanion, topic, needsClarification, featureRecommendations }) {
  return {
    acknowledge: buildAcknowledge({ lang, profileName, concernLabel, isCompanion }),
    suggest: buildSuggestList({ lang, topic: topic || "general" }),
    guide: buildGuide({
      lang,
      needsClarification,
      featureRecommendations,
      handoverRequired: false,
    }),
  };
}

function buildHardFallbackBlocks({ lang }) {
  return {
    acknowledge:
      lang === "en"
        ? "I hear this feels heavy right now."
        : "我知道你现在的感受很重。",
    suggest:
      lang === "en"
        ? ["Take one slow breath cycle first.", "Pick one small action for the next 10 minutes."]
        : ["先做一轮慢呼吸。", "只选一个10分钟内能完成的小动作。"],
    guide:
      lang === "en"
        ? "Tell me which part feels hardest right now."
        : "你现在最难受的是哪一部分？",
  };
}

function normalizeGeneratedBlocks(payload = {}, fallbackNeedsClarification = false) {
  const blocks = payload?.response_blocks && typeof payload.response_blocks === "object" ? payload.response_blocks : {};
  const acknowledge = normalizeString(blocks?.acknowledge, 240);
  const guide = normalizeString(blocks?.guide, 220);
  const suggest = Array.isArray(blocks?.suggest)
    ? blocks.suggest.map((item) => normalizeString(item, 160)).filter(Boolean).slice(0, 3)
    : [];

  if (!acknowledge || !guide || suggest.length === 0) {
    return null;
  }

  return {
    responseBlocks: {
      acknowledge,
      suggest,
      guide,
    },
    needsClarification:
      typeof payload?.needs_clarification === "boolean"
        ? payload.needs_clarification
        : Boolean(fallbackNeedsClarification),
    featureRecommendations: normalizeFeatureRecommendations(payload?.feature_recommendations),
    auditReason: normalizeString(payload?.audit_reason, 220),
    evidenceUsed: normalizeStringList(payload?.evidence_used, 80, 4),
    certaintyLevel: normalizeString(payload?.certainty_level, 16) || "low",
    generationMode: normalizeString(payload?.generation_mode, 40) || "grounded_answer",
  };
}

function buildGenerationUserPrompt({
  lang,
  message,
  topic,
  classification,
  concernLabel,
  riskLevel,
  memorySignals,
  groundingEvidence,
  needsClarification,
  agentHint,
  groundedContext,
  analysisSignals,
}) {
  return JSON.stringify(
    {
      task: "Generate supportive emotional response blocks",
      lang: lang === "en" ? "en" : "zh",
      message,
      topic,
      risk_level: riskLevel,
      classification: {
        primary_intent: classification?.primary_intent || "emotional_support",
        secondary_intents: Array.isArray(classification?.secondary_intents) ? classification.secondary_intents.slice(0, 3) : [],
        confidence: Number(classification?.confidence || 0),
        needs_clarification: Boolean(needsClarification),
      },
      concern_label: concernLabel,
      memory_signals: {
        last_primary_concern: memorySignals?.lastPrimaryConcern || "",
        pregnancy_week: memorySignals?.pregnancyWeek || "",
        tone_preference: memorySignals?.tonePreference || "",
        preferred_topics: Array.isArray(memorySignals?.preferredTopics) ? memorySignals.preferredTopics.slice(0, 4) : [],
      },
      grounded_context: groundedContext || {
        used_sources: [],
        key_points: [],
        kb_hit_count: 0,
        kb_miss: true,
        evidence_strength: "low",
        freshness_hint: "",
      },
      analysis_signals: {
        emotional_trend: analysisSignals?.emotionalTrend || null,
        sleep_pattern: analysisSignals?.sleepPattern || null,
        content_recommendations: Array.isArray(analysisSignals?.contentRecommendations)
          ? analysisSignals.contentRecommendations.slice(0, 3)
          : [],
      },
      agent_hint: normalizeString(agentHint, 180),
      grounding_evidence: Array.isArray(groundingEvidence)
        ? groundingEvidence.slice(0, 4).map((item) => ({
            id: item?.id,
            title: normalizeString(item?.title, 100),
            summary: normalizeString(item?.snippet || item?.summary, 220),
            source_type: normalizeString(item?.source_type || item?.sourceType, 32),
            tags: Array.isArray(item?.tags) ? item.tags.slice(0, 6) : [],
          }))
        : [],
      output_constraints: {
        suggest_items_range: [1, 3],
        sequence: ["acknowledge", "suggest", "guide"],
      },
    },
    null,
    2
  );
}

async function generateSupportAnswer({
  modelGateway,
  modelPreference,
  lang,
  message,
  topic,
  classification,
  concernLabel,
  riskLevel,
  memorySignals,
  groundingEvidence,
  needsClarification,
  agentHint,
  groundedContext,
  analysisSignals,
}) {
  if (!modelGateway || typeof modelGateway.completeJson !== "function") {
    return {
      ok: false,
      error: { code: "MODEL_GATEWAY_UNAVAILABLE", message: "Model gateway unavailable." },
      meta: {
        modelRequested: null,
        modelUsed: null,
        selectionReason: null,
        fallbackReason: "model_gateway_unavailable",
        latencyMs: 0,
      },
    };
  }

  const result = await modelGateway.completeJson({
    requestedModelKey: modelPreference?.modelKey,
    systemPrompt: buildEmotionalGenerationSystemPrompt(),
    userPrompt: buildGenerationUserPrompt({
      lang,
      message,
      topic,
      classification,
      concernLabel,
      riskLevel,
      memorySignals,
      groundingEvidence,
      needsClarification,
      agentHint,
      groundedContext,
      analysisSignals,
    }),
    responseSchema: EMOTIONAL_GENERATION_RESPONSE_SCHEMA,
  });

  const meta = {
    modelRequested: result?.modelRequested || null,
    modelUsed: result?.modelUsed || null,
    selectionReason: result?.selectionReason || null,
    fallbackReason: result?.fallbackReason || null,
    latencyMs: Number(result?.latencyMs || 0),
  };

  if (!result?.ok) {
    return {
      ok: false,
      error: result?.error || { code: "LLM_GENERATION_FAILED", message: "LLM generation failed." },
      meta,
    };
  }

  const normalized = normalizeGeneratedBlocks(result?.data || {}, needsClarification);
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

export function createEmotionalSupportAgent({ modelGateway = null, groundedRetrievalService = null } = {}) {
  return {
    async handle({
      lang,
      message,
      topic,
      classification,
      memoryPromptContext,
      riskLevel: routeRiskLevel = AGENT_RISK_LEVEL.R0,
      modelPreference = null,
      sourcePreference = "kb_first",
      feishuScopeId = "",
      clientContext = {},
      runTool,
    }) {
      const promptInput = buildEmotionalSupportPromptInput({
        message,
        lang,
        topic,
        classification,
        memoryPromptContext,
      });

      const needsClarification =
        classification?.primary_intent === INTENT_ID.UNRECOGNIZED_AMBIGUOUS ||
        Boolean(classification?.needs_clarification) ||
        Number(classification?.confidence || 0) < 0.6;

      const isCompanion = classification?.primary_intent === INTENT_ID.DAILY_COMPANIONSHIP;
      const inferredConcern = inferConcern({
        topic,
        classification,
      });
      const lastConcernRaw = String(promptInput.signals.lastPrimaryConcern || "").trim();
      const concernLabel = normalizeConcernLabel(lastConcernRaw || inferredConcern, lang);

      const riskResult = await runTool("assess_emotional_risk", {});
      const dangerResult = await runTool("detect_danger_signals", { text: message });
      const profileResult = await runTool("get_user_profile", {});

      const profileName = profileResult.ok ? profileResult.data?.profile?.name : "";
      const toolRisk = riskResult.ok ? normalizeRiskLevel(riskResult.data?.riskLevel) : AGENT_RISK_LEVEL.R0;
      const memoryRisk = normalizeRiskLevel(promptInput.signals.riskLevelCurrent);
      const routeRisk = normalizeRiskLevel(routeRiskLevel);
      const dangerCount = dangerResult.ok ? Number(dangerResult.data?.count || 0) : 0;
      const containsDirectHighRisk = containsAny(message, HIGH_RISK_KEYWORDS);

      const riskLevel = maxRisk(maxRisk(routeRisk, memoryRisk), toolRisk);
      const elevatedRisk = riskLevel === AGENT_RISK_LEVEL.R1;
      const highRisk =
        riskLevel === AGENT_RISK_LEVEL.R2 ||
        riskLevel === AGENT_RISK_LEVEL.R3 ||
        dangerCount > 0 ||
        containsDirectHighRisk;

      if (highRisk) {
        const escalation = buildEscalationPayload({
          riskLevel: riskLevel === AGENT_RISK_LEVEL.R3 || containsDirectHighRisk ? AGENT_RISK_LEVEL.R3 : AGENT_RISK_LEVEL.R2,
          lang,
          reasons: [
            ...(containsDirectHighRisk ? [lang === "en" ? "Detected direct high-risk wording." : "检测到直接高风险表达。"] : []),
            ...(dangerCount > 0 ? [lang === "en" ? `Detected ${dangerCount} danger signal(s).` : `识别到${dangerCount}条危险信号。`] : []),
          ],
        });

        const responseBlocks = {
          acknowledge:
            lang === "en"
              ? "I hear you, and your safety is the priority right now."
              : "我听到了，你的安全现在是第一优先。",
          suggest: (escalation?.actions || []).slice(0, 2),
          guide:
            lang === "en"
              ? "Please follow these safety steps now, and I will stay in safety mode."
              : "请先按这些安全步骤执行，我会保持在安全升级模式。",
        };

        const answer = composeAnswer({ lang, blocks: responseBlocks });
        return {
          answer,
          riskLevel: escalation?.level || AGENT_RISK_LEVEL.R2,
          nextActions: responseBlocks.suggest,
          response_blocks: responseBlocks,
          needs_clarification: false,
          feature_recommendations: [],
          handover: {
            required: true,
            target: "risk_escalation",
            reason: "high_risk_signal_detected",
            level: escalation?.level || AGENT_RISK_LEVEL.R2,
          },
          disclaimer: buildDisclaimer(lang),
          audit_reason: "High-risk signal detected inside EmotionalSupportAgent; handover required.",
          latestEmotionalState: {
            valence: "negative",
            arousal: "high",
            riskLevel: escalation?.level || AGENT_RISK_LEVEL.R2,
            inferredFrom: ["risk_tool", "danger_signal_tool", "prompt_memory"],
          },
          primaryDistressCandidate: {
            label: "high_risk_expression",
            confidence: escalation?.level === AGENT_RISK_LEVEL.R3 ? 1 : 0.92,
          },
          escalation,
          generationMeta: {
            generation_source: "template_fallback",
            prompt_version: EMOTIONAL_GENERATION_PROMPT_VERSION,
            kb_hit_count: 0,
            kb_miss: true,
            llm_error_code: null,
            llm_model_requested: null,
            llm_model_used: null,
            llm_latency_ms: 0,
          },
          kbFreshness: {
            status: "missing",
            checked_live: false,
            newest_updated_at: null,
            age_minutes: null,
            stale_after_minutes: null,
          },
          feishuMeta: {
            used: false,
            error_code: null,
          },
          searchMeta: null,
        };
      }

      const groundedResult =
        groundedRetrievalService && typeof groundedRetrievalService.retrieve === "function"
          ? await groundedRetrievalService.retrieve({
              message: buildKbQuery({ message, concernLabel, topic }),
              lang,
              topic: mapTopicToKbCategory(topic) || topic || "general",
              classification,
              promptSignals: promptInput.signals,
              sourcePreference,
              feishuScopeId,
              runTool,
              clientContext,
              webSearchAllowed: true,
            })
          : {
              citations: [],
              usedSources: [],
              groundingSummary: {
            total_citations: 0,
            source_breakdown: {},
            primary_source: null,
          },
          confidence: 0.42,
          fallbackReason: "grounded_retrieval_unavailable",
          kbFreshness: {
            status: "unknown",
            checked_live: false,
            newest_updated_at: null,
            age_minutes: null,
            stale_after_minutes: null,
          },
          feishuLiveMeta: {
            used: false,
            error_code: "GROUNDED_RETRIEVAL_UNAVAILABLE",
          },
          webMeta: null,
          semanticCandidates: [],
        };

      const emotionTrendResult = shouldAnalyzeEmotionalTrends({
        message,
        clientContext,
        classification,
        riskLevel,
      })
        ? await runTool("analyze_emotional_trends", {
            checkIns: Array.isArray(clientContext?.checkIns) ? clientContext.checkIns : [],
          })
        : { ok: false, data: null };

      const sleepPatternResult = shouldAnalyzeSleepPattern({
        message,
        topic,
        classification,
        clientContext,
      })
        ? await runTool("analyze_sleep_pattern", {
            checkIns: Array.isArray(clientContext?.checkIns) ? clientContext.checkIns : [],
          })
        : { ok: false, data: null };

      const contentRecommendationResult = shouldSearchContentRecommendations({
        message,
        riskLevel,
        classification,
      })
        ? await runTool("search_content_recommendations", {
            query: message,
            topic: mapTopicToKbCategory(topic) || topic || "emotional",
            topK: 3,
            lang,
          })
        : { ok: false, data: null };

      const analysisSignals = buildAnalysisSignals({
        emotionTrendResult,
        sleepPatternResult,
        contentRecommendationResult,
      });
      const groundedContext = buildGroundedContext({
        citations: groundedResult.citations,
        usedSources: groundedResult.usedSources,
        groundingSummary: groundedResult.groundingSummary,
        kbFreshness: groundedResult.kbFreshness,
        analysisSignals,
        lang,
      });
      const certaintyLevel = deriveCertaintyLevel(
        groundedContext.evidence_strength,
        groundedContext.kb_miss
      );

      const llmGenerated = await generateSupportAnswer({
        modelGateway,
        modelPreference,
        lang,
        message,
        topic,
        classification,
        concernLabel,
        riskLevel,
        memorySignals: promptInput.signals,
        groundingEvidence: groundedResult.citations,
        needsClarification,
        agentHint: clientContext?.promptPreset?.agentHint || "",
        groundedContext,
        analysisSignals,
      });

      const shouldRecommend = shouldRecommendFeatures({
        message,
        riskLevel,
        lastPrimaryConcern: lastConcernRaw,
        inferredConcern,
        classification,
      });

      let responseBlocks;
      let featureRecommendations = [];
      let finalNeedsClarification = needsClarification;
      let auditReason = "";
      let generationSource = "template_fallback";
      let llmErrorCode = null;
      let llmModelRequested = null;
      let llmModelUsed = null;
      let llmLatencyMs = 0;

      if (llmGenerated.ok) {
        responseBlocks = llmGenerated.data.responseBlocks;
        finalNeedsClarification = Boolean(llmGenerated.data.needsClarification);
        featureRecommendations = llmGenerated.data.featureRecommendations;
        generationSource = "llm";
        auditReason = llmGenerated.data.auditReason || "LLM generated emotional support blocks.";
        llmModelRequested = llmGenerated.meta.modelRequested;
        llmModelUsed = llmGenerated.meta.modelUsed;
        llmLatencyMs = llmGenerated.meta.latencyMs;
        if (Array.isArray(llmGenerated.data.evidenceUsed) && llmGenerated.data.evidenceUsed.length > 0) {
          groundedContext.used_sources = normalizeStringList(
            [...groundedContext.used_sources, ...llmGenerated.data.evidenceUsed],
            80,
            6
          );
        }
      } else {
        llmErrorCode = llmGenerated.error?.code || "LLM_GENERATION_FAILED";
        llmModelRequested = llmGenerated.meta.modelRequested;
        llmModelUsed = llmGenerated.meta.modelUsed;
        llmLatencyMs = llmGenerated.meta.latencyMs;
        responseBlocks =
          llmErrorCode === "INVALID_LLM_RESPONSE"
            ? buildHardFallbackBlocks({ lang })
            : buildSoftFallbackBlocks({
                lang,
                profileName,
                concernLabel,
                isCompanion,
                topic,
                needsClarification,
                featureRecommendations: [],
              });
        auditReason = needsClarification
          ? "Low confidence/ambiguous emotional query handled with clarify-once strategy."
          : `Template fallback used due to ${llmErrorCode}.`;
      }

      if (riskLevel === AGENT_RISK_LEVEL.R0 || riskLevel === AGENT_RISK_LEVEL.R1) {
        if (featureRecommendations.length === 0 && shouldRecommend) {
          featureRecommendations = buildFeatureRecommendations({ lang, topic });
        }
      } else {
        featureRecommendations = [];
      }

      responseBlocks.guide = buildGuide({
        lang,
        needsClarification: finalNeedsClarification,
        featureRecommendations,
        handoverRequired: false,
      });

      let answer = composeAnswer({ lang, blocks: responseBlocks });
      answer = sanitizeAgainstBannedPhrases(answer, lang);

      const recommendationTopic = topic === "general" ? "emotional_regulation_micro_step" : `${topic}_micro_step`;

      return {
        answer,
        riskLevel: elevatedRisk ? AGENT_RISK_LEVEL.R1 : AGENT_RISK_LEVEL.R0,
        nextActions: responseBlocks.suggest,
        response_blocks: responseBlocks,
        needs_clarification: finalNeedsClarification,
        feature_recommendations: featureRecommendations,
        handover: {
          required: false,
        },
        disclaimer: buildDisclaimer(lang),
        audit_reason: auditReason,
        latestRecommendation: {
          topic: featureRecommendations[0]?.feature_id || recommendationTopic,
          contentId: null,
          reason: featureRecommendations.length
            ? `feature:${featureRecommendations[0].feature_id}`
            : `intent:${classification?.primary_intent || INTENT_ID.EMOTIONAL_SUPPORT}`,
          feedbackStatus: "pending",
        },
        latestEmotionalState: {
          valence: elevatedRisk ? "negative" : "neutral",
          arousal: elevatedRisk ? "high" : "medium",
          riskLevel: elevatedRisk ? AGENT_RISK_LEVEL.R1 : AGENT_RISK_LEVEL.R0,
          inferredFrom: ["intent_classifier", "risk_tool", "prompt_memory"],
        },
        primaryDistressCandidate: {
          label: inferredConcern,
          confidence: Number(Math.max(0.45, Math.min(0.95, Number(classification?.confidence || 0.72))).toFixed(2)),
        },
        escalation: null,
        citations: groundedResult.citations,
        usedSources: groundedResult.usedSources,
        groundingSummary: groundedResult.groundingSummary,
        confidence: groundedResult.confidence,
        fallbackReason: groundedResult.fallbackReason || llmErrorCode,
        kbFreshness: groundedResult.kbFreshness || null,
        feishuMeta: groundedResult.feishuLiveMeta || null,
        generationMeta: {
          generation_source: generationSource,
          prompt_version: EMOTIONAL_GENERATION_PROMPT_VERSION,
          kb_hit_count: groundedResult.groundingSummary?.total_citations || 0,
          kb_miss: (groundedResult.groundingSummary?.total_citations || 0) === 0,
          evidence_used: groundedContext.used_sources,
          certainty_level: llmGenerated.ok ? llmGenerated.data.certaintyLevel || certaintyLevel : certaintyLevel,
          generation_mode: llmGenerated.ok ? llmGenerated.data.generationMode || "grounded_answer" : llmErrorCode === "INVALID_LLM_RESPONSE" ? "hard_safe_fallback" : "soft_template_fallback",
          llm_error_code: llmErrorCode,
          llm_model_requested: llmModelRequested,
          llm_model_used: llmModelUsed,
          llm_latency_ms: llmLatencyMs,
        },
        searchMeta: groundedResult.webMeta,
      };
    },
  };
}
