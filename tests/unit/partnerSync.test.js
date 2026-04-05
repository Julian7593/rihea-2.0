import { describe, expect, it } from "vitest";
import { toDateKey } from "../../src/utils/checkin";
import {
  buildPartnerHomeCard,
  buildPartnerOverview,
  buildPartnerTasks,
  PARTNER_SHARING_LEVEL,
  PARTNER_SYNC_STATUS,
} from "../../src/utils/partnerSync";

const addDays = (date, offset) => {
  const next = new Date(date);
  next.setDate(next.getDate() + offset);
  return next;
};

describe("partner sync utilities", () => {
  it("returns a gentle check-in task when there is no check-in today", () => {
    const yesterday = addDays(new Date(), -1);
    const tasks = buildPartnerTasks({
      lang: "zh",
      checkIns: [
        {
          date: toDateKey(yesterday),
          mood: 2,
          tag: "",
          note: "",
          sleepHours: 7,
        },
      ],
      sharingLevel: PARTNER_SHARING_LEVEL.SUMMARY,
    });

    expect(tasks).toHaveLength(1);
    expect(tasks[0].id).toBe("gentle_check_in");
  });

  it("limits visible tasks to one item in summary mode", () => {
    const today = new Date();
    const tasks = buildPartnerTasks({
      lang: "zh",
      checkIns: [
        {
          date: toDateKey(today),
          mood: 0,
          tag: "睡眠不佳",
          note: "今晚特别想早点睡",
          sleepHours: 4.5,
        },
      ],
      nextAppointment: {
        id: "appt-1",
        title: "产检复查",
        dateTime: today.toISOString(),
        location: "产科门诊",
      },
      sharingLevel: PARTNER_SHARING_LEVEL.SUMMARY,
    });

    expect(tasks).toHaveLength(1);
    expect(tasks[0].id).toBe("listen_first");
  });

  it("includes risk notice and multiple tasks in summary+tasks mode", () => {
    const today = new Date();
    const checkIns = [0, -1, -2].map((offset) => ({
      date: toDateKey(addDays(today, offset)),
      mood: 0,
      tag: "产检焦虑",
      note: "担心明天检查结果",
      sleepHours: 4,
    }));

    const overview = buildPartnerOverview({
      lang: "zh",
      profile: {
        pregnancyWeek: "24+3",
        dueDate: "2026-06-08",
      },
      checkIns,
      settings: {
        status: PARTNER_SYNC_STATUS.BOUND,
        sharingLevel: PARTNER_SHARING_LEVEL.SUMMARY_PLUS,
        riskAlerts: true,
        nextAppointment: {
          id: "appt-1",
          title: "产检复查",
          dateTime: today.toISOString(),
          location: "产科门诊",
        },
      },
    });

    expect(overview.risk.notice).not.toBeNull();
    expect(overview.tasks.length).toBeGreaterThan(1);
    expect(overview.mainTask?.id).toBe("listen_first");
  });

  it("builds a compact home card view for the homepage", () => {
    const today = new Date();
    const card = buildPartnerHomeCard({
      lang: "zh",
      profile: {
        pregnancyWeek: "24+3",
        dueDate: "2026-06-08",
      },
      checkIns: [
        {
          date: toDateKey(today),
          mood: 2,
          tag: "家人支持",
          note: "今晚想早点休息",
          sleepHours: 5.5,
        },
      ],
      settings: {
        status: PARTNER_SYNC_STATUS.BOUND,
        sharingLevel: PARTNER_SHARING_LEVEL.SUMMARY_PLUS,
        riskAlerts: true,
        nextAppointment: {
          id: "appt-1",
          title: "产检复查",
          dateTime: today.toISOString(),
          location: "产科门诊",
        },
      },
    });

    expect(card.status).toBe(PARTNER_SYNC_STATUS.BOUND);
    expect(card.mainTask).not.toBeNull();
    expect(card.ctaLabel).toBe("打开伴侣中心");
  });
});
