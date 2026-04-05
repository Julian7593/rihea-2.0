import { describe, expect, it } from "vitest";
import { createAgentOrchestratorService } from "../../server/services/agent/orchestratorService.js";
import { createInitialAgentAuditState, createAgentAuditLogger } from "../../server/services/agent/audit/agentAuditLogger.js";
import { createInitialSessionMemoryState, createSessionMemoryStore } from "../../server/services/agent/memory/sessionMemoryStore.js";
import { createInitialUserStateMemoryState, createUserStateMemoryStore } from "../../server/services/agent/memory/userStateMemoryStore.js";
import { createMemoryStore } from "../../server/store/jsonStore.js";

function createService({ webSearchService = null } = {}) {
  const sessionStore = createMemoryStore(createInitialSessionMemoryState());
  const userStore = createMemoryStore(createInitialUserStateMemoryState());
  const auditStore = createMemoryStore(createInitialAgentAuditState());
  const sessionMemoryStore = createSessionMemoryStore({
    store: sessionStore,
    now: () => new Date("2026-03-10T08:00:00.000Z"),
  });
  const userStateMemoryStore = createUserStateMemoryStore({
    store: userStore,
    now: () => new Date("2026-03-10T08:00:00.000Z"),
  });
  const auditLogger = createAgentAuditLogger({
    store: auditStore,
    now: () => new Date("2026-03-10T08:00:00.000Z"),
  });

  return createAgentOrchestratorService({
    sessionMemoryStore,
    userStateMemoryStore,
    auditLogger,
    webSearchService,
    now: () => new Date("2026-03-10T08:00:00.000Z"),
  });
}

