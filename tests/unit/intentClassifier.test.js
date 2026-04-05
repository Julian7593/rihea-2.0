import { describe, expect, it } from "vitest";
import { createIntentClassifier } from "../../server/services/agent/intents/intentClassifier.js";

describe("intent classifier", () => {
  it("forces risk intent with precheck override", async () => {
    const classifier = createIntentClassifier();
    const result = await classifier.classify({
      message: "随便聊聊",
      lang: "zh",
      precheck: {
        stopNormalFlow: true,
        riskLevel: "R3",
      },
      routerCapabilities: {
        kb_available: true,
        profile_available: true,
        memory_available: true,
        sub_agents: ["emotional_support", "feature_guide", "risk_escalation"],
      },
    });

    expect(result.classification.primary_intent).toBe("high_risk_expressions");
    expect(result.route).toBe("risk_escalation");
    expect(result.classification.confidence).toBe(1);
    expect(result.risk.override_applied).toBe(true);
    expect(result.escalation.required).toBe(true);
  });

  it("detects app feature explanation by keywords", async () => {
    const classifier = createIntentClassifier();
    const result = await classifier.classify({
      message: "这个功能在哪里，怎么用打卡？",
      lang: "zh",
      precheck: { stopNormalFlow: false, riskLevel: "R0" },
      routerCapabilities: {
        kb_available: true,
        profile_available: true,
        memory_available: true,
        sub_agents: ["emotional_support", "feature_guide", "risk_escalation"],
      },
    });

    expect(result.classification.primary_intent).toBe("app_feature_explanation");
    expect(result.route).toBe("feature_guide");
    expect(result.retrieval_plan.read_profile).toBe(false);
  });

  it("produces primary and secondary intents on mixed query", async () => {
    const classifier = createIntentClassifier();
    const result = await classifier.classify({
      message: "我最近睡不好，也想推荐一些缓解焦虑的内容",
      lang: "zh",
      precheck: { stopNormalFlow: false, riskLevel: "R0" },
      routerCapabilities: {
        kb_available: true,
        profile_available: true,
        memory_available: true,
        sub_agents: ["emotional_support", "feature_guide", "risk_escalation"],
      },
    });

    expect(result.classification.primary_intent).toBeDefined();
    expect(Array.isArray(result.classification.secondary_intents)).toBe(true);
    expect(result.classification.secondary_intents.length).toBeGreaterThan(0);
    expect(result.retrieval_plan.read_memory).toBe(true);
    expect(Array.isArray(result.retrieval_plan.memory_slots_allowlist)).toBe(true);
  });

  it("marks ambiguous low-signal query for clarification", async () => {
    const classifier = createIntentClassifier();
    const result = await classifier.classify({
      message: "怎么办",
      lang: "zh",
      precheck: { stopNormalFlow: false, riskLevel: "R0" },
      routerCapabilities: {
        kb_available: true,
        profile_available: true,
        memory_available: true,
        sub_agents: ["emotional_support", "feature_guide", "risk_escalation"],
      },
    });

    expect(result.classification.primary_intent).toBe("unrecognized_ambiguous");
    expect(result.classification.needs_clarification).toBe(true);
    expect(result.fallback.triggered).toBe(true);
    expect(result.fallback.strategy).toBe("clarify_once");
  });

  it("remains deterministic under fixed config", async () => {
    const classifier = createIntentClassifier();
    const payload = {
      message: "我想问一下孕期运动和睡眠怎么安排",
      lang: "zh",
      precheck: { stopNormalFlow: false, riskLevel: "R0" },
      routerCapabilities: {
        kb_available: true,
        profile_available: true,
        memory_available: true,
        sub_agents: ["emotional_support", "feature_guide", "risk_escalation"],
      },
    };
    const first = await classifier.classify(payload);
    const second = await classifier.classify(payload);

    expect(second.classification.primary_intent).toBe(first.classification.primary_intent);
    expect(second.classification.confidence).toBe(first.classification.confidence);
    expect(second.reason).toBe(first.reason);
  });

  it("downgrades route when target sub-agent is unavailable", async () => {
    const classifier = createIntentClassifier();
    const result = await classifier.classify({
      message: "这个功能在哪里，怎么用？",
      lang: "zh",
      precheck: { stopNormalFlow: false, riskLevel: "R0" },
      routerCapabilities: {
        kb_available: true,
        profile_available: true,
        memory_available: true,
        sub_agents: ["emotional_support", "risk_escalation"],
      },
    });

    expect(result.route).toBe("emotional_support");
    expect(result.fallback.triggered).toBe(true);
    expect(result.fallback.strategy).toBe("route_downgrade");
  });

  it("passes model preference to llm evaluator for low-confidence input", async () => {
    const llmEvaluator = async ({ modelPreference }) => ({
      ok: true,
      suggestion: {
        primary_intent: "daily_companionship",
        secondary_intents: ["emotional_support"],
        confidence: 0.74,
        reason: "Short companionship-style ask.",
        needs_clarification: false,
      },
      meta: {
        modelRequested: modelPreference?.modelKey || null,
        modelUsed: "deepseek_reasoner",
        selectionReason: "request_override",
        fallbackReason: null,
        latencyMs: 18,
      },
    });
    const classifier = createIntentClassifier({ llmEvaluator });
    const result = await classifier.classify({
      message: "嗯",
      lang: "zh",
      precheck: { stopNormalFlow: false, riskLevel: "R0" },
      routerCapabilities: {
        kb_available: true,
        profile_available: true,
        memory_available: true,
        sub_agents: ["emotional_support", "feature_guide", "risk_escalation"],
      },
      modelPreference: {
        modelKey: "deepseek_reasoner",
      },
    });

    expect(result.audit_trace.llm_model_requested).toBe("deepseek_reasoner");
    expect(result.audit_trace.llm_model_used).toBe("deepseek_reasoner");
    expect(result.classification.stage).toBe("llm");
  });

  it("falls back to rule when llm evaluator returns failure payload", async () => {
    const llmEvaluator = async () => ({
      ok: false,
      error: { code: "HTTP_429", message: "rate limited" },
      meta: {
        modelRequested: "deepseek_chat",
        modelUsed: "deepseek_chat",
        selectionReason: "default_model",
        fallbackReason: "llm_call_failed",
        latencyMs: 200,
      },
    });
    const classifier = createIntentClassifier({ llmEvaluator });
    const result = await classifier.classify({
      message: "怎么办",
      lang: "zh",
      precheck: { stopNormalFlow: false, riskLevel: "R0" },
      routerCapabilities: {
        kb_available: true,
        profile_available: true,
        memory_available: true,
        sub_agents: ["emotional_support", "feature_guide", "risk_escalation"],
      },
    });

    expect(result.classification.primary_intent).toBe("unrecognized_ambiguous");
    expect(result.audit_trace.llm_fallback_reason).toBe("llm_call_failed");
    expect(result.fallback.triggered).toBe(true);
    expect(result.fallback.strategy).toBe("clarify_once");
  });
});
