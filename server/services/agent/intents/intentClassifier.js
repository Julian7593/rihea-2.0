import {
  AGENT_ROUTE,
  AGENT_RISK_LEVEL,
  CLARIFY_CONFIDENCE_THRESHOLD,
  ROUTE_CONFIDENCE_THRESHOLD,
} from "../constants.js";
import { classifyIntentByRules } from "./ruleBasedClassifier.js";
import { createLlmSecondaryIntentEvaluator } from "./llmSecondaryEvaluator.js";
import { INTENT_ID, getIntentConfig } from "./taxonomy.js";

const MEMORY_SLOT_ALLOWLIST = {
  general: ["risk_level_current", "last_primary_concern", "pregnancy_week", "conversation_tone_pref"],
  sleep: ["risk_level_current", "last_primary_concern", "pregnancy_week", "lifestyle_trends", "content_pref_topics"],
  diet: ["risk_level_current", "pregnancy_week", "allergy_tags", "medical_contraindication_tags", "lifestyle_trends"],
  exercise: ["risk_level_current", "pregnancy_week", "medical_contraindication_tags", "lifestyle_trends"],
  content: ["risk_level_current", "content_pref_topics", "content_preferences", "faq_type_top3"],
  feature: ["risk_level_current", "feature_preferences", "faq_type_top3"],
  companionship: ["risk_level_current", "last_primary_concern", "conversation_tone_pref"],
  risk: ["risk_level_current", "risk_level_baseline", "last_primary_concern", "sensitive_reminder_pref"],
};

function mapIntentToMvpRoute(intentId) {
  if (intentId === INTENT_ID.HIGH_RISK_EXPRESSIONS) return AGENT_ROUTE.RISK_ESCALATION;
  if (intentId === INTENT_ID.APP_FEATURE_EXPLANATION) return AGENT_ROUTE.FEATURE_GUIDE;
  return AGENT_ROUTE.EMOTIONAL_SUPPORT;
}

function mapIntentToTopic(intentId) {
  if (intentId === INTENT_ID.DIETARY_ADVICE) return "diet";
  if (intentId === INTENT_ID.EXERCISE_ADVICE) return "exercise";
  if (intentId === INTENT_ID.SLEEP_ADVICE) return "sleep";
  if (intentId === INTENT_ID.CONTENT_RECOMMENDATION) return "content";
  if (intentId === INTENT_ID.DAILY_COMPANIONSHIP) return "companionship";
  if (intentId === INTENT_ID.APP_FEATURE_EXPLANATION) return "feature";
  if (intentId === INTENT_ID.HIGH_RISK_EXPRESSIONS) return "risk";
  return "general";
}

function normalizeRiskLevel(level) {
  if (level === AGENT_RISK_LEVEL.R3) return AGENT_RISK_LEVEL.R3;
  if (level === AGENT_RISK_LEVEL.R2) return AGENT_RISK_LEVEL.R2;
  if (level === AGENT_RISK_LEVEL.R1) return AGENT_RISK_LEVEL.R1;
  return AGENT_RISK_LEVEL.R0;
}

function isHighRisk(level) {
  return level === AGENT_RISK_LEVEL.R2 || level === AGENT_RISK_LEVEL.R3;
}

function buildRiskObject({ precheck, overrideApplied }) {
  return {
    level: normalizeRiskLevel(precheck?.riskLevel),
    override_applied: Boolean(overrideApplied),
    reasons: Array.isArray(precheck?.reasons) ? precheck.reasons : [],
  };
}

function buildEscalation({ riskLevel, required }) {
  const safeRequired = Boolean(required);
  if (!safeRequired) {
    return {
      required: false,
    };
  }
  return {
    required: true,
    level: riskLevel,
    action_policy: riskLevel === AGENT_RISK_LEVEL.R3 ? "immediate_emergency_guidance" : "handover_recommended",
  };
}

function normalizeCapabilities(routerCapabilities = {}) {
  const subAgents = Array.isArray(routerCapabilities?.sub_agents) && routerCapabilities.sub_agents.length
    ? routerCapabilities.sub_agents
    : [AGENT_ROUTE.EMOTIONAL_SUPPORT, AGENT_ROUTE.FEATURE_GUIDE, AGENT_ROUTE.RISK_ESCALATION];
  return {
    kb_available: routerCapabilities?.kb_available !== false,
    profile_available: routerCapabilities?.profile_available !== false,
    memory_available: routerCapabilities?.memory_available !== false,
    sub_agents: subAgents,
  };
}

function normalizeKbHint(message) {
  const safe = String(message || "").replace(/\s+/g, " ").trim();
  if (!safe) return "";
  return safe.slice(0, 120);
}

function buildRetrievalPlan({ classification, topic, capabilities, message }) {
  const config = getIntentConfig(classification?.primary_intent || INTENT_ID.UNRECOGNIZED_AMBIGUOUS);
  const needsKb = Boolean(config.requiresKb && capabilities.kb_available);
  const needsProfile = Boolean(config.requiresProfile && capabilities.profile_available);
  const memoryAllowlist = MEMORY_SLOT_ALLOWLIST[topic] || MEMORY_SLOT_ALLOWLIST.general;

  return {
    read_kb: needsKb,
    read_profile: needsProfile,
    read_memory: capabilities.memory_available,
    kb_query_hint: needsKb ? normalizeKbHint(message) : undefined,
    memory_slots_allowlist: memoryAllowlist,
  };
}

