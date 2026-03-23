import { toDateKey } from "./checkin.js";
import { assessEmotionalRisk, getRiskLevelConfig } from "./riskAssessment.js";

export const PARTNER_SYNC_STATUS = {
  DISABLED: "disabled",
  PENDING: "pending",
  BOUND: "bound",
};

export const PARTNER_SHARING_LEVEL = {
  OFF: "off",
  SUMMARY: "summary",
  SUMMARY_PLUS: "summary_plus",
};

const pick = (lang, en, zh) => (lang === "zh" ? zh : en);

const escapeValue = (value) => (typeof value === "string" ? value.trim() : "");

export const getPartnerSharingOptions = (lang) => [
  {
    value: PARTNER_SHARING_LEVEL.OFF,
    label: pick(lang, "Off", "不共享"),
    desc: pick(lang, "Pause all shared updates.", "暂停所有共享内容。"),
  },
  {
    value: PARTNER_SHARING_LEVEL.SUMMARY,
    label: pick(lang, "Summary", "状态摘要"),
    desc: pick(lang, "Share daily status and one suggested action.", "共享每日状态和一条建议动作。"),
  },
  {
    value: PARTNER_SHARING_LEVEL.SUMMARY_PLUS,
    label: pick(lang, "Summary + Tasks", "摘要+待办"),
    desc: pick(lang, "Also share care tasks and appointment prep.", "额外共享陪伴任务和产检准备。"),
  },
];

export const getPartnerStatusLabel = (status, lang) => {
  if (status === PARTNER_SYNC_STATUS.PENDING) {
    return pick(lang, "Waiting for partner", "等待伴侣加入");
  }
  if (status === PARTNER_SYNC_STATUS.BOUND) {
    return pick(lang, "Connected", "已绑定");
  }
  return pick(lang, "Not enabled", "未开启");
};

const getTodayEntry = (checkIns = [], baseDate = new Date()) => {
  const todayKey = toDateKey(baseDate);
  return checkIns.find((item) => item.date === todayKey) || null;
};

const getTodayMoodView = (lang, mood) => {
  const views = [
    {
      title: pick(lang, "Needs calm support today", "今天更需要被安抚"),
      label: pick(lang, "Low mood", "低情绪"),
      desc: pick(lang, "Keep the tone gentle and stay beside her first.", "先降低语气和节奏，先陪伴，不急着解决。"),
    },
    {
      title: pick(lang, "Needs steady company today", "今天更需要稳定陪伴"),
      label: pick(lang, "Fragile", "脆弱波动"),
      desc: pick(lang, "Listen first. One small action is better than advice.", "先听再回应，一件小事比讲道理更有效。"),
    },
    {
      title: pick(lang, "Needs lighter load today", "今天更需要减负"),
      label: pick(lang, "Tense", "紧绷"),
      desc: pick(lang, "Help reduce decisions and lower today's load.", "优先帮她减少决策和今天的消耗。"),
    },
    {
      title: pick(lang, "Mostly steady today", "今天总体还算稳定"),
      label: pick(lang, "Steady", "较平稳"),
      desc: pick(lang, "Keep connection warm and do one supportive task.", "保持连接感，完成一件支持动作即可。"),
    },
    {
      title: pick(lang, "A lighter day today", "今天相对轻松一些"),
      label: pick(lang, "Good day", "轻松日"),
      desc: pick(lang, "Use the stable moment to prepare for the next few days.", "趁状态较稳，把未来几天的准备做一点。"),
    },
  ];

  return views[mood] || views[2];
};

