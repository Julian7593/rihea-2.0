import { describe, expect, it } from "vitest";
import { createEmotionalSupportAgent } from "../../server/services/agent/subAgents/emotionalSupportAgent.js";

function createToolRunner({
  profileName = "Yiting",
  riskLevel = "R0",
  dangerCount = 0,
  checkInSummary = "Average mood 2.4, low mood days 3, average sleep 5.8 hours.",
  sleepSummary = "Average sleep 5.8 hours, short sleep days 4.",
} = {}) {
  return async (name) => {
    if (name === "get_user_profile") {
      return { ok: true, data: { profile: { name: profileName } } };
    }
    if (name === "assess_emotional_risk") {
      return { ok: true, data: { riskLevel } };
    }
    if (name === "detect_danger_signals") {
      return { ok: true, data: { count: dangerCount, signals: [] } };
    }
    if (name === "search_local_kb") {
      return { ok: true, data: { total: 0, hits: [] } };
    }
    if (name === "analyze_emotional_trends") {
      return {
        ok: true,
        data: { trend: "declining", average_mood: 2.4, summary: checkInSummary },
      };
    }
    if (name === "analyze_sleep_pattern") {
      return {
        ok: true,
        data: { pattern: "sleep_risk", average_sleep_hours: 5.8, summary: sleepSummary },
      };
    }
    if (name === "search_content_recommendations") {
      return {
        ok: true,
        data: {
          total: 1,
          items: [{ title: "夜间焦虑缓解卡", recommendation_reason: "sleep", source_type: "knowledge_base" }],
        },
      };
    }
    return { ok: false, data: null };
  };
}

