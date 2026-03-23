import { describe, expect, it } from "vitest";
import {
  buildCbtAssessmentRequest,
  buildCbtHomeworkPatchRequest,
  buildCbtReferralRequest,
  normalizeCbtOverviewDto,
  normalizeCbtPartnerTasksDto,
} from "../../src/api/cbtAdapter";

describe("cbt api adapter", () => {
  it("normalizes overview dto into a stable frontend shape", () => {
    const result = normalizeCbtOverviewDto({
      careLevel: {
        code: "level2",
        label: "Level 2 结构化自助+临床随访",
        desc: "desc",
        escalationCopy: "copy",
      },
      phase: "active",
      todayTask: {
        id: "cbt_today",
        title: "完成 90 秒触发记录",
        desc: "desc",
        meta: "90秒",
        status: "active",
      },
      weeklyModule: {
        id: "week-1-trigger-map",
        weekNumber: 1,
        title: "心理教育与触发识别",
        summary: "summary",
        microPractice: {
          title: "90秒触发点记录",
          desc: "desc",
          durationLabel: "90秒",
        },
        partnerAction: {
          title: "帮她减少一个触发点",
          desc: "desc",
        },
        homework: {
          id: "hw_week_1",
          moduleId: "week-1-trigger-map",
          weekNumber: 1,
          type: "thought_record",
          status: "in_progress",
          response: {
            summary: "",
            action: "",
            reflection: "",
          },
        },
      },
      reassessmentDueAt: "2026-03-24T08:00:00.000Z",
      reassessmentDueInDays: 13,
      partnerTaskSummary: {
        status: "follow_up",
        title: "今晚先替她拿走一个触发点",
        desc: "desc",
        helper: "helper",
      },
      careTeamStatus: {
        status: "suggested",
        referralRecommended: true,
        slots: [{ id: "slot1", label: "48小时内", dateTime: "2026-03-12T08:00:00.000Z" }],
      },
      crisisState: {
        active: false,
        level: "none",
        title: "",
        desc: "",
      },
      intakeCompleted: true,
      progress: {
        completedModules: 1,
        totalModules: 6,
        completionRate: 17,
      },
    });

    expect(result.careLevel.code).toBe("level2");
    expect(result.weeklyModule.homework.status).toBe("in_progress");
    expect(result.partnerTaskSummary.title).toContain("触发点");
    expect(result.careTeamStatus.referralRecommended).toBe(true);
  });

  it("normalizes partner tasks dto and builds request payloads", () => {
    const partner = normalizeCbtPartnerTasksDto({
      careLevel: { code: "level3" },
      headline: "今天先做安全支持",
      todayStatus: {
        title: "先联系专业支持",
        desc: "desc",
        status: "urgent",
      },
      tasks: [
        {
          id: "partner_safety",
          title: "通知伴侣/家人",
          desc: "desc",
          helper: "helper",
        },
      ],
      clinicalReminder: "提醒",
    });

    expect(partner.careLevel.code).toBe("level3");
    expect(partner.tasks[0].id).toBe("partner_safety");

    expect(
      buildCbtAssessmentRequest({
        epdsScore: 12,
        gad7Score: 10,
        isi7Score: 15,
        selfHarmRisk: false,
        childbirthFear: { uncertainty: 2, painLossOfControl: 1 },
      })
    ).toEqual({
      epdsScore: 12,
      gad7Score: 10,
      isi7Score: 15,
      selfHarmRisk: false,
      childbirthFear: {
        uncertainty: 2,
        painLossOfControl: 1,
      },
      source: "self_report",
    });

    expect(
      buildCbtHomeworkPatchRequest({
        status: "done",
        response: {
          summary: "summary",
          action: "action",
          reflection: "reflection",
        },
      })
    ).toEqual({
      status: "done",
      response: {
        summary: "summary",
        action: "action",
        reflection: "reflection",
      },
    });

    expect(
      buildCbtReferralRequest({
        channel: "psychology",
        slotId: "slot1",
        note: "follow up",
      })
    ).toEqual({
      channel: "psychology",
      slotId: "slot1",
      note: "follow up",
    });
  });
});