const getRiskSupportText = (lang, riskLevel) => {
  if (riskLevel === "high") {
    return {
      title: pick(lang, "Support should escalate today", "今天需要升级支持"),
      desc: pick(
        lang,
        "Stay available, reduce conflict, and help connect professional support if she agrees.",
        "今天优先陪伴、避免争执，并在她愿意时帮助连接专业支持。"
      ),
    };
  }

  if (riskLevel === "medium") {
    return {
      title: pick(lang, "More care is needed today", "今天需要更多照顾"),
      desc: pick(
        lang,
        "Be more proactive today and take one concrete task off her plate.",
        "今天请更主动一些，至少替她接走一件具体的事。"
      ),
    };
  }

  return {
    title: pick(lang, "Stay connected with one small action", "保持连接，做一件小事"),
    desc: pick(
      lang,
      "No urgent alert, but consistent small support still matters.",
      "当前没有升级风险，但稳定的小支持依然重要。"
    ),
  };
};

const pushTask = (list, task) => {
  if (!task?.id || list.some((item) => item.id === task.id)) return;
  list.push(task);
};

const getAppointmentPrepTask = (lang, nextAppointment) => ({
  id: "prep_appointment",
  title: pick(lang, "Prep the next appointment together", "一起准备下次产检"),
  desc: nextAppointment?.title
    ? pick(
        lang,
        `Confirm time, reports, and 3 questions for ${nextAppointment.title}.`,
        `围绕“${nextAppointment.title}”确认时间、报告和 3 个问题。`
      )
    : pick(lang, "Confirm time, reports, and 3 questions for the next visit.", "确认时间、报告和 3 个要问医生的问题。"),
  meta: pick(lang, "10 min", "10分钟"),
});

export function buildPartnerTasks({
  lang = "zh",
  checkIns = [],
  nextAppointment = null,
  taskState = {},
  sharingLevel = PARTNER_SHARING_LEVEL.SUMMARY,
}) {
  const todayEntry = getTodayEntry(checkIns);
  const risk = assessEmotionalRisk({ checkIns, lang });
  const tasks = [];

  if (!todayEntry) {
    pushTask(tasks, {
      id: "gentle_check_in",
      title: pick(lang, "Do one gentle check-in tonight", "今晚做一次温和确认"),
      desc: pick(
        lang,
        "Ask how she is holding up, then listen before offering solutions.",
        "先问她今天撑得怎么样，再听，不急着给解决方案。"
      ),
      meta: pick(lang, "Tonight", "今晚"),
    });
  } else if (todayEntry.mood <= 1) {
    pushTask(tasks, {
      id: "listen_first",
      title: pick(lang, "Listen first, fix later", "先接住情绪，再处理问题"),
      desc: pick(
        lang,
        "Pause advice for now. Stay beside her and respond to the feeling first.",
        "先不要讲道理，先陪在旁边，把感受接住。"
      ),
      meta: pick(lang, "Now", "现在"),
    });
  } else if (todayEntry.mood === 2) {
    pushTask(tasks, {
      id: "reduce_load",
      title: pick(lang, "Take one decision off her plate", "替她拿走一件消耗的事"),
      desc: pick(
        lang,
        "Pick one concrete thing tonight: meal, ride, paperwork, or home task.",
        "今晚直接接手一件具体的事：吃饭、出行、资料或家务。"
      ),
      meta: pick(lang, "15 min", "15分钟"),
    });
  } else {
    pushTask(tasks, {
      id: "keep_connection",
      title: pick(lang, "Keep the good day steady", "把今天的稳定延续下去"),
      desc: pick(
        lang,
        "Use the stable moment for one warm action like a short walk or a calm tea break.",
        "趁状态还稳，安排一件轻陪伴动作，比如散步或安静坐一会儿。"
      ),
      meta: pick(lang, "15 min", "15分钟"),
    });
  }

  if (Number.isFinite(todayEntry?.sleepHours) && todayEntry.sleepHours < 6) {
    pushTask(tasks, {
      id: "protect_sleep",
      title: pick(lang, "Protect her sleep tonight", "今晚优先保护睡眠"),
      desc: pick(
        lang,
        "Reduce late-night discussion and help her get to rest earlier.",
        "减少深夜讨论和刺激信息，尽量让她更早休息。"
      ),
      meta: pick(lang, "Sleep", "睡眠"),
    });
  }

  if (risk.level === "medium" || risk.level === "high") {
    pushTask(tasks, {
      id: "book_support",
      title: pick(lang, "Offer help to connect support", "主动提议连接支持"),
      desc: pick(
        lang,
        "If she agrees, help book counseling or prepare for a medical follow-up.",
        "如果她愿意，帮她预约咨询或准备专业随访。"
      ),
      meta: pick(lang, "Support", "支持"),
    });
  }

  if (escapeValue(todayEntry?.note)) {
    pushTask(tasks, {
      id: "follow_note",
      title: pick(lang, "Follow the need she wrote down", "顺着她写下的需要去做"),
      desc: pick(
        lang,
        `Start from her note: "${todayEntry.note.slice(0, 42)}${todayEntry.note.length > 42 ? "..." : ""}"`,
        `优先回应她写下的需要：“${todayEntry.note.slice(0, 24)}${todayEntry.note.length > 24 ? "..." : ""}”`
      ),
      meta: pick(lang, "Note", "备注"),
    });
  }

  if (nextAppointment && sharingLevel === PARTNER_SHARING_LEVEL.SUMMARY_PLUS) {
    pushTask(tasks, getAppointmentPrepTask(lang, nextAppointment));
  }

  const visibleTasks = tasks
    .slice(0, sharingLevel === PARTNER_SHARING_LEVEL.SUMMARY_PLUS ? 3 : 1)
    .map((item) => ({
      ...item,
      done: Boolean(taskState?.[item.id]),
    }));

  return visibleTasks;
}

