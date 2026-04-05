import { describe, expect, it } from "vitest";
import { createMemoryStore } from "../../server/store/jsonStore.js";
import { createInitialUserStateMemoryState, createUserStateMemoryStore } from "../../server/services/agent/memory/userStateMemoryStore.js";

describe("user state memory store", () => {
  it("updates structured profile and writes long-term memory after repeated high-confidence distress", async () => {
    const store = createMemoryStore(createInitialUserStateMemoryState());
    const userStateMemoryStore = createUserStateMemoryStore({
      store,
      now: () => new Date("2026-04-03T13:30:00.000Z"),
    });

    const payload = {
      userId: "u1",
      sessionId: "s1",
      profile: {
        name: "Yiting",
        pregnancyWeek: "24+3",
        dueDate: "2026-06-08",
        language: "zh",
      },
      riskLevel: "R1",
      escalated: false,
      classification: {
        primary_intent: "sleep_advice",
        confidence: 0.82,
      },
      shortTermMemory: {
        currentPrimaryDistress: {
          label: "night_waking_with_anxiety",
          confidence: 0.82,
        },
        latestRecommendation: {
          topic: "sleep_hygiene_micro_routine",
        },
        recentSafetyEvent: {
          triggered: false,
        },
      },
      message: "最近总是夜醒，很焦虑。",
      lang: "zh",
      clientContext: {
        checkIns: [
          { sleepHours: 5.5 },
          { sleepHours: 6.1 },
          { sleepHours: 5.2 },
        ],
      },
    };

    await userStateMemoryStore.updateFromTurn(payload);
    const second = await userStateMemoryStore.updateFromTurn(payload);

    expect(second.user_profile.user_id).toBe("u1");
    expect(second.user_profile.last_primary_concern).toBe("night_waking_with_anxiety");
    expect(second.user_profile.faq_type_top3[0]).toBe("sleep_advice");
    expect(second.long_term_memory.emotional_patterns.tags).toContain("night_waking_with_anxiety");
    expect(second.long_term_memory.content_preferences.topic_scores.sleep_hygiene_micro_routine).toBeGreaterThan(0);
  });

  it("supports prompt context budget and intent-aware slot filtering", async () => {
    const store = createMemoryStore(createInitialUserStateMemoryState());
    const userStateMemoryStore = createUserStateMemoryStore({
      store,
      now: () => new Date("2026-04-03T13:30:00.000Z"),
    });

    await userStateMemoryStore.updateFromTurn({
      userId: "u2",
      sessionId: "s2",
      riskLevel: "R2",
      escalated: true,
      classification: {
        primary_intent: "app_feature_explanation",
        confidence: 0.92,
      },
      shortTermMemory: {
        currentPrimaryDistress: {
          label: "feature_help_request",
          confidence: 0.92,
        },
        recentSafetyEvent: {
          triggered: true,
        },
      },
      message: "以后别晚上提醒我。",
      lang: "zh",
      clientContext: {
        checkIns: [{ sleepHours: 5.8 }],
      },
    });

    const context = await userStateMemoryStore.getPromptContext({
      userId: "u2",
      intent: "feature",
      maxFields: 8,
    });
    const slotKeys = context.slots.map((slot) => slot.key);

    expect(context.slots.length).toBeLessThanOrEqual(8);
    expect(slotKeys.includes("risk_level_current")).toBe(true);
    expect(slotKeys.includes("lifestyle_trends")).toBe(false);

    const user = await userStateMemoryStore.getByUserId("u2");
    expect(user.memory_meta.pending_verification.sensitive_reminder_pref.status).toBe("pending_verification");
  });
});