function buildFallback({ route, capabilities, classification, routeThreshold, clarifyThreshold }) {
  if (!capabilities.sub_agents.includes(route)) {
    return {
      triggered: true,
      reason: `Target route "${route}" is unavailable.`,
      strategy: "route_downgrade",
      downgraded_route: AGENT_ROUTE.EMOTIONAL_SUPPORT,
    };
  }

  if (classification?.needs_clarification || Number(classification?.confidence || 0) < clarifyThreshold) {
    return {
      triggered: true,
      reason: "Low confidence or ambiguous intent.",
      strategy: "clarify_once",
    };
  }

  if (!classification?.primary_intent || Number(classification?.confidence || 0) < 0.35) {
    return {
      triggered: true,
      reason: "Classifier failed to produce reliable intent.",
      strategy: "safe_default_response",
    };
  }

  return {
    triggered: false,
  };
}

function buildHighRiskDecision({ precheck, routeThreshold, clarifyThreshold }) {
  const risk = buildRiskObject({ precheck, overrideApplied: true });
  const classification = {
    primary_intent: INTENT_ID.HIGH_RISK_EXPRESSIONS,
    secondary_intents: [],
    confidence: 1,
    needs_clarification: false,
    stage: "rule",
  };

  return {
    route: AGENT_ROUTE.RISK_ESCALATION,
    topic: "risk",
    classification,
    risk,
    retrieval_plan: {
      read_kb: false,
      read_profile: true,
      read_memory: true,
      memory_slots_allowlist: MEMORY_SLOT_ALLOWLIST.risk,
    },
    fallback: {
      triggered: false,
    },
    escalation: buildEscalation({
      riskLevel: risk.level,
      required: true,
    }),
    reason: "Risk override by safety precheck.",
    audit_trace: {
      rule_scores: {
        [INTENT_ID.HIGH_RISK_EXPRESSIONS]: 100,
      },
      llm_used: false,
      llm_trigger_reason: "Skipped due to hard risk override.",
      llm_model_requested: null,
      llm_model_used: null,
      llm_selection_reason: null,
      llm_fallback_reason: null,
      llm_latency_ms: 0,
      route_threshold: routeThreshold,
      clarify_threshold: clarifyThreshold,
    },
  };
}

export function createIntentClassifier({
  llmEvaluator = null,
  llmThreshold = ROUTE_CONFIDENCE_THRESHOLD,
  routeThreshold = ROUTE_CONFIDENCE_THRESHOLD,
  clarifyThreshold = CLARIFY_CONFIDENCE_THRESHOLD,
} = {}) {
  const llmSecondary = createLlmSecondaryIntentEvaluator({
    evaluator: llmEvaluator,
    threshold: llmThreshold,
  });

  return {
    async classify({
      message,
      lang,
      precheck,
      routerCapabilities = {},
      modelPreference = null,
    }) {
      const riskLevel = normalizeRiskLevel(precheck?.riskLevel);
      if (precheck?.stopNormalFlow || isHighRisk(riskLevel)) {
        return buildHighRiskDecision({
          precheck,
          routeThreshold,
          clarifyThreshold,
        });
      }

      const capabilities = normalizeCapabilities(routerCapabilities);
      const ruleClassification = classifyIntentByRules({
        message,
        lang,
        precheck,
      });
      const refined = await llmSecondary.refine({
        message,
        lang,
        baseClassification: ruleClassification,
        modelPreference,
      });

      const classification = {
        ...refined.classification,
        needs_clarification:
          Boolean(refined.classification?.needs_clarification) ||
          Number(refined.classification?.confidence || 0) < clarifyThreshold,
      };

      const topic = mapIntentToTopic(classification.primary_intent);
      const preferredRoute = mapIntentToMvpRoute(classification.primary_intent);
      const fallback = buildFallback({
        route: preferredRoute,
        capabilities,
        classification,
        routeThreshold,
        clarifyThreshold,
      });
      const route = fallback?.strategy === "route_downgrade" ? fallback.downgraded_route : preferredRoute;

      const escalationRequired = isHighRisk(riskLevel) || classification.primary_intent === INTENT_ID.HIGH_RISK_EXPRESSIONS;
      const escalation = buildEscalation({
        riskLevel,
        required: escalationRequired,
      });

      const llmReason = classification?.llm_secondary?.reason || (refined.used ? "LLM secondary evaluator applied." : "Rule classification only.");

      return {
        route,
        topic,
        classification,
        risk: buildRiskObject({ precheck, overrideApplied: false }),
        retrieval_plan: buildRetrievalPlan({
          classification,
          topic,
          capabilities,
          message,
        }),
        fallback: {
          triggered: Boolean(fallback?.triggered),
          reason: fallback?.reason,
          strategy: fallback?.strategy,
        },
        escalation,
        reason: fallback?.triggered
          ? `${classification.reason} Fallback=${fallback.strategy}.`
          : classification.reason,
        audit_trace: {
          rule_scores: classification?.score_board || {},
          llm_used: Boolean(refined.used),
          llm_trigger_reason: llmReason,
          llm_model_requested: refined?.meta?.modelRequested || null,
          llm_model_used: refined?.meta?.modelUsed || null,
          llm_selection_reason: refined?.meta?.selectionReason || null,
          llm_fallback_reason: refined?.meta?.fallbackReason || null,
          llm_latency_ms: Number(refined?.meta?.latencyMs || 0),
          route_threshold: routeThreshold,
          clarify_threshold: clarifyThreshold,
        },
      };
    },
  };
}