export function buildPartnerOverview({
  lang = "zh",
  profile = {},
  checkIns = [],
  settings = {},
  baseDate = new Date(),
}) {
  const todayEntry = getTodayEntry(checkIns, baseDate);
  const risk = assessEmotionalRisk({ checkIns, lang });
  const riskConfig = getRiskLevelConfig(risk.level, lang);
  const statusView = todayEntry
    ? getTodayMoodView(lang, todayEntry.mood)
    : {
        title: pick(lang, "No check-in shared yet today", "今天还没有共享打卡"),
        label: pick(lang, "Waiting", "待同步"),
        desc: pick(
          lang,
          "She has not shared today's update yet. Ask gently once, not repeatedly.",
          "今天还没有共享状态。温和问一次即可，不要反复追问。"
        ),
      };
  const riskSupport = getRiskSupportText(lang, risk.level);
  const nextAppointment =
    settings?.nextAppointment && typeof settings.nextAppointment === "object" ? settings.nextAppointment : null;
  const sharingLevel = settings?.sharingLevel || PARTNER_SHARING_LEVEL.OFF;
  const tasks = buildPartnerTasks({
    lang,
    checkIns,
    nextAppointment,
    taskState: settings?.taskState || {},
    sharingLevel,
  });
  const riskNotice =
    settings?.riskAlerts !== false && (risk.level === "medium" || risk.level === "high")
      ? {
          level: risk.level,
          title: riskSupport.title,
          desc: riskSupport.desc,
        }
      : null;

  return {
    status: settings?.status || PARTNER_SYNC_STATUS.DISABLED,
    sharingLevel,
    partnerName: escapeValue(settings?.partnerName),
    partnerRelation: escapeValue(settings?.partnerRelation) || pick(lang, "Partner", "伴侣"),
    inviteCode: escapeValue(settings?.inviteCode),
    riskAlerts: settings?.riskAlerts !== false,
    sharedScope: getPartnerSharingOptions(lang)
      .find((item) => item.value === sharingLevel)
      ?.desc,
    todayStatus: {
      title: statusView.title,
      label: statusView.label,
      desc: statusView.desc,
      checkedIn: Boolean(todayEntry),
    },
    pregnancyWeek: profile?.pregnancyWeek || "24+3",
    dueDate: profile?.dueDate || "",
    risk: {
      level: risk.level,
      label: riskConfig?.label || pick(lang, "Low Risk", "低风险"),
      recommendation: riskConfig?.recommendation || "",
      notice: riskNotice,
    },
    nextAppointment,
    tasks,
    mainTask: tasks[0] || null,
    backupTasks: tasks.slice(1),
    communication: buildPartnerCommunication({ lang, todayEntry, riskLevel: risk.level }),
  };
}

