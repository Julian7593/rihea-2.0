import { describe, expect, it } from "vitest";
import { assessEmotionalRisk } from "../../src/utils/riskAssessment.js";
import { toDateKey } from "../../src/utils/checkin.js";

function createNow() {
  return new Date(2026, 2, 10, 12, 0, 0, 0);
}

function createEntry({ daysAgo = 0, mood = 2, sleepHours = 8, note = "" } = {}) {
  const now = createNow();
  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysAgo, 12, 0, 0, 0);
  return {
    date: toDateKey(date),
    mood,
    sleepHours,
    note,
    updatedAt: date.getTime(),
  };
}

describe("risk assessment hybrid engine", () => {
  it("returns no-data shape when neither check-ins nor CBT assessment exists", () => {
    const result = assessEmotionalRisk({ lang: "zh", now: createNow() });

    expect(result.hasData).toBe(false);
    expect(result.level).toBe("low");
    expect(result.alert.triggered).toBe(false);
  });

  it("marks 1-2 recent check-ins as provisional", () => {
    const result = assessEmotionalRisk({
      lang: "zh",
      now: createNow(),
      checkIns: [createEntry({ daysAgo: 0, mood: 1, sleepHours: 5 }), createEntry({ daysAgo: 1, mood: 1, sleepHours: 5.5 })],
    });

    expect(result.hasData).toBe(true);
    expect(result.provisional).toBe(true);
    expect(result.dataQuality.stable).toBe(false);
    expect(result.dataQuality.recentEntries).toBe(2);
  });

  it("treats 3 recent check-ins as stable dynamic data", () => {
    const result = assessEmotionalRisk({
      lang: "zh",
      now: createNow(),
      checkIns: [
        createEntry({ daysAgo: 0, mood: 3, sleepHours: 7.5 }),
        createEntry({ daysAgo: 1, mood: 2, sleepHours: 8 }),
        createEntry({ daysAgo: 2, mood: 3, sleepHours: 7 }),
      ],
    });

    expect(result.provisional).toBe(false);
    expect(result.dataQuality.stable).toBe(true);
    expect(result.level).toBe("low");
  });

  it("triggers urgent alert for danger signals in notes", () => {
    const result = assessEmotionalRisk({
      lang: "zh",
      now: createNow(),
      checkIns: [createEntry({ daysAgo: 0, mood: 1, sleepHours: 6, note: "我不想活了，想结束生命。" })],
    });

    expect(result.level).toBe("high");
    expect(result.alert.triggered).toBe(true);
    expect(result.alert.level).toBe("urgent");
  });

  it("uses CBT self-harm input as an immediate clinical high-risk floor", () => {
    const result = assessEmotionalRisk({
      lang: "zh",
      now: createNow(),
      cbtAssessment: {
        epdsScore: 6,
        gad7Score: 4,
        isi7Score: 5,
        selfHarmRisk: true,
        completedAt: createNow().toISOString(),
      },
    });

    expect(result.hasData).toBe(true);
    expect(result.level).toBe("high");
    expect(result.alert.level).toBe("urgent");
    expect(result.sources.clinical.valid).toBe(true);
  });

  it("keeps medium clinical floor when recent screening is valid", () => {
    const result = assessEmotionalRisk({
      lang: "zh",
      now: createNow(),
      checkIns: [
        createEntry({ daysAgo: 0, mood: 3, sleepHours: 7.5 }),
        createEntry({ daysAgo: 1, mood: 3, sleepHours: 7.5 }),
        createEntry({ daysAgo: 2, mood: 3, sleepHours: 8 }),
      ],
      cbtAssessment: {
        epdsScore: 11,
        gad7Score: 9,
        isi7Score: 7,
        selfHarmRisk: false,
        completedAt: createNow().toISOString(),
      },
    });

    expect(result.level).toBe("medium");
    expect(result.bands.clinicalLevel).toBe("medium");
    expect(result.sources.clinical.valid).toBe(true);
  });

  it("does not let expired CBT screening override current low dynamic risk", () => {
    const expiredAt = new Date(2026, 1, 20, 12, 0, 0, 0).toISOString();
    const result = assessEmotionalRisk({
      lang: "zh",
      now: createNow(),
      checkIns: [
        createEntry({ daysAgo: 0, mood: 3, sleepHours: 7.5 }),
        createEntry({ daysAgo: 1, mood: 3, sleepHours: 8 }),
        createEntry({ daysAgo: 2, mood: 2, sleepHours: 7 }),
      ],
      cbtAssessment: {
        epdsScore: 15,
        gad7Score: 16,
        isi7Score: 16,
        selfHarmRisk: false,
        completedAt: expiredAt,
      },
    });

    expect(result.sources.clinical.expired).toBe(true);
    expect(result.sources.clinical.valid).toBe(false);
    expect(result.level).toBe("low");
  });
});
