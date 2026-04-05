import { describe, expect, it } from "vitest";
import { createMemoryStore } from "../../server/store/jsonStore.js";
import { createInitialSessionMemoryState, createSessionMemoryStore } from "../../server/services/agent/memory/sessionMemoryStore.js";

describe("session memory store", () => {
  it("stores short-term structured memory and keeps safety lock after high risk", async () => {
    const store = createMemoryStore(createInitialSessionMemoryState());
    const sessionMemoryStore = createSessionMemoryStore({
      store,
      now: () => new Date("2026-04-03T13:28:10.000Z"),
    });

    await sessionMemoryStore.appendRound({
      sessionId: "s1",
      userId: "u1",
      lang: "zh",
      userMessage: "我最近晚上总是醒来，还会焦虑。",
      assistantMessage: "我们先从睡前呼吸开始。",
      metadata: {
        route: "emotional_support",
        riskLevel: "R2",
        escalated: true,
        classification: {
          primary_intent: "sleep_advice",
          secondary_intents: ["emotional_support"],
          confidence: 0.86,
        },
        topic: "sleep",
        toolTrace: [{ toolName: "assess_emotional_risk" }],
        nextActions: ["先做呼吸练习"],
        primaryDistressCandidate: {
          label: "night_waking_with_anxiety",
          confidence: 0.86,
        },
        safetyTriggered: true,
        safetyRuleIds: ["rule_high_risk"],
      },
    });

    const second = await sessionMemoryStore.appendRound({
      sessionId: "s1",
      userId: "u1",
      lang: "zh",
      userMessage: "谢谢，我知道了。",
      assistantMessage: "你已经做得很好。",
      metadata: {
        route: "emotional_support",
        riskLevel: "R0",
        classification: {
          primary_intent: "daily_companionship",
          confidence: 0.7,
        },
      },
    });

    expect(second.shortTermMemory.currentPrimaryDistress.label).toBeTruthy();
    expect(second.shortTermMemory.latestEmotionalState.riskLevel).toBe("R0");
    expect(second.shortTermMemory.recentSafetyEvent.level).toBe("R0");
    expect(second.shortTermMemory.safetyLockActive).toBe(true);

    const history = await sessionMemoryStore.getHistory({
      sessionId: "s1",
      userId: "u1",
    });
    expect(history.rounds.length).toBe(2);
    expect(history.shortTermMemory.recentTurns.length).toBe(2);
    expect(history.shortTermMemory.latestRecommendation.topic).toBe("sleep");
  });
});
