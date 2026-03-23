import { describe, expect, it } from "vitest";
import {
  buildPartnerBindingRequest,
  buildPartnerSyncSettingsRequest,
  buildPartnerTaskStateRequest,
  normalizePartnerHomeCardDto,
  normalizePartnerOverviewDto,
} from "../../src/api/partnerSyncAdapter";

describe("partner sync api adapter", () => {
  it("normalizes overview dto into frontend shape", () => {
    const result = normalizePartnerOverviewDto({
      pairId: "pair_001",
      status: "bound",
      owner: {
        userId: "owner_001",
        nickname: "Yiting",
        pregnancyWeek: "24+3",
        dueDate: "2026-06-08",
      },
      partner: {
        userId: "partner_001",
        nickname: "Alex",
        relation: "伴侣",
        joinedAt: "2026-03-10T08:00:00.000Z",
      },
      invite: {
        code: "K8P4MX",
        expiresAt: "2026-03-17T08:00:00.000Z",
        status: "pending",
      },
      sharing: {
        level: "summary_plus",
        riskAlertsEnabled: true,
        appointmentSyncEnabled: true,
        taskSyncEnabled: true,
      },
      nextAppointment: {
        id: "appt_001",
        title: "产检复查",
        dateTime: "2026-03-14T09:30:00.000Z",
        location: "产科门诊",
      },
      preview: {
        todayStatus: {
          checkedIn: true,
          title: "今天更需要减负",
          label: "紧绷",
          desc: "优先帮她减少决策和今天的消耗。",
        },
        risk: {
          level: "medium",
          label: "中等风险",
          recommendation: "建议进行心理疏导",
          notice: {
            level: "medium",
            title: "今天需要更多照顾",
            desc: "请更主动一些",
          },
        },
        tasks: [
          {
            id: "reduce_load",
            title: "替她拿走一件消耗的事",
            desc: "今晚直接接手一件具体的事",
            meta: "15分钟",
            done: false,
            category: "care",
          },
        ],
        communication: {
          say: "今晚我先替你拿走一件消耗的事。",
          avoid: "这也没什么大不了。",
          ask: "你想让我先接手哪一件事？",
        },
      },
    });

    expect(result.status).toBe("bound");
    expect(result.partnerName).toBe("Alex");
    expect(result.sharingLevel).toBe("summary_plus");
    expect(result.preview.mainTask?.id).toBe("reduce_load");
    expect(result.preview.risk.notice?.title).toBe("今天需要更多照顾");
  });

  it("normalizes home card dto into compact card shape", () => {
    const result = normalizePartnerHomeCardDto({
      status: "bound",
      sharing: { level: "summary_plus" },
      partner: { nickname: "Alex", relation: "伴侣" },
      title: "伴侣今日行动",
      desc: "优先帮她减少决策和今天的消耗。",
      risk: {
        level: "medium",
        label: "中等风险",
        notice: {
          level: "medium",
          title: "今天需要更多照顾",
          desc: "请更主动一些",
        },
      },
      mainTask: {
        id: "reduce_load",
        title: "替她拿走一件消耗的事",
        desc: "今晚直接接手一件具体的事",
      },
      appointment: {
        id: "appt_001",
        title: "产检复查",
        dateTime: "2026-03-14T09:30:00.000Z",
        location: "产科门诊",
      },
      ctaLabel: "打开伴侣中心",
    });

    expect(result.sharingLevel).toBe("summary_plus");
    expect(result.mainTask?.title).toBe("替她拿走一件消耗的事");
    expect(result.riskNotice?.title).toBe("今天需要更多照顾");
  });

  it("builds server request payloads for bind and settings", () => {
    expect(
      buildPartnerBindingRequest({
        partnerName: "Alex",
        partnerRelation: "伴侣",
        sharingLevel: "summary_plus",
      })
    ).toEqual({
      partner: {
        nickname: "Alex",
        relation: "伴侣",
      },
      sharing: {
        level: "summary_plus",
      },
    });

    expect(
      buildPartnerSyncSettingsRequest({
        sharingLevel: "summary",
        riskAlerts: true,
      })
    ).toEqual({
      sharing: {
        level: "summary",
        riskAlertsEnabled: true,
      },
    });

    expect(buildPartnerTaskStateRequest("reduce_load", true)).toEqual({
      taskId: "reduce_load",
      done: true,
    });
  });
});
