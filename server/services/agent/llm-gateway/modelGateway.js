import { DEFAULT_MODEL_REGISTRY, getModelSpec, normalizeModelKey } from "./modelRegistry.js";
import { INTENT_ID } from "../intents/taxonomy.js";

function nowMs() {
  return Date.now();
}

function normalizeError(error, code = "LLM_GATEWAY_ERROR") {
  return {
    code,
    message: error?.message || "Unknown LLM gateway error.",
  };
}

const INTENT_ENUM = Object.values(INTENT_ID);

function toBoundedConfidence(value, fallback = 0.55) {
  const next = Number(value);
  if (!Number.isFinite(next)) return fallback;
  return Number(Math.max(0, Math.min(1, next)).toFixed(2));
}

function normalizeSecondaryIntents(value = [], primaryIntent = INTENT_ID.UNRECOGNIZED_AMBIGUOUS) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => String(item || "").trim())
    .filter((item) => item && item !== primaryIntent && INTENT_ENUM.includes(item))
    .slice(0, 3);
}

function buildIntentEvaluatorSystemPrompt() {
  return `You are an intent refinement assistant for a pregnancy emotional wellness app.
Return strict JSON only.
Hard boundaries:
1) Safety first: high-risk intent always wins.
2) No diagnosis, no medication, no treatment guarantees.
3) Keep output concise and auditable.
Allowed primary_intent values:
${INTENT_ENUM.map((intent) => `- ${intent}`).join("\n")}
Output JSON fields:
{
  "primary_intent": string,
  "secondary_intents": string[],
  "confidence": number (0..1),
  "reason": string,
  "needs_clarification": boolean
}`;
}

function buildIntentEvaluatorUserPrompt({ message, lang, baseClassification }) {
  return JSON.stringify(
    {
      task: "Refine low-confidence intent classification for routing.",
      lang: lang === "en" ? "en" : "zh",
      message: String(message || ""),
      base_classification: {
        primary_intent: String(baseClassification?.primary_intent || ""),
        secondary_intents: Array.isArray(baseClassification?.secondary_intents)
          ? baseClassification.secondary_intents
          : [],
        confidence: toBoundedConfidence(baseClassification?.confidence, 0.55),
        needs_clarification: Boolean(baseClassification?.needs_clarification),
      },
    },
    null,
    2
  );
}

function normalizeIntentSuggestion(payload, baseClassification = {}) {
  const primaryIntent = String(payload?.primary_intent || "").trim();
  if (!INTENT_ENUM.includes(primaryIntent)) {
    return null;
  }

  const fallbackReason = String(baseClassification?.reason || "LLM refined the classification.");
  const confidenceFallback = toBoundedConfidence(baseClassification?.confidence, 0.55);
  const confidence = toBoundedConfidence(payload?.confidence, confidenceFallback);

  return {
    primary_intent: primaryIntent,
    secondary_intents: normalizeSecondaryIntents(payload?.secondary_intents, primaryIntent),
    confidence,
    reason: String(payload?.reason || fallbackReason).trim().slice(0, 280) || fallbackReason,
    needs_clarification:
      typeof payload?.needs_clarification === "boolean"
        ? payload.needs_clarification
        : confidence < 0.6 || primaryIntent === INTENT_ID.UNRECOGNIZED_AMBIGUOUS,
  };
}

