import { describe, expect, it } from "vitest";
import {
  buildEmotionalSupportPromptInput,
  buildFeatureGuidePromptInput,
  buildRiskEscalationPromptInput,
} from "../../server/services/agent/prompts/subAgentPrompts.js";
import { ROUTER_AGENT_PROMPT } from "../../server/services/agent/prompts/routerPrompt.js";
import { createEmotionalSupportAgent } from "../../server/services/agent/subAgents/emotionalSupportAgent.js";

describe("agent prompt inputs", () => {
  it("injects prompt pack metadata into router and emotional prompts", () => {
    const emotionalInput = buildEmotionalSupportPromptInput({
      message: "最近总是夜醒",
      lang: "zh",
      topic: "sleep",
      classification: { primary_intent: "sleep_advice" },
      memoryPromptContext: { slots: [] },
    });

    expect(ROUTER_AGENT_PROMPT.includes("router_prompt_pack_v2")).toBe(true);
    expect(emotionalInput.systemPrompt.includes("emotional_prompt_pack_v2")).toBe(true);
  });

  it("injects feature prompt pack metadata and filters feature memory slots", () => {
    const featureInput = buildFeatureGuidePromptInput({
      message: "打卡在哪里",
      lang: "zh",
      topic: "feature",
      classification: { primary_intent: "app_feature_explanation" },
      memoryPromptContext: {
        slots: [
          { key: "feature_usage_pref", value: { preferred_entry_path: "home_to_chat" }, priority: 1 },
          { key: "faq_type_top3", value: ["app_feature_explanation"], priority: 2 },
          { key: "unknown_key", value: "x", priority: 0 },
        ],
      },
    });

    expect(featureInput.systemPrompt.includes("feature_prompt_pack_v2")).toBe(true);
    expect(featureInput.signals.featureUsagePreference).toEqual({ preferred_entry_path: "home_to_chat" });
    expect(featureInput.signals.faqTopIntents).toEqual(["app_feature_explanation"]);
    expect(featureInput.taskInput.memoryContext.find((item) => item.key === "unknown_key")).toBeUndefined();
  });

  it("filters emotional prompt memory slots by allowlist", () => {
    const input = buildEmotionalSupportPromptInput({
      message: "最近总是夜醒",
      lang: "zh",
      topic: "sleep",
      classification: { primary_intent: "sleep_advice" },
      memoryPromptContext: {
        slots: [
          { key: "last_primary_concern", value: "night_waking_with_anxiety", priority: 2 },
          { key: "content_pref_topics", value: ["sleep"], priority: 4 },
          { key: "unknown_key", value: "x", priority: 1 },
        ],
      },
    });

    expect(input.signals.lastPrimaryConcern).toBe("night_waking_with_anxiety");
    expect(input.signals.preferredTopics).toEqual(["sleep"]);
    expect(input.taskInput.memoryContext.find((item) => item.key === "unknown_key")).toBeUndefined();
  });

  it("includes memory concern signal in risk prompt input", () => {
    const input = buildRiskEscalationPromptInput({
      message: "我不想活了",
      lang: "zh",
      riskLevel: "R3",
      precheckReasons: ["检测到高危表达"],
      memoryPromptContext: {
        slots: [{ key: "last_primary_concern", value: "night_waking_with_anxiety", priority: 2 }],
      },
    });

    expect(input.signals.lastPrimaryConcern).toBe("night_waking_with_anxiety");
  });
});

describe("emotional support agent personalization", () => {
  it("adds continuity line when last_primary_concern exists", async () => {
    const agent = createEmotionalSupportAgent();
    const result = await agent.handle({
      lang: "zh",
      message: "我还是睡不好",
      topic: "sleep",
      classification: { primary_intent: "sleep_advice", confidence: 0.88 },
      memoryPromptContext: {
        slots: [{ key: "last_primary_concern", value: "night_waking_with_anxiety", priority: 2 }],
      },
      runTool: async (name) => {
        if (name === "get_user_profile") {
          return { ok: true, data: { profile: { name: "Yiting" } } };
        }
        if (name === "assess_emotional_risk") {
          return { ok: true, data: { riskLevel: "R1" } };
        }
        if (name === "detect_danger_signals") {
          return { ok: true, data: { count: 0, signals: [] } };
        }
        return { ok: false, data: null };
      },
    });

    expect(result.answer.includes("夜醒伴随焦虑")).toBe(true);
    expect(result.feature_recommendations.length).toBeGreaterThan(0);
    expect(result.response_blocks?.acknowledge).toBeTruthy();
  });
});
