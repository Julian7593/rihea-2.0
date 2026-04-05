import { AGENT_ROUTE, AGENT_RISK_LEVEL, TOOL_MAX_CALLS_PER_TURN, maxRiskLevel, normalizeLang } from "./constants.js";
import { createRouterAgent } from "./routerAgent.js";
import { createEmotionalSupportAgent } from "./subAgents/emotionalSupportAgent.js";
import { createFeatureGuideAgent } from "./subAgents/featureGuideAgent.js";
import { createRiskEscalationAgent } from "./subAgents/riskEscalationAgent.js";
import { runSafetyPrecheck } from "./safety/precheck.js";
import { runSafetyPostcheck } from "./safety/postcheck.js";
import { buildEscalationPayload } from "./safety/escalationPolicy.js";
import { createToolRegistry } from "./tools/toolRegistry.js";
import { createToolExecutor } from "./tools/toolExecutor.js";
import { composeAgentResponse } from "./responseComposer.js";

function ensureString(value, fieldName, maxLength = 6000) {
  if (typeof value !== "string") {
    const error = new Error(`${fieldName} must be a string.`);
    error.code = "AGENT_INVALID_INPUT";
    error.statusCode = 400;
    throw error;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    const error = new Error(`${fieldName} cannot be empty.`);
    error.code = "AGENT_INVALID_INPUT";
    error.statusCode = 400;
    throw error;
  }
  return trimmed.slice(0, maxLength);
}

function ensureObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value;
}

function buildDisclaimer(lang) {
  if (lang === "en") {
    return "This assistant provides supportive information only and does not replace licensed medical or mental health professionals.";
  }
  return "本助手仅提供支持性健康信息，不替代执业医生或心理专业人士。";
}

function parseRange(range) {
  const safe = String(range || "30d").trim().toLowerCase();
  if (safe === "all") return "all";
  if (!/^\d+d$/.test(safe)) return "30d";
  return safe;
}

function buildSafeFallbackAgentResult(lang) {
  if (lang === "en") {
    return {
      answer: "I could not confidently classify your request yet. Tell me one priority now: mood, sleep, diet, exercise, or app feature guidance.",
      riskLevel: AGENT_RISK_LEVEL.R0,
      nextActions: ["Reply with one priority only, and I will provide an actionable next step."],
      escalation: null,
    };
  }
  return {
    answer: "我暂时无法高置信识别你的问题类型。请先告诉我一个当前最优先项：情绪、睡眠、饮食、运动，或功能使用。",
    riskLevel: AGENT_RISK_LEVEL.R0,
    nextActions: ["只回复一个优先项，我会给你可执行下一步。"],
    escalation: null,
  };
}

function sanitizeRoutingDecision(decision = {}) {
  return {
    route: decision?.route || AGENT_ROUTE.EMOTIONAL_SUPPORT,
    topic: decision?.topic || "general",
    classification: decision?.classification || null,
    risk: decision?.risk || null,
    retrieval_plan: decision?.retrieval_plan || null,
    fallback: decision?.fallback || null,
    escalation: decision?.escalation || null,
    reason: decision?.reason || "",
    audit_trace: decision?.audit_trace || null,
  };
}

function mapIntentToDistressLabel(intent, topic) {
  if (intent === "high_risk_expressions") return "high_risk_expression";
  if (intent === "sleep_advice" || topic === "sleep") return "sleep_disturbance";
  if (intent === "dietary_advice" || topic === "diet") return "diet_concern";
  if (intent === "exercise_advice" || topic === "exercise") return "exercise_concern";
  if (intent === "content_recommendation" || topic === "content") return "content_support_need";
  if (intent === "app_feature_explanation" || topic === "feature") return "feature_help_request";
  if (intent === "daily_companionship" || topic === "companionship") return "companionship_need";
  return "emotional_distress";
}

function derivePrimaryDistressCandidate({ routeDecision, riskLevel }) {
  const classification = routeDecision?.classification || {};
  const confidenceBase = Number(classification?.confidence);
  const boundedConfidence = Number.isFinite(confidenceBase)
    ? Math.max(0, Math.min(1, confidenceBase))
    : 0.55;
  const riskBoost = riskLevel === AGENT_RISK_LEVEL.R3 ? 0.3 : riskLevel === AGENT_RISK_LEVEL.R2 ? 0.2 : 0;
  const confidence = Number(Math.min(1, boundedConfidence + riskBoost).toFixed(2));
  return {
    label: mapIntentToDistressLabel(classification?.primary_intent, routeDecision?.topic),
    confidence,
  };
}