describe("agent orchestrator service", () => {
  it("routes normal emotional input and does not force escalation", async () => {
    const service = createService();
    const result = await service.chat({
      userId: "user_001",
      sessionId: "session_001",
      message: "最近有点焦虑，晚上总是睡不好。",
      lang: "zh",
      clientContext: {
        profile: {
          name: "Yiting",
          pregnancyWeek: "24+3",
        },
      },
    });

    expect(result.riskLevel === "R0" || result.riskLevel === "R1").toBe(true);
    expect(result.escalation).toBeNull();
    expect(result.classification?.primary_intent).toBeDefined();
    expect(result.routing?.route).toBeTruthy();
    expect(result.routing?.retrieval_plan).toBeTruthy();
    expect(result.routing?.audit_trace).toBeTruthy();
    expect(typeof result.routing?.audit_trace?.generation_source).toBe("string");
    expect(Array.isArray(result.routing?.audit_trace?.skill_trace)).toBe(true);
    expect(result.answer_raw).toBe(result.answer);
    expect(result.reasoning_summary).toBeTruthy();
    expect(Array.isArray(result.sources)).toBe(true);
    expect(Array.isArray(result.citations)).toBe(true);
    expect(Array.isArray(result.usedSources)).toBe(true);
    expect("kbFreshness" in result).toBe(true);
    expect("confidence" in result).toBe(true);
    expect(result.search_meta).toBeTruthy();
    expect(Array.isArray(result.toolTrace)).toBe(true);
    expect(result.toolTrace.length).toBeGreaterThan(0);
    expect(result.memoryUpdates?.session?.shortTermMemory?.currentPrimaryDistress?.label).toBeTruthy();
    expect(result.memoryUpdates?.userState?.userProfile?.riskLevelCurrent).toBeTruthy();
  });

  it("forces risk escalation path on high-risk expression", async () => {
    const service = createService();
    const result = await service.chat({
      userId: "user_002",
      sessionId: "session_002",
      message: "我不想活了，想结束生命。",
      lang: "zh",
      clientContext: {
        profile: {
          name: "A",
        },
      },
    });

    expect(result.riskLevel).toBe("R3");
    expect(result.classification?.primary_intent).toBe("high_risk_expressions");
    expect(result.escalation?.required).toBe(true);
    expect(result.routing?.risk?.override_applied).toBe(true);
    expect(result.nextActions.length).toBeGreaterThan(0);
    expect(result.memoryUpdates?.session?.shortTermMemory?.recentSafetyEvent?.triggered).toBe(true);
  });

  it("routes clear feature question to feature intent", async () => {
    const service = createService();
    const result = await service.chat({
      userId: "user_feature_1",
      sessionId: "session_feature_1",
      message: "打卡功能在哪里设置提醒？",
      lang: "zh",
      clientContext: {},
    });

    expect(result.classification?.primary_intent).toBe("app_feature_explanation");
    expect(result.classification?.mvp_route).toBe("feature_guide");
    expect(result.escalation).toBeNull();
  });

  it("returns clarification strategy for ambiguous query", async () => {
    const service = createService();
    const result = await service.chat({
      userId: "user_amb_1",
      sessionId: "session_amb_1",
      message: "怎么办",
      lang: "zh",
      clientContext: {},
    });

    expect(result.classification?.primary_intent).toBe("unrecognized_ambiguous");
    expect(result.classification?.needs_clarification).toBe(true);
    expect(result.answer.includes("优先")).toBe(true);
  });

  it("returns stable risk output for same input in deterministic config", async () => {
    const service = createService();
    const payload = {
      userId: "user_003",
      sessionId: "session_003",
      message: "我最近压力有点大，想要一个可执行方案。",
      lang: "zh",
      clientContext: {},
    };

    const first = await service.chat(payload);
    const second = await service.chat(payload);

    expect(second.riskLevel).toBe(first.riskLevel);
    expect(second.disclaimer).toBe(first.disclaimer);
    expect(second.classification?.primary_intent).toBe(first.classification?.primary_intent);
  });

  it("exposes KB audit fields when retrieval asks for KB", async () => {
    const service = createService();
    const result = await service.chat({
      userId: "user_kb_1",
      sessionId: "session_kb_1",
      message: "孕期饮食应该怎么安排",
      lang: "zh",
      clientContext: {
        knowledgeHits: [],
      },
    });

    expect(result.routing?.retrieval_plan?.read_kb).toBe(true);
    expect(typeof result.routing?.audit_trace?.kb_hit_count).toBe("number");
    expect(typeof result.routing?.audit_trace?.kb_miss).toBe("boolean");
    expect(result.routing?.audit_trace?.prompt_only_mode).toBe(result.routing?.audit_trace?.kb_miss);
  });

  it("uses web search for timely queries under R0/R1 and records sources", async () => {
    const service = createService({
      webSearchService: {
        async search({ query }) {
          return {
            used: true,
            query,
            provider: "stub",
            latency_ms: 28,
            error_code: null,
            sources: [
              {
                title: "最新孕期睡眠指南",
                url: "https://who.int/example",
                snippet: "权威建议摘要",
                domain: "who.int",
                published_at: "2026-03-02",
              },
            ],
          };
        },
      },
    });

    const result = await service.chat({
      userId: "user_web_1",
      sessionId: "session_web_1",
      message: "最新孕期睡眠指南有什么更新？",
      lang: "zh",
      clientContext: {},
    });

    expect(result.riskLevel === "R0" || result.riskLevel === "R1").toBe(true);
    expect(result.search_meta?.used).toBe(true);
    expect(result.search_meta?.provider).toBe("stub");
    expect(Array.isArray(result.sources)).toBe(true);
    expect(result.sources.length).toBeGreaterThan(0);
    expect(result.reasoning_summary?.retrieval?.web_used).toBe(true);
  });

  it("returns prompt presets for the chat panel", async () => {
    const service = createService();
    const result = await service.getPromptPresets({ lang: "zh" });

    expect(result.lang).toBe("zh");
    expect(Array.isArray(result.items)).toBe(true);
  });
});