describe("emotional support agent phase 5a", () => {
  it("returns acknowledge-suggest-guide response blocks", async () => {
    const agent = createEmotionalSupportAgent();
    const result = await agent.handle({
      lang: "zh",
      message: "我最近总是莫名其妙想哭。",
      topic: "general",
      classification: {
        primary_intent: "emotional_support",
        confidence: 0.82,
        needs_clarification: false,
      },
      memoryPromptContext: {
        slots: [{ key: "last_primary_concern", value: "emotional_distress", priority: 2 }],
      },
      clientContext: {
        checkIns: [{ mood: 2, sleepHours: 5.5 }, { mood: 3, sleepHours: 6 }],
      },
      runTool: createToolRunner({ riskLevel: "R1", dangerCount: 0 }),
    });

    expect(result.response_blocks?.acknowledge).toBeTruthy();
    expect(Array.isArray(result.response_blocks?.suggest)).toBe(true);
    expect(result.response_blocks?.suggest.length).toBeGreaterThan(0);
    expect(result.response_blocks?.guide).toBeTruthy();
    expect(result.handover?.required).toBe(false);
  });

  it("triggers handover on high-risk expression", async () => {
    const agent = createEmotionalSupportAgent();
    const result = await agent.handle({
      lang: "zh",
      message: "我不想活了，真的撑不住了。",
      topic: "general",
      classification: {
        primary_intent: "emotional_support",
        confidence: 0.9,
        needs_clarification: false,
      },
      memoryPromptContext: { slots: [] },
      runTool: createToolRunner({ riskLevel: "R1", dangerCount: 0 }),
    });

    expect(result.handover?.required).toBe(true);
    expect(result.handover?.target).toBe("risk_escalation");
    expect(result.riskLevel === "R2" || result.riskLevel === "R3").toBe(true);
    expect(result.escalation?.required).toBe(true);
  });

  it("does not output diagnosis or unrealistic reassurance phrases", async () => {
    const agent = createEmotionalSupportAgent();
    const result = await agent.handle({
      lang: "zh",
      message: "你就告诉我我是不是抑郁症。",
      topic: "general",
      classification: {
        primary_intent: "emotional_support",
        confidence: 0.84,
        needs_clarification: false,
      },
      memoryPromptContext: { slots: [] },
      runTool: createToolRunner({ riskLevel: "R0", dangerCount: 0 }),
    });

    expect(result.answer.includes("诊断")).toBe(false);
    expect(result.answer.includes("保证没事")).toBe(false);
    expect(result.answer.includes("一定会好")).toBe(false);
  });

  it("recommends in-app features when user asks for tools", async () => {
    const agent = createEmotionalSupportAgent();
    const result = await agent.handle({
      lang: "zh",
      message: "我还能做什么？有没有工具可以帮我。",
      topic: "general",
      classification: {
        primary_intent: "emotional_support",
        confidence: 0.73,
        needs_clarification: false,
      },
      memoryPromptContext: { slots: [] },
      runTool: createToolRunner({ riskLevel: "R1", dangerCount: 0 }),
    });

    expect(Array.isArray(result.feature_recommendations)).toBe(true);
    expect(result.feature_recommendations.length).toBeGreaterThan(0);
    expect(result.feature_recommendations[0].feature_id).toBeTruthy();
  });

  it("injects analysis skills into grounded context for trend-like emotional queries", async () => {
    const agent = createEmotionalSupportAgent();
    const result = await agent.handle({
      lang: "zh",
      message: "最近总是睡不好，也一直有点焦虑，我下一步还能做什么？",
      topic: "sleep",
      classification: {
        primary_intent: "sleep_advice",
        confidence: 0.8,
        needs_clarification: false,
      },
      clientContext: {
        checkIns: [
          { mood: 2, sleepHours: 5.5, date: "2026-03-08" },
          { mood: 3, sleepHours: 5.8, date: "2026-03-09" },
          { mood: 2, sleepHours: 6, date: "2026-03-10" },
        ],
      },
      memoryPromptContext: { slots: [] },
      runTool: createToolRunner({ riskLevel: "R1", dangerCount: 0 }),
    });

    expect(result.generationMeta?.certainty_level).toBeTruthy();
    expect(Array.isArray(result.generationMeta?.evidence_used)).toBe(true);
    expect(result.generationMeta?.generation_mode).toBeTruthy();
    expect(result.answer.length).toBeGreaterThan(0);
  });

  it("uses llm generation when model gateway is available", async () => {
    const modelGateway = {
      completeJson: async () => ({
        ok: true,
        data: {
          response_blocks: {
            acknowledge: "我听到你今天真的很累。",
            suggest: ["先做3轮慢呼吸。", "把最担心的一件事写下来。"],
            guide: "你更想先处理睡眠还是情绪波动？",
          },
          needs_clarification: false,
          feature_recommendations: [],
          audit_reason: "LLM structured emotional response.",
        },
        modelRequested: "deepseek_chat",
        modelUsed: "deepseek_chat",
        selectionReason: "default_model",
        latencyMs: 24,
      }),
    };
    const groundedRetrievalService = {
      retrieve: async () => ({
        citations: [
          {
            id: "kb_1",
            title: "睡眠与焦虑",
            snippet: "睡前放松流程",
            url: "https://kb.local/sleep",
            source_type: "local_kb",
            score: 8,
          },
        ],
        usedSources: ["local_kb"],
        groundingSummary: {
          total_citations: 1,
          source_breakdown: { local_kb: 1 },
          primary_source: "local_kb",
        },
        confidence: 0.78,
        fallbackReason: null,
        webMeta: null,
      }),
    };
    const agent = createEmotionalSupportAgent({ modelGateway, groundedRetrievalService });
    const result = await agent.handle({
      lang: "zh",
      message: "昨晚又醒了两次，心里很烦。",
      topic: "sleep",
      classification: {
        primary_intent: "sleep_advice",
        confidence: 0.78,
        needs_clarification: false,
      },
      memoryPromptContext: {
        slots: [{ key: "pregnancy_week", value: "24+3", priority: 2 }],
      },
      runTool: async (name) => {
        if (name === "assess_emotional_risk") return { ok: true, data: { riskLevel: "R1" } };
        if (name === "detect_danger_signals") return { ok: true, data: { count: 0, signals: [] } };
        return { ok: false, data: null };
      },
    });

    expect(result.generationMeta?.generation_source).toBe("llm");
    expect(result.generationMeta?.kb_hit_count).toBeGreaterThan(0);
    expect(result.generationMeta?.generation_mode).toBe("grounded_answer");
    expect(result.response_blocks?.acknowledge).toContain("我听到");
    expect(result.handover?.required).toBe(false);
  });

  it("falls back to template response when llm generation fails", async () => {
    const modelGateway = {
      completeJson: async () => ({
        ok: false,
        error: { code: "HTTP_429", message: "rate limit" },
        modelRequested: "deepseek_chat",
        modelUsed: "deepseek_chat",
        fallbackReason: "llm_call_failed",
        latencyMs: 120,
      }),
    };
    const agent = createEmotionalSupportAgent({ modelGateway });
    const result = await agent.handle({
      lang: "zh",
      message: "今天有点焦虑。",
      topic: "general",
      classification: {
        primary_intent: "emotional_support",
        confidence: 0.72,
        needs_clarification: false,
      },
      memoryPromptContext: { slots: [] },
      runTool: createToolRunner({ riskLevel: "R0", dangerCount: 0 }),
    });

    expect(result.generationMeta?.generation_source).toBe("template_fallback");
    expect(result.generationMeta?.llm_error_code).toBe("HTTP_429");
    expect(result.generationMeta?.generation_mode).toBe("soft_template_fallback");
    expect(result.answer.length).toBeGreaterThan(0);
  });
});