export function buildPartnerCommunication({ lang = "zh", todayEntry = null, riskLevel = "low" }) {
  if (riskLevel === "high") {
    return {
      say: pick(lang, "I will stay with you first, we can decide the next step together.", "我先陪着你，下一步我们一起决定。"),
      avoid: pick(lang, "Don't spiral. You're overthinking.", "你别再想了，是你想太多。"),
      ask: pick(lang, "Do you want me to stay with you, or help you contact support now?", "你现在更需要我陪着，还是帮你去联系支持？"),
    };
  }

  if (todayEntry?.mood <= 1) {
    return {
      say: pick(lang, "You do not need to carry this alone today.", "今天这件事不用你一个人扛。"),
      avoid: pick(lang, "Calm down first, then talk.", "你先冷静一下再说。"),
      ask: pick(lang, "What would make tonight 10% easier for you?", "我做什么能让你今晚轻松 10%？"),
    };
  }

  if (todayEntry?.mood === 2) {
    return {
      say: pick(lang, "Let me take one thing off your plate tonight.", "今晚我先替你拿走一件消耗的事。"),
      avoid: pick(lang, "It is not a big deal.", "这也没什么大不了。"),
      ask: pick(lang, "Which task do you want me to handle first?", "你想让我先接手哪一件事？"),
    };
  }

  return {
    say: pick(lang, "You seem a bit steadier today. Let me help keep it that way.", "你今天看起来稳一些了，我来帮你把这个状态维持住。"),
    avoid: pick(lang, "See? You are fine now.", "你看吧，你现在不是挺好吗。"),
    ask: pick(lang, "Would a short walk or quiet tea break feel better tonight?", "今晚你更想散步一下，还是安静坐一会儿？"),
  };
}

export function buildPartnerHomeCard({
  lang = "zh",
  profile = {},
  checkIns = [],
  settings = {},
}) {
  const overview = buildPartnerOverview({
    lang,
    profile,
    checkIns,
    settings,
  });

  const disabled = overview.status === PARTNER_SYNC_STATUS.DISABLED;
  const paused = overview.sharingLevel === PARTNER_SHARING_LEVEL.OFF;

  return {
    status: overview.status,
    sharingLevel: overview.sharingLevel,
    partnerName: overview.partnerName,
    title: disabled
      ? pick(lang, "Invite one partner into your care loop", "邀请一位伴侣进入你的支持闭环")
      : paused
        ? pick(lang, "Partner sync is paused", "伴侣同步已暂停")
        : overview.mainTask
          ? pick(lang, "Partner action for today", "伴侣今日行动")
          : pick(lang, "Partner sync is active", "伴侣同步已开启"),
    desc: disabled
      ? pick(
          lang,
          "Keep it simple: share a summary, not all private details.",
          "先共享摘要，不共享全部私密细节。"
        )
      : paused
        ? pick(
            lang,
            "The connection remains, but no new summaries are currently shared.",
            "连接仍保留，但当前不会继续共享新摘要。"
          )
        : overview.todayStatus.desc,
    riskLabel: overview.risk.label,
    mainTask: overview.mainTask,
    riskNotice: overview.risk.notice,
    appointment:
      overview.sharingLevel === PARTNER_SHARING_LEVEL.SUMMARY_PLUS ? overview.nextAppointment : null,
    ctaLabel: disabled
      ? pick(lang, "Enable partner sync", "开启伴侣同步")
      : pick(lang, "Open partner center", "打开伴侣中心"),
  };
}
