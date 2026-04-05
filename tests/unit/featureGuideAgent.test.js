import { describe, expect, it } from "vitest";
import { createFeatureGuideAgent } from "../../server/services/agent/subAgents/featureGuideAgent.js";

describe("feature guide agent phase 2c", () => {
  it("returns product-grounded path guidance with template fallback when model gateway is unavailable", async () => {
    const groundedRetrievalService = {
      retrieve: async () => ({
        citations: [
          {
            id: "app_001",
            title: "App 功能说明与入口导航",
            snippet: "打卡更适合快速记录状态。",
            url: "https://kb.local/app-guide",
            source_type: "local_kb",
            score: 9,
          },
        ],
        usedSources: ["local_kb"],
        groundingSummary: {
          total_citations: 1,
          source_breakdown: { local_kb: 1 },
          primary_source: "local_kb",
        },
        confidence: 0.8,
        fallbackReason: null,
        kbFreshness: { status: "fresh" },
        feishuLiveMeta: null,
        webMeta: null,
      }),
    };
    const agent = createFeatureGuideAgent({ groundedRetrievalService });
    const result = await agent.handle({
      lang: "zh",
      message: "打卡在哪里",
      topic: "feature",
      classification: {
        primary_intent: "app_feature_explanation",
        confidence: 0.9,
        needs_clarification: false,
      },
      memoryPromptContext: { slots: [] },
      runTool: async () => ({ ok: false, data: null }),
    });

    expect(result.answer).toContain("打卡");
    expect(result.generationMeta?.generation_mode).toBe("soft_template_fallback");
    expect(result.generationMeta?.used_product_evidence).toBe(true);
    expect(result.generationMeta?.feature_intent_type).toBeTruthy();
    expect(Array.isArray(result.usedSources)).toBe(true);
  });

  it("uses llm generation when model gateway is available", async () => {
    const groundedRetrievalService = {
      retrieve: async () => ({
        citations: [
          {
            id: "app_001",
            title: "App 功能说明与入口导航",
            snippet: "CBT 更适合结构化练习。",
            url: "https://kb.local/app-guide",
            source_type: "feishu_sync",
            score: 8,
          },
        ],
        usedSources: ["feishu_sync"],
        groundingSummary: {
          total_citations: 1,
          source_breakdown: { feishu_sync: 1 },
          primary_source: "feishu_sync",
        },
        confidence: 0.78,
        fallbackReason: null,
        kbFreshness: { status: "fresh" },
        feishuLiveMeta: null,
        webMeta: null,
      }),
    };
    const modelGateway = {
      completeJson: async () => ({
        ok: true,
        data: {
          response_blocks: {
            acknowledge: "你是在找 CBT 的入口。",
            path: "你可以先进入关怀页，再打开 CBT 中心。",
            explain: "CBT 更适合做结构化练习和梳理。",
            guide: "如果你愿意，我可以继续告诉你先从哪个练习开始。",
          },
          needs_clarification: false,
          feature_recommendations: [
            { feature_id: "cbt_center", reason: "做结构化练习", cta: "打开 CBT 中心" },
          ],
          audit_reason: "Grounded feature explanation.",
          feature_intent_type: "entry_path",
          path_confidence: 0.88,
        },
        modelRequested: "deepseek_chat",
        modelUsed: "deepseek_chat",
        latencyMs: 18,
      }),
    };

    const agent = createFeatureGuideAgent({ modelGateway, groundedRetrievalService });
    const result = await agent.handle({
      lang: "zh",
      message: "CBT 怎么用",
      topic: "feature",
      classification: {
        primary_intent: "app_feature_explanation",
        confidence: 0.86,
        needs_clarification: false,
      },
      memoryPromptContext: { slots: [] },
      runTool: async () => ({ ok: false, data: null }),
    });

    expect(result.generationMeta?.generation_source).toBe("llm");
    expect(result.generationMeta?.path_confidence).toBeGreaterThan(0.8);
    expect(result.response_blocks?.path).toContain("CBT");
    expect(result.feature_recommendations[0]?.feature_id).toBe("cbt_center");
  });

  it("keeps certainty low when only web evidence exists", async () => {
    const groundedRetrievalService = {
      retrieve: async () => ({
        citations: [
          {
            id: "web_1",
            title: "公开产品介绍",
            snippet: "可能提到打卡和内容入口。",
            url: "https://example.com/product",
            source_type: "web",
            score: 4,
          },
        ],
        usedSources: ["web"],
        groundingSummary: {
          total_citations: 1,
          source_breakdown: { web: 1 },
          primary_source: "web",
        },
        confidence: 0.58,
        fallbackReason: "web_only",
        kbFreshness: { status: "missing" },
        feishuLiveMeta: null,
        webMeta: { used: true, provider: "zhipu", error_code: null },
      }),
    };
    const agent = createFeatureGuideAgent({ groundedRetrievalService });
    const result = await agent.handle({
      lang: "zh",
      message: "推荐内容在哪看",
      topic: "feature",
      classification: {
        primary_intent: "app_feature_explanation",
        confidence: 0.7,
        needs_clarification: false,
      },
      memoryPromptContext: { slots: [] },
      runTool: async () => ({ ok: false, data: null }),
    });

    expect(result.generationMeta?.used_product_evidence).toBe(false);
    expect(result.generationMeta?.path_confidence).toBeLessThanOrEqual(0.58);
    expect(result.generationMeta?.certainty_level).toBe("low");
  });

  it("uses app_features scope and target-aware retrieval query for feature grounding", async () => {
    const calls = [];
    const groundedRetrievalService = {
      retrieve: async (input) => {
        calls.push(input);
        return {
          citations: [],
          usedSources: [],
          groundingSummary: {
            total_citations: 0,
            source_breakdown: {},
            primary_source: null,
          },
          confidence: 0.42,
          fallbackReason: "knowledge_not_found",
          kbFreshness: { status: "missing" },
          feishuLiveMeta: null,
          webMeta: null,
        };
      },
    };

    const agent = createFeatureGuideAgent({ groundedRetrievalService });
    await agent.handle({
      lang: "zh",
      message: "伴侣同步在哪绑定",
      topic: "feature",
      classification: {
        primary_intent: "app_feature_explanation",
        confidence: 0.84,
        needs_clarification: false,
      },
      memoryPromptContext: { slots: [] },
      runTool: async () => ({ ok: false, data: null }),
    });

    expect(calls).toHaveLength(1);
    expect(calls[0].feishuScopeId).toBe("app_features");
    expect(String(calls[0].message)).toContain("伴侣同步");
    expect(String(calls[0].message)).toContain("绑定");
  });
});
