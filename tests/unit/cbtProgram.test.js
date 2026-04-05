import { describe, expect, it } from "vitest";
import {
  CBT_CARE_LEVEL,
  CBT_HOMEWORK_STATUS,
  buildAdaptiveModulePlan,
  buildCbtPartnerTaskFeed,
  buildCbtProgramOverview,
  createInitialCbtState,
  determineCbtCareLevel,
  updateHomeworkState,
} from "../../src/utils/cbtProgram";

const createLowRiskCheckIns = () => [
  { date: "2026-03-10", mood: 3, sleepHours: 7.5, note: "", updatedAt: 1 },
  { date: "2026-03-09", mood: 3, sleepHours: 8, note: "", updatedAt: 1 },
  { date: "2026-03-08", mood: 2, sleepHours: 7, note: "", updatedAt: 1 },
];

const createHighRiskCheckIns = () => [
  { date: "2026-03-10", mood: 0, sleepHours: 4, note: "", updatedAt: 1 },
  { date: "2026-03-09", mood: 0, sleepHours: 4.5, note: "", updatedAt: 1 },
  { date: "2026-03-08", mood: 0, sleepHours: 5, note: "", updatedAt: 1 },
];

describe("cbt program utilities", () => {
  it("routes low, medium, and high thresholds into the expected care levels", () => {
    expect(
      determineCbtCareLevel({
        assessment: { epdsScore: 6, gad7Score: 5, isi7Score: 7, selfHarmRisk: false, childbirthFear: { uncertainty: 1, painLossOfControl: 1 } },
        checkIns: createLowRiskCheckIns(),
      }).level
    ).toBe(CBT_CARE_LEVEL.LEVEL_1);

    expect(
      determineCbtCareLevel({
        assessment: { epdsScore: 11, gad7Score: 8, isi7Score: 10, selfHarmRisk: false, childbirthFear: { uncertainty: 1, painLossOfControl: 1 } },
        checkIns: createLowRiskCheckIns(),
      }).level
    ).toBe(CBT_CARE_LEVEL.LEVEL_2);

    expect(
      determineCbtCareLevel({
        assessment: { epdsScore: 14, gad7Score: 12, isi7Score: 16, selfHarmRisk: false, childbirthFear: { uncertainty: 1, painLossOfControl: 1 } },
        checkIns: createLowRiskCheckIns(),
      }).level
    ).toBe(CBT_CARE_LEVEL.LEVEL_3);
<<<<<<< HEAD

    expect(
      determineCbtCareLevel({
        assessment: { epdsScore: 8, gad7Score: 7, isi7Score: 15, selfHarmRisk: false, childbirthFear: { uncertainty: 1, painLossOfControl: 1 } },
        checkIns: createLowRiskCheckIns(),
      }).level
    ).toBe(CBT_CARE_LEVEL.LEVEL_3);
=======
>>>>>>> 356bd4d38d8b7f31d8a35a177e59ac40d7d6cf8a
  });

  it("moves the sleep module earlier when insomnia is high", () => {
    const modules = buildAdaptiveModulePlan({
      lang: "zh",
      pregnancyWeek: "24+3",
      assessment: {
        epdsScore: 9,
        gad7Score: 9,
        isi7Score: 18,
        selfHarmRisk: false,
        childbirthFear: { uncertainty: 1, painLossOfControl: 1 },
      },
      careLevel: CBT_CARE_LEVEL.LEVEL_2,
    });

    expect(modules[1].id).toBe("week-5-sleep-stability");
  });

  it("moves birth prep earlier in late pregnancy when childbirth fear is positive", () => {
    const modules = buildAdaptiveModulePlan({
      lang: "zh",
      pregnancyWeek: "32+0",
      assessment: {
        epdsScore: 9,
        gad7Score: 9,
        isi7Score: 10,
        selfHarmRisk: false,
        childbirthFear: { uncertainty: 3, painLossOfControl: 2 },
      },
      careLevel: CBT_CARE_LEVEL.LEVEL_2,
    });

    expect(modules[1].id).toBe("week-6-birth-prep");
  });

  it("advances the current week when homework is completed", () => {
    const program = createInitialCbtState({
      lang: "zh",
      profile: { pregnancyWeek: "24+3", dueDate: "2026-06-08" },
      checkIns: createLowRiskCheckIns(),
      assessment: {
        epdsScore: 8,
        gad7Score: 8,
        isi7Score: 9,
        selfHarmRisk: false,
        childbirthFear: { uncertainty: 1, painLossOfControl: 1 },
      },
      now: new Date("2026-03-10T08:00:00.000Z"),
    });

    const firstHomeworkId = program.homework[0].id;
    const next = updateHomeworkState(
      program,
      firstHomeworkId,
      {
        status: CBT_HOMEWORK_STATUS.DONE,
      },
      new Date("2026-03-11T08:00:00.000Z")
    );

    expect(next.currentWeek).toBe(2);
    expect(next.homework.find((item) => item.weekNumber === 2)?.status).toBe(CBT_HOMEWORK_STATUS.IN_PROGRESS);
  });

  it("builds an urgent partner feed when crisis is active", () => {
    const program = createInitialCbtState({
      lang: "zh",
      profile: { pregnancyWeek: "24+3", dueDate: "2026-06-08" },
      checkIns: createHighRiskCheckIns(),
      assessment: {
        epdsScore: 15,
        gad7Score: 16,
        isi7Score: 17,
        selfHarmRisk: true,
        childbirthFear: { uncertainty: 2, painLossOfControl: 2 },
      },
      now: new Date("2026-03-10T08:00:00.000Z"),
    });

    const overview = buildCbtProgramOverview({
      lang: "zh",
      state: program,
      profile: { pregnancyWeek: "24+3", dueDate: "2026-06-08" },
      checkIns: createHighRiskCheckIns(),
    });
    const partnerFeed = buildCbtPartnerTaskFeed({
      lang: "zh",
      state: program,
      profile: { pregnancyWeek: "24+3", dueDate: "2026-06-08" },
      checkIns: createHighRiskCheckIns(),
    });

    expect(overview.crisisState.active).toBe(true);
    expect(partnerFeed.tasks[0].title).toContain("安全");
  });
});
<<<<<<< HEAD
=======

>>>>>>> 356bd4d38d8b7f31d8a35a177e59ac40d7d6cf8a
