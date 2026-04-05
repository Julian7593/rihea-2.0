import { describe, expect, it, vi } from "vitest";
import { createModelGateway } from "../../server/services/agent/llm-gateway/modelGateway.js";

describe("model gateway", () => {
  it("uses default model when override is disabled", async () => {
    const adapter = {
      completeJson: vi.fn(async () => ({ ok: true, data: { primary_intent: "emotional_support" } })),
    };
    const gateway = createModelGateway({
      adapters: { deepseek: adapter },
      config: {
        defaultModelKey: "deepseek_chat",
        allowlist: ["deepseek_chat", "openai_gpt4o_mini"],
        overrideEnabled: false,
        timeoutMs: 5000,
      },
    });

    const result = await gateway.completeJson({
      requestedModelKey: "openai_gpt4o_mini",
      systemPrompt: "s",
      userPrompt: "u",
    });

    expect(result.ok).toBe(true);
    expect(result.modelRequested).toBe("openai_gpt4o_mini");
    expect(result.modelUsed).toBe("deepseek_chat");
    expect(result.selectionReason).toBe("default_model");
    expect(adapter.completeJson).toHaveBeenCalledTimes(1);
  });

  it("falls back to default for non-allowlisted requested model", async () => {
    const adapter = {
      completeJson: vi.fn(async () => ({ ok: true, data: { primary_intent: "emotional_support" } })),
    };
    const gateway = createModelGateway({
      adapters: { deepseek: adapter },
      config: {
        defaultModelKey: "deepseek_chat",
        allowlist: ["deepseek_chat"],
        overrideEnabled: true,
        timeoutMs: 5000,
      },
    });

    const result = await gateway.completeJson({
      requestedModelKey: "openai_gpt4o_mini",
      systemPrompt: "s",
      userPrompt: "u",
    });

    expect(result.ok).toBe(true);
    expect(result.modelUsed).toBe("deepseek_chat");
    expect(result.selectionReason).toBe("requested_model_not_allowlisted");
  });

  it("retries once and returns normalized failure", async () => {
    const adapter = {
      completeJson: vi.fn(async () => ({
        ok: false,
        error: { code: "HTTP_429", message: "rate limited" },
      })),
    };
    const gateway = createModelGateway({
      adapters: { deepseek: adapter },
      config: {
        defaultModelKey: "deepseek_chat",
        allowlist: ["deepseek_chat"],
        overrideEnabled: true,
      },
    });

    const result = await gateway.completeJson({
      requestedModelKey: "deepseek_chat",
      systemPrompt: "s",
      userPrompt: "u",
    });

    expect(result.ok).toBe(false);
    expect(result.error.code).toBe("HTTP_429");
    expect(result.fallbackReason).toBe("llm_call_failed");
    expect(adapter.completeJson).toHaveBeenCalledTimes(2);
  });

  it("evaluates intent and returns suggestion + model meta", async () => {
    const adapter = {
      completeJson: vi.fn(async () => ({
        ok: true,
        data: {
          primary_intent: "sleep_advice",
          secondary_intents: ["emotional_support"],
          confidence: 0.84,
          reason: "sleep keywords + distress expression",
          needs_clarification: false,
        },
      })),
    };
    const gateway = createModelGateway({
      adapters: { deepseek: adapter },
      config: {
        defaultModelKey: "deepseek_chat",
        allowlist: ["deepseek_chat", "deepseek_reasoner"],
        overrideEnabled: true,
      },
    });

    const result = await gateway.evaluateIntent({
      message: "我最近夜醒很多，而且有点焦虑",
      lang: "zh",
      baseClassification: {
        primary_intent: "emotional_support",
        secondary_intents: [],
        confidence: 0.52,
      },
      modelPreference: {
        modelKey: "deepseek_reasoner",
      },
    });

    expect(result.ok).toBe(true);
    expect(result.suggestion.primary_intent).toBe("sleep_advice");
    expect(result.meta.modelRequested).toBe("deepseek_reasoner");
    expect(result.meta.modelUsed).toBe("deepseek_reasoner");
    expect(result.meta.selectionReason).toBe("request_override");
  });

  it("supports doubao model key selection when allowlisted", async () => {
    const adapter = {
      completeJson: vi.fn(async () => ({
        ok: true,
        data: {
          primary_intent: "emotional_support",
          secondary_intents: [],
          confidence: 0.79,
          reason: "supportive emotional context",
          needs_clarification: false,
        },
      })),
    };
    const gateway = createModelGateway({
      adapters: { doubao: adapter },
      config: {
        defaultModelKey: "doubao_chat",
        allowlist: ["doubao_chat"],
        overrideEnabled: true,
      },
    });

    const result = await gateway.evaluateIntent({
      message: "最近我有点烦",
      lang: "zh",
      baseClassification: {
        primary_intent: "unrecognized_ambiguous",
        secondary_intents: [],
        confidence: 0.5,
      },
      modelPreference: {
        modelKey: "doubao_chat",
      },
    });

    expect(result.ok).toBe(true);
    expect(result.meta.modelRequested).toBe("doubao_chat");
    expect(result.meta.modelUsed).toBe("doubao_chat");
    expect(result.meta.selectionReason).toBe("request_override");
    expect(adapter.completeJson).toHaveBeenCalledTimes(1);
  });
});
