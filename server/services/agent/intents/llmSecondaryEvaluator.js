import { INTENT_ID, getIntentConfig } from "./taxonomy.js";

function isValidIntent(value) {
  return Object.values(INTENT_ID).includes(value);
}

function normalizeSecondary(value) {
  if (!Array.isArray(value)) return [];
  return value.filter((item) => isValidIntent(item)).slice(0, 3);
}

function buildRefinedClassification(base, nextPrimaryIntent, nextSecondaryIntents, confidence, reason) {
  const config = getIntentConfig(nextPrimaryIntent);
  return {
    ...base,
    primary_intent: nextPrimaryIntent,
    secondary_intents: nextSecondaryIntents,
    confidence: Math.max(0.4, Math.min(0.98, Number(confidence.toFixed(2)))),
    reason,
    preferred_route: config.preferredRoute,
    mvp_route: config.mvpRoute,
    topic: config.topic,
    requires: {
      kb: config.requiresKb,
      profile: config.requiresProfile,
      safety: config.requiresSafety,
    },
    response_strategy: config.strategySummary,
    l2_sub_intents: config.l2,
    stage: "llm",
  };
}

export function createLlmSecondaryIntentEvaluator({
  threshold = 0.65,
  evaluator = null,
} = {}) {
  return {
    async refine({ message, lang, baseClassification, modelPreference = null }) {
      const shouldTrigger = baseClassification?.needs_llm_secondary || Number(baseClassification?.confidence || 0) < threshold;
      if (!shouldTrigger) {
        return {
          classification: {
            ...baseClassification,
            llm_secondary: { used: false, reason: "Rule confidence is sufficient." },
          },
          attempted: false,
          used: false,
          fallbackToRule: false,
          meta: {
            modelRequested: null,
            modelUsed: null,
            fallbackReason: null,
            selectionReason: null,
            latencyMs: 0,
          },
        };
      }

      if (typeof evaluator !== "function") {
        return {
          classification: {
            ...baseClassification,
            llm_secondary: { used: false, reason: "LLM evaluator not configured; kept rule classification." },
          },
          attempted: false,
          used: false,
          fallbackToRule: true,
          meta: {
            modelRequested: null,
            modelUsed: null,
            fallbackReason: "evaluator_not_configured",
            selectionReason: null,
            latencyMs: 0,
          },
        };
      }

      try {
        const suggestion = await evaluator({
          message,
          lang,
          baseClassification,
          modelPreference,
        });
        const evalMeta = {
          modelRequested: suggestion?.meta?.modelRequested || null,
          modelUsed: suggestion?.meta?.modelUsed || null,
          fallbackReason: suggestion?.meta?.fallbackReason || null,
          selectionReason: suggestion?.meta?.selectionReason || null,
          latencyMs: Number(suggestion?.meta?.latencyMs || 0),
        };
        if (suggestion?.ok === false) {
          return {
            classification: {
              ...baseClassification,
              llm_secondary: {
                used: true,
                accepted: false,
                reason: `LLM suggestion unavailable: ${suggestion?.error?.code || "unknown_error"}`,
              },
            },
            attempted: true,
            used: false,
            fallbackToRule: true,
            meta: {
              ...evalMeta,
              fallbackReason: evalMeta.fallbackReason || suggestion?.error?.code || "llm_gateway_error",
            },
          };
        }
        const payload = suggestion?.suggestion || suggestion;
        const suggestedPrimary = suggestion?.primary_intent;
        const normalizedPrimary = payload?.primary_intent || suggestedPrimary;
        if (!isValidIntent(normalizedPrimary)) {
          return {
            classification: {
              ...baseClassification,
              llm_secondary: { used: true, accepted: false, reason: "LLM suggestion invalid; kept rule classification." },
            },
            attempted: true,
            used: true,
            fallbackToRule: true,
            meta: {
              ...evalMeta,
              fallbackReason: evalMeta.fallbackReason || "invalid_llm_suggestion",
            },
          };
        }

        const next = buildRefinedClassification(
          baseClassification,
          normalizedPrimary,
          normalizeSecondary(payload?.secondary_intents),
          Number.isFinite(Number(payload?.confidence)) ? Number(payload.confidence) : baseClassification.confidence,
          payload?.reason || "LLM secondary evaluator refined low-confidence rule result."
        );

        return {
          classification: {
            ...next,
            llm_secondary: { used: true, accepted: true, reason: "LLM suggestion applied." },
          },
          attempted: true,
          used: true,
          fallbackToRule: false,
          meta: evalMeta,
        };
      } catch (error) {
        return {
          classification: {
            ...baseClassification,
            llm_secondary: {
              used: true,
              accepted: false,
              reason: `LLM evaluator failed: ${error?.message || "unknown error"}`,
            },
          },
          attempted: true,
          used: false,
          fallbackToRule: true,
          meta: {
            modelRequested: null,
            modelUsed: null,
            fallbackReason: "llm_evaluator_exception",
            selectionReason: null,
            latencyMs: 0,
          },
        };
      }
    },
  };
}
