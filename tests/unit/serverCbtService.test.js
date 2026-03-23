import { describe, expect, it } from "vitest";
import { createCbtService, createInitialCbtServiceState } from "../../server/services/cbtService.js";
import { createMemoryStore } from "../../server/store/jsonStore.js";

const createService = () => {
  const store = createMemoryStore(createInitialCbtServiceState(new Date("2026-03-10T08:00:00.000Z")));
  return createCbtService({
    store,
    now: () => new Date("2026-03-10T08:00:00.000Z"),
  });
};

describe("server cbt service", () => {
  it("creates an intake plan and escalates to level2 with structured support", async () => {
    const service = createService();

    const result = await service.submitIntake(
      {
        epdsScore: 11,
        gad7Score: 12,
        isi7Score: 10,
        selfHarmRisk: false,
        childbirthFear: {
          uncertainty: 1,
          painLossOfControl: 1,
        },
      },
      { lang: "zh" }
    );

    expect(result.careLevel.code).toBe("level2");
    expect(result.weeklyPlan.length).toBe(6);
    expect(result.overview.intakeCompleted).toBe(true);
  });

  it("reorders sleep earlier when isi7 score is high", async () => {
    const service = createService();

    const result = await service.submitIntake(
      {
        epdsScore: 8,
        gad7Score: 8,
        isi7Score: 18,
        selfHarmRisk: false,
        childbirthFear: {
          uncertainty: 1,
          painLossOfControl: 1,
        },
      },
      { lang: "zh" }
    );

    expect(result.weeklyPlan[1].id).toBe("week-5-sleep-stability");
  });

  it("updates homework and records referral intent", async () => {
    const service = createService();

    await service.submitIntake(
      {
        epdsScore: 11,
        gad7Score: 11,
        isi7Score: 10,
        selfHarmRisk: false,
        childbirthFear: {
          uncertainty: 2,
          painLossOfControl: 1,
        },
      },
      { lang: "zh" }
    );

    const module = await service.getModule(1, { lang: "zh" });
    const homework = await service.updateHomework(module.homework.id, {
      status: "done",
      response: {
        summary: "记录完成",
        action: "今晚早点休息",
        reflection: "有效",
      },
    });

    expect(homework.status).toBe("done");

    const careTeam = await service.getCareTeam({ lang: "zh" });
    const slotId = careTeam.careTeamStatus.slots[0].id;
    const referral = await service.createReferral(
      {
        channel: "psychology",
        slotId,
        note: "安排本周随访",
      },
      { lang: "zh" }
    );

    expect(referral.careTeamStatus.status).toBe("scheduled");
    expect(referral.referral.slotId).toBe(slotId);
  });
});