function deriveLatestRecommendation({ routeDecision, agentResult, timestamp }) {
  if (agentResult?.latestRecommendation && typeof agentResult.latestRecommendation === "object") {
    return {
      ...agentResult.latestRecommendation,
      recommendedAt: timestamp,
    };
  }

  const primaryIntent = routeDecision?.classification?.primary_intent || "";
  const isTopicalIntent = ["sleep_advice", "dietary_advice", "exercise_advice", "content_recommendation"].includes(primaryIntent);
  const hasAction = Array.isArray(agentResult?.nextActions) && agentResult.nextActions.length > 0;
  if (!isTopicalIntent || !hasAction) return null;

  return {
    topic: routeDecision?.topic || primaryIntent,
    contentId: null,
    reason: `intent:${primaryIntent}`,
    recommendedAt: timestamp,
    feedbackStatus: "pending",
  };
}

function deriveLatestEmotionalState({ routeDecision, riskLevel, checkIns }) {
  const primaryIntent = routeDecision?.classification?.primary_intent || "";
  const inferredFrom = ["intent_classifier"];
  if (riskLevel !== AGENT_RISK_LEVEL.R0) inferredFrom.push("risk_precheck");
  if (Array.isArray(checkIns) && checkIns.length > 0) inferredFrom.push("checkin_summary");

  const valence =
    riskLevel === AGENT_RISK_LEVEL.R2 || riskLevel === AGENT_RISK_LEVEL.R3
      ? "negative"
      : ["emotional_support", "daily_companionship", "sleep_advice"].includes(primaryIntent)
        ? "negative"
        : "neutral";
  const arousal =
    riskLevel === AGENT_RISK_LEVEL.R2 || riskLevel === AGENT_RISK_LEVEL.R3
      ? "high"
      : primaryIntent === "app_feature_explanation"
        ? "low"
        : "medium";

  return {
    valence,
    arousal,
    riskLevel,
    inferredFrom,
  };
}

function extractSafetyRuleIds(precheck = {}) {
  const signalIds = Array.isArray(precheck?.matchedSignals)
    ? precheck.matchedSignals
        .map((signal) => signal?.id || signal?.type || "")
        .filter((value) => typeof value === "string" && value)
    : [];
  const reasonTokens = Array.isArray(precheck?.reasons)
    ? precheck.reasons.map((reason) => String(reason || "").slice(0, 48)).filter(Boolean)
    : [];
  return [...new Set([...signalIds, ...reasonTokens])].slice(0, 10);
}

const WEB_SEARCH_HINT_KEYWORDS = [
  "最新",
  "最近",
  "更新",
  "对比",
  "指南",
  "新闻",
  "today",
  "latest",
  "recent",
  "update",
  "compare",
  "guideline",
];

function containsKeyword(text, keywords = []) {
  const safe = String(text || "").toLowerCase();
  return keywords.some((item) => safe.includes(String(item || "").toLowerCase()));
}

function normalizeSources(items = []) {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => ({
      title: String(item?.title || "").trim().slice(0, 180),
      url: String(item?.url || item?.source_url || "").trim().slice(0, 600),
      snippet: String(item?.snippet || item?.summary || "").trim().slice(0, 260),
      domain: String(item?.domain || "").trim().toLowerCase().slice(0, 120),
      published_at: item?.published_at || item?.updated_at ? String(item?.published_at || item?.updated_at).trim().slice(0, 40) : undefined,
    }))
    .map((item) => ({
      ...item,
      domain: item.domain || (item.url ? (() => {
        try {
          return new URL(item.url).hostname.toLowerCase();
        } catch {
          return "";
        }
      })() : ""),
    }))
    .filter((item) => item.title && item.url && item.domain);
}

function normalizeCitations(items = []) {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => ({
      id: String(item?.id || item?.url || "").trim().slice(0, 80),
      title: String(item?.title || "").trim().slice(0, 180),
      snippet: String(item?.snippet || item?.summary || "").trim().slice(0, 260),
      url: String(item?.url || item?.source_url || "").trim().slice(0, 600),
      source_type: String(item?.source_type || item?.sourceType || "local_kb").trim().slice(0, 32),
      scope_id: String(item?.scope_id || item?.scopeId || "").trim().slice(0, 64),
      updated_at: item?.updated_at || item?.published_at ? String(item?.updated_at || item?.published_at).trim().slice(0, 40) : undefined,
      score: Number.isFinite(Number(item?.score)) ? Number(item.score) : 0,
    }))
    .filter((item) => item.title && item.url);
}