export function createModelGateway({
  adapters = {},
  registry = DEFAULT_MODEL_REGISTRY,
  config = {},
  now = nowMs,
} = {}) {
  const defaultModelKey = normalizeModelKey(config.defaultModelKey || "deepseek_chat");
  const allowlist = Array.isArray(config.allowlist) && config.allowlist.length
    ? config.allowlist.map((item) => normalizeModelKey(item))
    : [defaultModelKey];
  const overrideEnabled = Boolean(config.overrideEnabled);
  const timeoutMs = Number.isFinite(Number(config.timeoutMs)) ? Math.max(1000, Number(config.timeoutMs)) : 8000;

  function resolveModelKey(requestedModelKey) {
    const requested = normalizeModelKey(requestedModelKey || "");
    const allowset = new Set(allowlist);

    if (overrideEnabled && requested && allowset.has(requested) && getModelSpec(requested, registry)) {
      return {
        modelRequested: requested,
        modelSelected: requested,
        selectionReason: "request_override",
      };
    }

    if (overrideEnabled && requested && !allowset.has(requested)) {
      return {
        modelRequested: requested,
        modelSelected: defaultModelKey,
        selectionReason: "requested_model_not_allowlisted",
      };
    }

    if (overrideEnabled && requested && allowset.has(requested) && !getModelSpec(requested, registry)) {
      return {
        modelRequested: requested,
        modelSelected: defaultModelKey,
        selectionReason: "requested_model_not_registered",
      };
    }

    return {
      modelRequested: requested || null,
      modelSelected: defaultModelKey,
      selectionReason: "default_model",
    };
  }

  async function completeJson({ requestedModelKey, systemPrompt, userPrompt, responseSchema = {}, timeoutMsOverride }) {
    const startedAt = now();
    const selection = resolveModelKey(requestedModelKey);
    const modelSpec = getModelSpec(selection.modelSelected, registry);

    if (!modelSpec) {
      return {
        ok: false,
        error: {
          code: "MODEL_NOT_REGISTERED",
          message: `Model key '${selection.modelSelected}' is not registered.`,
        },
        modelRequested: selection.modelRequested,
        modelUsed: null,
        fallbackReason: selection.selectionReason,
        selectionReason: selection.selectionReason,
        latencyMs: now() - startedAt,
      };
    }

    const adapter = adapters[modelSpec.provider];
    if (!adapter || typeof adapter.completeJson !== "function") {
      return {
        ok: false,
        error: {
          code: "ADAPTER_UNAVAILABLE",
          message: `Adapter for provider '${modelSpec.provider}' is unavailable.`,
        },
        modelRequested: selection.modelRequested,
        modelUsed: selection.modelSelected,
        fallbackReason: "adapter_unavailable",
        selectionReason: selection.selectionReason,
        latencyMs: now() - startedAt,
      };
    }

    const maxAttempts = 2;
    let lastError = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        const result = await adapter.completeJson({
          model: modelSpec.model,
          systemPrompt,
          userPrompt,
          responseSchema,
          timeoutMs: timeoutMsOverride || timeoutMs,
        });

        if (result?.ok) {
          return {
            ok: true,
            data: result.data,
            modelRequested: selection.modelRequested,
            modelUsed: selection.modelSelected,
            selectionReason: selection.selectionReason,
            fallbackReason: null,
            latencyMs: now() - startedAt,
          };
        }

        lastError = result?.error || normalizeError(null);
      } catch (error) {
        lastError = normalizeError(error);
      }
    }

    return {
      ok: false,
      error: lastError || {
        code: "LLM_CALL_FAILED",
        message: "LLM call failed after retries.",
      },
      modelRequested: selection.modelRequested,
      modelUsed: selection.modelSelected,
      fallbackReason: "llm_call_failed",
      selectionReason: selection.selectionReason,
      latencyMs: now() - startedAt,
    };
  }

  async function evaluateIntent({ message, lang, baseClassification = {}, modelPreference = null }) {
    const requestedModelKey =
      modelPreference && typeof modelPreference === "object" ? modelPreference.modelKey : undefined;
    const result = await completeJson({
      requestedModelKey,
      systemPrompt: buildIntentEvaluatorSystemPrompt(),
      userPrompt: buildIntentEvaluatorUserPrompt({
        message,
        lang,
        baseClassification,
      }),
      responseSchema: {
        type: "object",
        required: ["primary_intent", "secondary_intents", "confidence", "reason", "needs_clarification"],
      },
    });

    const meta = {
      modelRequested: result.modelRequested || null,
      modelUsed: result.modelUsed || null,
      selectionReason: result.selectionReason || "default_model",
      latencyMs: Number(result.latencyMs || 0),
      fallbackReason: result.fallbackReason || null,
    };

    if (!result.ok) {
      return {
        ok: false,
        error: result.error || normalizeError(null, "LLM_INTENT_EVAL_FAILED"),
        meta,
      };
    }

    const suggestion = normalizeIntentSuggestion(result.data, baseClassification);
    if (!suggestion) {
      return {
        ok: false,
        error: {
          code: "INVALID_LLM_INTENT",
          message: "LLM returned an unsupported primary intent.",
        },
        meta,
      };
    }

    return {
      ok: true,
      suggestion,
      meta,
    };
  }

  return {
    completeJson,
    evaluateIntent,
    resolveModelKey,
    getConfig() {
      return {
        defaultModelKey,
        allowlist: [...allowlist],
        overrideEnabled,
        timeoutMs,
      };
    },
  };
}