function buildWebSearchQuery({ message, classification, topic, lang }) {
  const primaryIntent = classification?.primary_intent || "general";
  const suffix = lang === "en" ? "pregnancy emotional wellness guidance" : "孕期 情绪 健康 指南";
  const topicHint = topic && topic !== "general" ? topic : primaryIntent;
  return `${String(message || "").slice(0, 160)} ${topicHint} ${suffix}`.trim();
}

function shouldTriggerWebSearch({ message, riskLevel, retrievalPlan, kbMiss }) {
  if (riskLevel === AGENT_RISK_LEVEL.R2 || riskLevel === AGENT_RISK_LEVEL.R3) return false;
  const timelyNeed = containsKeyword(message, WEB_SEARCH_HINT_KEYWORDS);
  const kbBackfillNeed = Boolean(retrievalPlan?.read_kb) && Boolean(kbMiss);
  return timelyNeed || kbBackfillNeed;
}

function buildReasoningSummary({
  classification,
  riskLevel,
  escalation,
  routingDecision,
  toolTrace,
  skillTrace,
  generationMeta,
  searchMeta,
  usedSources,
  kbFreshness,
  confidence,
  fallbackReason,
  feishuLiveErrorCode,
}) {
  return {
    intent: {
      primary: classification?.primary_intent || "unknown",
      confidence: Number(classification?.confidence || 0),
      stage: classification?.stage || "rule",
    },
    safety: {
      risk_level: riskLevel,
      escalation_required: Boolean(escalation?.required),
      override_applied: Boolean(routingDecision?.risk?.override_applied),
    },
    retrieval: {
      kb_hit_count: Number(generationMeta?.kb_hit_count || 0),
      kb_miss: Boolean(generationMeta?.kb_miss),
      web_used: Boolean(searchMeta?.used),
      used_sources: Array.isArray(usedSources) ? usedSources : [],
      kb_freshness: kbFreshness || null,
      feishu_live_error_code: feishuLiveErrorCode || null,
    },
    generation: {
      generation_source: generationMeta?.generation_source || "template_fallback",
      model_used: generationMeta?.llm_model_used || routingDecision?.audit_trace?.llm_model_used || null,
      prompt_version: generationMeta?.prompt_version || null,
      confidence: Number.isFinite(Number(confidence)) ? Number(confidence) : null,
      fallback_reason: fallbackReason || null,
      feature_intent_type: generationMeta?.feature_intent_type || null,
      path_confidence: Number.isFinite(Number(generationMeta?.path_confidence))
        ? Number(generationMeta.path_confidence)
        : null,
      used_product_evidence:
        typeof generationMeta?.used_product_evidence === "boolean" ? generationMeta.used_product_evidence : null,
    },
    trace_refs: {
      tools: Array.isArray(toolTrace)
        ? toolTrace.slice(0, 6).map((item) => ({
            name: item?.toolName || "",
            type: item?.toolType || "tool",
            ok: !item?.error,
            latency_ms: Number(item?.durationMs || 0),
            permission_level: item?.permissionLevel || null,
          }))
        : [],
      skills: Array.isArray(skillTrace)
        ? skillTrace.slice(0, 4).map((item) => ({
            name: item?.skill_name || "",
            version: item?.skill_version || "",
            error: item?.error || null,
            permission_level: item?.permission_level || null,
            draft_effects_summary: item?.draft_effects_summary || null,
          }))
        : [],
      workflows: Array.isArray(toolTrace)
        ? toolTrace
            .filter((item) => item?.toolType === "workflow")
            .slice(0, 3)
            .map((item) => ({
              name: item?.toolName || "",
              permission_level: item?.permissionLevel || null,
              status: item?.status || "",
            }))
        : [],
    },
  };
}

export function createAgentOrchestratorService({
  sessionMemoryStore,
  userStateMemoryStore,
  auditLogger,
  cbtService,
  knowledgeBaseService = null,
  nutritionService = null,
  feishuSyncIndex = null,
  feishuLiveService = null,
  webSearchService = null,
  promptPresetService = null,
  routerAgent = createRouterAgent(),
  emotionalSupportAgent = createEmotionalSupportAgent(),
  featureGuideAgent = createFeatureGuideAgent(),
  riskEscalationAgent = createRiskEscalationAgent(),
  toolCallLimit = TOOL_MAX_CALLS_PER_TURN,
  now = () => new Date(),
}) {
  const toolRegistry = createToolRegistry({
    cbtService,
    auditLogger,
    knowledgeBaseService,
    nutritionService,
    feishuSyncIndex,
    feishuLiveService,
    webSearchService,
  });

  const subAgentMap = {
    [AGENT_ROUTE.EMOTIONAL_SUPPORT]: emotionalSupportAgent,
    [AGENT_ROUTE.FEATURE_GUIDE]: featureGuideAgent,
    [AGENT_ROUTE.RISK_ESCALATION]: riskEscalationAgent,
  };

  return {
    async chat(input = {}, { requestId } = {}) {
      const userId = ensureString(input.userId, "userId", 128);
      const sessionId = ensureString(input.sessionId, "sessionId", 128);
      const message = ensureString(input.message, "message");
      const lang = normalizeLang(input.lang);
      const clientContext = ensureObject(input.clientContext);
      const presetQuestionId = typeof input.presetQuestionId === "string" ? input.presetQuestionId.trim().slice(0, 64) : "";
      const sourcePreference = typeof input.sourcePreference === "string" ? input.sourcePreference.trim().slice(0, 48) : "";
      const feishuScopeId = typeof input.feishuScopeId === "string" ? input.feishuScopeId.trim().slice(0, 64) : "";
      const promptPreset = promptPresetService?.getById?.(presetQuestionId) || null;
      const checkIns = Array.isArray(clientContext.checkIns) ? clientContext.checkIns : [];
      const routerCapabilities = {
        kb_available:
          toolRegistry.has("search_knowledge_base") || toolRegistry.has("search_local_kb") || toolRegistry.has("search_feishu_sync"),
        profile_available: toolRegistry.has("get_user_profile"),
        memory_available: Boolean(userStateMemoryStore && typeof userStateMemoryStore.getPromptContext === "function"),
        sub_agents: Object.keys(subAgentMap),
      };
      const routerMemoryPromptContext =
        userStateMemoryStore && typeof userStateMemoryStore.getPromptContext === "function"
          ? await userStateMemoryStore.getPromptContext({
              userId,
              intent: "general",
              maxFields: 10,
            })
          : null;

      const precheck = runSafetyPrecheck({
        message,
        checkIns,
        lang,
      });
      const routeDecision = await routerAgent.route({
        message,
        lang,
        precheck,
        requestId: requestId || "",
        userId,
        sessionId,
        clientContext: {
          ...clientContext,
          promptPreset,
          sourcePreference: sourcePreference || promptPreset?.preferredSourceScope || "",
          feishuScopeId: feishuScopeId || promptPreset?.feishuScopeId || "",
        },
        memoryPromptContext: routerMemoryPromptContext,
        routerCapabilities,
      });
      const routingDecision = sanitizeRoutingDecision(routeDecision);
      const selectedSubAgent = subAgentMap[routingDecision.route] || emotionalSupportAgent;
      const memoryPromptContext =
        userStateMemoryStore && typeof userStateMemoryStore.getPromptContext === "function"
          ? await userStateMemoryStore.getPromptContext({
              userId,
              intent: routingDecision.topic || "general",
            })
          : null;

      const toolExecutor = createToolExecutor({
        registry: toolRegistry,
        maxCalls: toolCallLimit,
      });

      const toolContext = {
        requestId: requestId || "",
        userId,
        sessionId,
        lang,
        message,
        clientContext: {
          ...clientContext,
          promptPreset,
          sourcePreference: sourcePreference || promptPreset?.preferredSourceScope || "",
          feishuScopeId: feishuScopeId || promptPreset?.feishuScopeId || "",
        },
      };

      const agentResult =
        routingDecision?.fallback?.triggered && routingDecision?.fallback?.strategy === "safe_default_response"
          ? buildSafeFallbackAgentResult(lang)
          : await selectedSubAgent.handle({
              message,
              lang,
              topic: routingDecision.topic || "general",
              classification: routingDecision.classification || null,
              riskLevel: precheck.stopNormalFlow ? precheck.riskLevel : AGENT_RISK_LEVEL.R0,
              precheckReasons: precheck.reasons || [],
              memoryPromptContext,
              modelPreference:
                clientContext?.modelPreference && typeof clientContext.modelPreference === "object"
                  ? clientContext.modelPreference
                  : null,
              sourcePreference: sourcePreference || promptPreset?.preferredSourceScope || "kb_first",
              feishuScopeId: feishuScopeId || promptPreset?.feishuScopeId || "",
              clientContext: {
                ...clientContext,
                promptPreset,
              },
              runTool: (toolName, toolInput) => toolExecutor.run(toolName, toolInput, toolContext),
            });
      const generationMeta = agentResult?.generationMeta && typeof agentResult.generationMeta === "object"
        ? agentResult.generationMeta
        : null;
      const kbHitCount = Number(generationMeta?.kb_hit_count || 0);
      const kbMiss = Boolean(routingDecision?.retrieval_plan?.read_kb) && kbHitCount === 0;
      const provisionalRiskLevel = maxRiskLevel(
        maxRiskLevel(precheck.riskLevel, routingDecision?.risk?.level || AGENT_RISK_LEVEL.R0),
        agentResult?.riskLevel || AGENT_RISK_LEVEL.R0
      );
      let citations = normalizeCitations(agentResult?.citations || []);
      let sources = normalizeSources(citations);
      let usedSources = Array.isArray(agentResult?.usedSources) ? agentResult.usedSources : [];
      let groundingSummary =
        agentResult?.groundingSummary && typeof agentResult.groundingSummary === "object"
          ? agentResult.groundingSummary
          : null;
      let kbFreshness =
        agentResult?.kbFreshness && typeof agentResult.kbFreshness === "object"
          ? agentResult.kbFreshness
          : null;
      let feishuLiveErrorCode =
        agentResult?.feishuMeta && typeof agentResult.feishuMeta === "object"
          ? agentResult.feishuMeta.error_code || null
          : null;
      let confidence = Number.isFinite(Number(agentResult?.confidence)) ? Number(agentResult.confidence) : null;
      let fallbackReason = agentResult?.fallbackReason || null;
      let searchMeta =
        agentResult?.searchMeta && typeof agentResult.searchMeta === "object"
          ? agentResult.searchMeta
          : {
              used: false,
              query: "",
              latency_ms: 0,
              provider: "disabled",
              error_code: "NOT_TRIGGERED",
            };

      if (citations.length === 0 && shouldTriggerWebSearch({
        message,
        riskLevel: provisionalRiskLevel,
        retrievalPlan: routingDecision?.retrieval_plan || null,
        kbMiss,
      })) {
        const searchResult = await toolExecutor.run(
          "search_web",
          {
            query: buildWebSearchQuery({
              message,
              classification: routingDecision?.classification || null,
              topic: routingDecision?.topic || "general",
              lang,
            }),
            lang,
            topK: 5,
          },
          toolContext
        );
        if (searchResult.ok) {
          citations = normalizeCitations(
            Array.isArray(searchResult.data?.sources)
              ? searchResult.data.sources.map((item) => ({
                  ...item,
                  source_type: "web",
                  source_url: item?.url,
                  summary: item?.snippet,
                  updated_at: item?.published_at,
                }))
              : []
          );
          sources = normalizeSources(citations);
          usedSources = citations.length > 0 ? ["web"] : [];
          groundingSummary = {
            total_citations: citations.length,
            source_breakdown: citations.length > 0 ? { web: citations.length } : {},
            primary_source: citations[0]?.source_type || null,
          };
          confidence = citations.length > 0 ? 0.64 : 0.42;
          fallbackReason = citations.length > 0 ? null : "web_search_no_match";
          searchMeta = {
            used: Boolean(searchResult.data?.search_meta?.used),
            query: String(searchResult.data?.search_meta?.query || ""),
            latency_ms: Number(searchResult.data?.search_meta?.latency_ms || 0),
            provider: String(searchResult.data?.search_meta?.provider || "unknown"),
            error_code: searchResult.data?.search_meta?.error_code || null,
          };
        } else {
          searchMeta = {
            used: false,
            query: buildWebSearchQuery({
              message,
              classification: routingDecision?.classification || null,
              topic: routingDecision?.topic || "general",
              lang,
            }),
            latency_ms: 0,
            provider: "tool_registry",
            error_code: String(searchResult.error || "SEARCH_TOOL_FAILED"),
          };
          fallbackReason = "web_search_failed";
        }
      }

      const toolTrace = toolExecutor.getTrace();
      const skillTrace = toolTrace
        .filter((item) => item?.toolType === "skill")
        .map((item) => ({
          skill_name: item?.skillName || item?.toolName || "",
          skill_version: item?.skillVersion || "",
          input_summary: item?.inputSummary || null,
          output_summary: item?.outputSummary || null,
          latency_ms: Number(item?.durationMs || 0),
          error: item?.error || null,
          permission_level: item?.permissionLevel || null,
          draft_effects_summary: item?.draftEffectsSummary || null,
        }));
      routingDecision.audit_trace = {
        ...(routingDecision.audit_trace || {}),
        generation_source: generationMeta?.generation_source || "template_fallback",
        prompt_version: generationMeta?.prompt_version || null,
        kb_hit_count: kbHitCount,
        kb_miss: generationMeta?.kb_miss === true ? true : kbMiss,
        prompt_only_mode: generationMeta?.kb_miss === true ? true : kbMiss,
        used_sources: usedSources,
        grounding_confidence: confidence,
        grounding_fallback_reason: fallbackReason,
        kb_freshness: kbFreshness,
        feishu_live_error_code: feishuLiveErrorCode,
        web_used: Boolean(searchMeta?.used),
        web_provider: searchMeta?.provider || null,
        web_error_code: searchMeta?.error_code || null,
        feature_intent_type: generationMeta?.feature_intent_type || null,
        path_confidence: Number.isFinite(Number(generationMeta?.path_confidence))
          ? Number(generationMeta.path_confidence)
          : null,
        used_product_evidence:
          typeof generationMeta?.used_product_evidence === "boolean" ? generationMeta.used_product_evidence : null,
        skill_trace: skillTrace,
      };

      let finalRiskLevel = maxRiskLevel(
        maxRiskLevel(precheck.riskLevel, routingDecision?.risk?.level || AGENT_RISK_LEVEL.R0),
        agentResult?.riskLevel || AGENT_RISK_LEVEL.R0
      );
      let escalation =
        routingDecision?.escalation?.required && (routingDecision.escalation.level === AGENT_RISK_LEVEL.R2 || routingDecision.escalation.level === AGENT_RISK_LEVEL.R3)
          ? buildEscalationPayload({
              riskLevel: routingDecision.escalation.level,
              lang,
              reasons: routingDecision?.risk?.reasons || precheck.reasons || [],
            })
          : agentResult?.escalation || null;
      if (!escalation && (finalRiskLevel === AGENT_RISK_LEVEL.R2 || finalRiskLevel === AGENT_RISK_LEVEL.R3)) {
        escalation = buildEscalationPayload({
          riskLevel: finalRiskLevel,
          lang,
          reasons: precheck.reasons || [],
        });
      }

      const postchecked = runSafetyPostcheck({
        answer: agentResult?.answer || "",
        disclaimer: buildDisclaimer(lang),
        lang,
      });
      const reasoningSummary = buildReasoningSummary({
        classification: routingDecision.classification || null,
        riskLevel: finalRiskLevel,
        escalation,
        routingDecision,
        toolTrace,
        skillTrace,
        generationMeta,
        searchMeta,
        usedSources,
        kbFreshness,
        confidence,
        fallbackReason,
        feishuLiveErrorCode,
      });
      const nowIso = now().toISOString();
      const safetyRuleIds = extractSafetyRuleIds(precheck);
      const latestRecommendation = deriveLatestRecommendation({
        routeDecision: routingDecision,
        agentResult,
        timestamp: nowIso,
      });
      const latestEmotionalState = deriveLatestEmotionalState({
        routeDecision: routingDecision,
        riskLevel: finalRiskLevel,
        checkIns,
      });
      const primaryDistressCandidate = derivePrimaryDistressCandidate({
        routeDecision: routingDecision,
        riskLevel: finalRiskLevel,
      });

      const memoryUpdateSession = await sessionMemoryStore.appendRound({
        sessionId,
        userId,
        lang,
        userMessage: message,
        assistantMessage: postchecked.answer,
        metadata: {
          route: routingDecision.route,
          reason: routingDecision.reason,
          riskLevel: finalRiskLevel,
          escalated: Boolean(escalation?.required),
          classification: routingDecision.classification || null,
          topic: routingDecision.topic || "general",
          retrievalPlan: routingDecision.retrieval_plan || null,
          fallback: routingDecision.fallback || null,
          routerAudit: routingDecision.audit_trace || null,
          toolTrace,
          nextActions: agentResult?.nextActions || [],
          latestRecommendation,
          latestEmotionalState,
          primaryDistressCandidate,
          safetyTriggered: Boolean(precheck.stopNormalFlow || escalation?.required),
          safetyRuleIds,
          checkInsCount: checkIns.length,
        },
      });
      const memoryUpdateUser = await userStateMemoryStore.updateFromTurn({
        userId,
        sessionId,
        profile: clientContext.profile || {},
        riskLevel: finalRiskLevel,
        escalated: Boolean(escalation?.required),
        classification: routingDecision.classification || null,
        shortTermMemory: memoryUpdateSession.shortTermMemory || null,
        message,
        lang,
        clientContext,
      });

      await auditLogger.log({
        type: "CHAT",
        userId,
        sessionId,
        requestId: requestId || "",
        route: routingDecision.route,
        routeReason: routingDecision.reason,
        classification: routingDecision.classification || null,
        routing: routingDecision,
        riskLevel: finalRiskLevel,
        toolTrace,
        modelPreference:
          clientContext?.modelPreference && typeof clientContext.modelPreference === "object"
            ? clientContext.modelPreference
            : null,
      });

      if (escalation?.required) {
        await auditLogger.log({
          type: "ESCALATION",
          userId,
          sessionId,
          requestId: requestId || "",
          riskLevel: finalRiskLevel,
          reasons: escalation.reasons || [],
          route: routingDecision.route,
          classification: routingDecision.classification || null,
          routing: routingDecision,
          source: "orchestrator",
        });
      }

      return composeAgentResponse({
        answer: postchecked.answer,
        answerRaw: postchecked.answer,
        riskLevel: finalRiskLevel,
        disclaimer: postchecked.disclaimer,
        nextActions: agentResult?.nextActions || [],
        escalation,
        classification: routingDecision.classification || null,
        routing: routingDecision,
        toolTrace,
        reasoningSummary,
        sources,
        citations,
        usedSources,
        groundingSummary,
        kbFreshness,
        confidence,
        fallbackReason,
        relatedQuestionCards: promptPresetService?.list?.({ lang })?.slice(0, 6) || [],
        searchMeta,
        memoryUpdates: {
          session: {
            sessionId: memoryUpdateSession.sessionId,
            roundCount: memoryUpdateSession.roundCount,
            trimmed: memoryUpdateSession.trimmed,
            shortTermMemory: memoryUpdateSession.shortTermMemory || null,
          },
          userState: {
            riskLevel: memoryUpdateUser.riskLevel,
            escalationCount: memoryUpdateUser.escalationCount,
            lastUpdatedAt: memoryUpdateUser.lastUpdatedAt,
            userProfile: {
              riskLevelCurrent: memoryUpdateUser.user_profile?.risk_level_current || memoryUpdateUser.riskLevel,
              lastPrimaryConcern: memoryUpdateUser.user_profile?.last_primary_concern || "",
              escalationCount30d: memoryUpdateUser.user_profile?.escalation_count_30d || memoryUpdateUser.escalationCount || 0,
            },
          },
        },
      });
    },

    async getPromptPresets({ lang, category }) {
      const safeLang = normalizeLang(lang);
      return {
        lang: safeLang,
        category: typeof category === "string" ? category : "",
        items: promptPresetService?.list?.({ lang: safeLang, category }) || [],
      };
    },

    async getSessionHistory({ sessionId, userId }) {
      const safeSessionId = ensureString(sessionId, "sessionId", 128);
      const safeUserId = ensureString(userId, "userId", 128);
      const history = await sessionMemoryStore.getHistory({
        sessionId: safeSessionId,
        userId: safeUserId,
      });
      return history;
    },

    async getEscalations({ userId, range }) {
      const safeUserId = ensureString(userId, "userId", 128);
      const safeRange = parseRange(range);
      const items = await auditLogger.getEscalations({
        userId: safeUserId,
        range: safeRange,
      });
      return {
        userId: safeUserId,
        range: safeRange,
        items,
      };
    },

    listTools() {
      return toolRegistry.list();
    },

    discoverSkills(filters = {}) {
      return toolRegistry.discoverSkills(filters);
    },
  };
}
