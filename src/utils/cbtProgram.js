import { CBT_CARE_LEVEL_CONTENT, CBT_MODULE_LIBRARY, CBT_PROGRAM_VERSION } from "../data/cbtContent";
import { shouldTriggerEmergencyAlert, assessEmotionalRisk } from "./riskAssessment";

export const CBT_PHASE = {
  INTAKE: "intake",
  ACTIVE: "active",
  REASSESSMENT_DUE: "reassessment_due",
  CRISIS: "crisis",
};

export const CBT_CARE_LEVEL = {
  LEVEL_1: "level1",
  LEVEL_2: "level2",
  LEVEL_3: "level3",
};

export const CBT_HOMEWORK_STATUS = {
  TODO: "todo",
  IN_PROGRESS: "in_progress",
  DONE: "done",
};

export const CBT_HOMEWORK_TYPES = {
  THOUGHT_RECORD: "thought_record",
  ACTIVITY_PLAN: "activity_plan",
  PROBLEM_SOLVING: "problem_solving",
  SLEEP_PLAN: "sleep_plan",
  BIRTH_FEAR_EXPOSURE: "birth_fear_exposure",
};

export const CBT_CARE_TEAM_STATUS = {
  NONE: "none",
  SUGGESTED: "suggested",
  REFERRED: "referred",
  SCHEDULED: "scheduled",
  FOLLOW_UP: "follow_up",
};

const DAY_MS = 24 * 60 * 60 * 1000;

const pickText = (lang, value, fallback = "") => {
  if (!value || typeof value !== "object") return fallback;
  return lang === "en" ? value.en || value.zh || fallback : value.zh || value.en || fallback;
};

const clampScore = (value, max) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.max(0, Math.min(max, Math.round(num)));
};

const moveModuleAfter = (modules, targetId, afterId) => {
  const next = [...modules];
  const targetIndex = next.findIndex((item) => item.id === targetId);
  const afterIndex = next.findIndex((item) => item.id === afterId);
  if (targetIndex < 0 || afterIndex < 0 || targetIndex === afterIndex) return next;
  const [target] = next.splice(targetIndex, 1);
  const insertIndex = next.findIndex((item) => item.id === afterId);
  next.splice(insertIndex + 1, 0, target);
  return next;
};

export const parsePregnancyWeek = (weekLabel) => {
  if (typeof weekLabel !== "string") return { week: 24, day: 0 };
  const match = /^(\d{1,2})\+([0-6])$/.exec(weekLabel.trim());
  if (!match) return { week: 24, day: 0 };
  return {
    week: Number(match[1]),
    day: Number(match[2]),
  };
};

export const getCbtCareLevelMeta = (level, lang = "zh") => {
  const safeLevel = CBT_CARE_LEVEL_CONTENT[level] ? level : CBT_CARE_LEVEL.LEVEL_1;
  const meta = CBT_CARE_LEVEL_CONTENT[safeLevel];
  return {
    code: safeLevel,
    label: pickText(lang, meta.label),
    desc: pickText(lang, meta.desc),
    escalationCopy: pickText(lang, meta.escalationCopy),
  };
};

export const normalizeCbtAssessmentInput = (payload = {}) => {
  const childbirthFear = payload?.childbirthFear && typeof payload.childbirthFear === "object" ? payload.childbirthFear : {};

  return {
    epdsScore: clampScore(payload?.epdsScore, 30),
    gad7Score: clampScore(payload?.gad7Score, 21),
    isi7Score: clampScore(payload?.isi7Score, 28),
    selfHarmRisk: Boolean(payload?.selfHarmRisk),
    childbirthFear: {
      uncertainty: clampScore(childbirthFear?.uncertainty, 3),
      painLossOfControl: clampScore(childbirthFear?.painLossOfControl, 3),
    },
    source: typeof payload?.source === "string" ? payload.source : "self_report",
  };
};

export const validateCbtAssessmentInput = (payload = {}) => {
  const assessment = normalizeCbtAssessmentInput(payload);
  const errors = [];
  const childbirthFear = payload?.childbirthFear && typeof payload.childbirthFear === "object" ? payload.childbirthFear : {};

  if (!Number.isFinite(Number(payload?.epdsScore)) || Number(payload.epdsScore) < 0 || Number(payload.epdsScore) > 30) {
    errors.push("EPDS score must be between 0 and 30.");
  }
  if (!Number.isFinite(Number(payload?.gad7Score)) || Number(payload.gad7Score) < 0 || Number(payload.gad7Score) > 21) {
    errors.push("GAD-7 score must be between 0 and 21.");
  }
  if (!Number.isFinite(Number(payload?.isi7Score)) || Number(payload.isi7Score) < 0 || Number(payload.isi7Score) > 28) {
    errors.push("ISI-7 score must be between 0 and 28.");
  }
  if (Number(childbirthFear.uncertainty ?? assessment.childbirthFear.uncertainty) < 0 || Number(childbirthFear.uncertainty ?? assessment.childbirthFear.uncertainty) > 3) {
    errors.push("Childbirth fear uncertainty must be between 0 and 3.");
  }
  if (
    Number(childbirthFear.painLossOfControl ?? assessment.childbirthFear.painLossOfControl) < 0 ||
    Number(childbirthFear.painLossOfControl ?? assessment.childbirthFear.painLossOfControl) > 3
  ) {
    errors.push("Childbirth fear pain/loss of control must be between 0 and 3.");
  }

  return {
    valid: errors.length === 0,
    errors,
    assessment,
  };
};

export const isChildbirthFearPositive = (assessment = {}) => {
  const fear = assessment?.childbirthFear || {};
  const total = clampScore(fear.uncertainty, 3) + clampScore(fear.painLossOfControl, 3);
  return total >= 4 || clampScore(fear.uncertainty, 3) >= 3 || clampScore(fear.painLossOfControl, 3) >= 3;
};

export const deriveDynamicRiskSignals = ({ checkIns = [] } = {}) => {
  const riskAssessment = assessEmotionalRisk({ checkIns, lang: "zh" });
  const emergencyTriggered = shouldTriggerEmergencyAlert({ checkIns });
  return {
    level: riskAssessment.level,
    score: riskAssessment.score,
    emergencyTriggered,
    metrics: riskAssessment.metrics || {},
  };
};

export const determineCbtCareLevel = ({ assessment, checkIns = [] }) => {
  const normalized = normalizeCbtAssessmentInput(assessment);
  const signals = deriveDynamicRiskSignals({ checkIns });

  const level3 =
    normalized.selfHarmRisk ||
    normalized.epdsScore >= 13 ||
    normalized.gad7Score >= 15 ||
    signals.emergencyTriggered;

  if (level3) {
    return {
      level: CBT_CARE_LEVEL.LEVEL_3,
      reason: "clinical_priority",
      dynamicRisk: signals,
    };
  }

  const level2 =
    (normalized.epdsScore >= 10 && normalized.epdsScore <= 12) ||
    (normalized.gad7Score >= 10 && normalized.gad7Score <= 14) ||
    normalized.isi7Score >= 15 ||
    signals.level === "medium" ||
    signals.metrics?.consecutiveLowMoodDays >= 3;

  if (level2) {
    return {
      level: CBT_CARE_LEVEL.LEVEL_2,
      reason: "structured_support",
      dynamicRisk: signals,
    };
  }

  return {
    level: CBT_CARE_LEVEL.LEVEL_1,
    reason: "self_guided",
    dynamicRisk: signals,
  };
};

export const localizeCbtModule = (module, lang = "zh") => ({
  id: module.id,
  weekNumber: module.weekNumber,
  version: module.version || CBT_PROGRAM_VERSION,
  pregnancyWeekRange: Array.isArray(module.pregnancyWeekRange) ? [...module.pregnancyWeekRange] : [4, 42],
  contraindications: Array.isArray(module.contraindications) ? [...module.contraindications] : [],
  escalationCopy: pickText(lang, module.escalationCopy),
  title: pickText(lang, module.title),
  summary: pickText(lang, module.summary),
  microPractice: {
    title: pickText(lang, module.microPractice?.title),
    desc: pickText(lang, module.microPractice?.desc),
    durationLabel: pickText(lang, module.microPractice?.durationLabel),
  },
  partnerAction: {
    title: pickText(lang, module.partnerAction?.title),
    desc: pickText(lang, module.partnerAction?.desc),
  },
  homeworkTemplate: {
    type: module.homeworkTemplate?.type,
    title: pickText(lang, module.homeworkTemplate?.title),
    prompt: pickText(lang, module.homeworkTemplate?.prompt),
    helper: pickText(lang, module.homeworkTemplate?.helper),
  },
});

export const buildAdaptiveModulePlan = ({ lang = "zh", pregnancyWeek = "24+0", assessment = {}, careLevel }) => {
  const week = parsePregnancyWeek(pregnancyWeek).week;
  let modules = CBT_MODULE_LIBRARY.map((item) => localizeCbtModule(item, lang));

  if (normalizeCbtAssessmentInput(assessment).isi7Score >= 15) {
    modules = moveModuleAfter(modules, "week-5-sleep-stability", "week-1-trigger-map");
  }

  if (week >= 28 && isChildbirthFearPositive(assessment)) {
    modules = moveModuleAfter(modules, "week-6-birth-prep", "week-1-trigger-map");
  }

  modules = modules.map((item, index) => ({
    ...item,
    weekNumber: index + 1,
    priority:
      careLevel === CBT_CARE_LEVEL.LEVEL_3 && index === 0
        ? "clinical"
        : index === 0
          ? "current"
          : "planned",
  }));

  return modules;
};

export const buildHomeworkEntries = (modules = [], now = new Date()) =>
  modules.map((module, index) => ({
    id: `hw_${module.id}`,
    weekNumber: module.weekNumber,
    moduleId: module.id,
    type: module.homeworkTemplate.type,
    title: module.homeworkTemplate.title,
    prompt: module.homeworkTemplate.prompt,
    helper: module.homeworkTemplate.helper,
    status: index === 0 ? CBT_HOMEWORK_STATUS.IN_PROGRESS : CBT_HOMEWORK_STATUS.TODO,
    response: {
      summary: "",
      action: "",
      reflection: "",
    },
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  }));

export const getCurrentHomework = (state = {}) => {
  const list = Array.isArray(state?.homework) ? state.homework : [];
  return list.find((item) => item.status !== CBT_HOMEWORK_STATUS.DONE) || list[0] || null;
};

export const getCurrentModule = (state = {}) => {
  const modules = Array.isArray(state?.modules) ? state.modules : [];
  const currentWeek = Number.isFinite(Number(state?.currentWeek)) ? Number(state.currentWeek) : 1;
  return modules.find((item) => item.weekNumber === currentWeek) || modules[0] || null;
};

export const getModuleByWeek = (state = {}, weekNumber) => {
  const modules = Array.isArray(state?.modules) ? state.modules : [];
  const safeWeek = Number.isFinite(Number(weekNumber)) ? Number(weekNumber) : 1;
  return modules.find((item) => item.weekNumber === safeWeek) || null;
};

export const buildCareTeamStatus = ({ lang = "zh", careLevel, now = new Date(), previous = null } = {}) => {
  if (previous && typeof previous === "object") {
    return {
      status: previous.status || CBT_CARE_TEAM_STATUS.NONE,
      referralRecommended: Boolean(previous.referralRecommended),
      nextFollowUpAt: previous.nextFollowUpAt || null,
      lastActionAt: previous.lastActionAt || null,
      channel: previous.channel || "",
      note: previous.note || "",
      slots: Array.isArray(previous.slots) ? [...previous.slots] : [],
    };
  }

  const level = careLevel || CBT_CARE_LEVEL.LEVEL_1;
  if (level === CBT_CARE_LEVEL.LEVEL_1) {
    return {
      status: CBT_CARE_TEAM_STATUS.NONE,
      referralRecommended: false,
      nextFollowUpAt: null,
      lastActionAt: null,
      channel: "",
      note: "",
      slots: [],
    };
  }

  const slotBase = now.getTime();
  const slots = [
    {
      id: "slot_psych_1",
      label:
        lang === "en"
          ? "Within 48h · Perinatal psychologist"
          : "48小时内 · 围产期心理咨询",
      dateTime: new Date(slotBase + 2 * DAY_MS).toISOString(),
    },
    {
      id: "slot_midwife_1",
      label:
        lang === "en"
          ? "This week · Midwife emotional follow-up"
          : "本周内 · 助产士情绪随访",
      dateTime: new Date(slotBase + 4 * DAY_MS).toISOString(),
    },
  ];

  return {
    status: CBT_CARE_TEAM_STATUS.SUGGESTED,
    referralRecommended: true,
    nextFollowUpAt: new Date(slotBase + 7 * DAY_MS).toISOString(),
    lastActionAt: null,
    channel: "",
    note:
      level === CBT_CARE_LEVEL.LEVEL_3
        ? pickText(lang, { zh: "请优先完成安全确认和专业转介。", en: "Prioritize safety check and clinical referral." })
        : pickText(lang, { zh: "建议在 72 小时内安排一次专业随访。", en: "Arrange one professional follow-up within 72 hours." }),
    slots,
  };
};

export const buildCrisisState = ({ lang = "zh", assessment = {}, checkIns = [], careLevel }) => {
  const signals = deriveDynamicRiskSignals({ checkIns });
  const normalized = normalizeCbtAssessmentInput(assessment);
  const active = Boolean(normalized.selfHarmRisk || signals.emergencyTriggered || careLevel === CBT_CARE_LEVEL.LEVEL_3);
  if (!active) {
    return {
      active: false,
      level: "none",
      title: "",
      desc: "",
      actions: [],
    };
  }

  return {
    active: true,
    level: normalized.selfHarmRisk || signals.emergencyTriggered ? "high" : "watch",
    title: pickText(lang, { zh: "当前需要优先安全与专业支持", en: "Safety and professional support come first now." }),
    desc: normalized.selfHarmRisk
      ? pickText(lang, { zh: "检测到安全风险，请立即联系专业人员并通知伴侣或家人。", en: "Safety risk detected. Contact a professional now and alert partner or family." })
      : pickText(lang, { zh: "近期风险持续偏高，请先完成转介与安全计划。", en: "Recent risk remains high. Complete referral and a safety plan first." }),
    actions: [
      {
        id: "contact_clinician",
        label: pickText(lang, { zh: "联系专业人员", en: "Contact a clinician" }),
      },
      {
        id: "notify_partner",
        label: pickText(lang, { zh: "通知伴侣/家人", en: "Notify partner/family" }),
      },
      {
        id: "go_emergency",
        label: pickText(lang, { zh: "如有急性风险，立即就医", en: "Go to emergency care if risk escalates" }),
      },
    ],
  };
};

export const createInitialCbtState = ({
  lang = "zh",
  profile = {},
  checkIns = [],
  assessment = null,
  now = new Date(),
  previous = null,
} = {}) => {
  const pregnancyWeek = profile?.pregnancyWeek || "24+0";
  if (!assessment) {
    return {
      version: CBT_PROGRAM_VERSION,
      phase: CBT_PHASE.INTAKE,
      currentWeek: 1,
      startedAt: null,
      lastUpdatedAt: now.toISOString(),
      pregnancyWeek,
      intakeCompleted: false,
      intakeAssessment: null,
      reassessmentHistory: [],
      careLevel: getCbtCareLevelMeta(CBT_CARE_LEVEL.LEVEL_1, lang),
      modules: buildAdaptiveModulePlan({ lang, pregnancyWeek, assessment: {}, careLevel: CBT_CARE_LEVEL.LEVEL_1 }),
      homework: [],
      reassessmentDueAt: null,
      careTeamStatus: buildCareTeamStatus({ lang, careLevel: CBT_CARE_LEVEL.LEVEL_1, now }),
      crisisState: buildCrisisState({ lang, assessment: {}, checkIns, careLevel: CBT_CARE_LEVEL.LEVEL_1 }),
    };
  }

  const normalizedAssessment = normalizeCbtAssessmentInput(assessment);
  const resolution = determineCbtCareLevel({ assessment: normalizedAssessment, checkIns });
  const modules = buildAdaptiveModulePlan({
    lang,
    pregnancyWeek,
    assessment: normalizedAssessment,
    careLevel: resolution.level,
  });
  const homework = buildHomeworkEntries(modules, now);

  return {
    version: CBT_PROGRAM_VERSION,
    phase: resolution.level === CBT_CARE_LEVEL.LEVEL_3 ? CBT_PHASE.CRISIS : CBT_PHASE.ACTIVE,
    currentWeek: 1,
    startedAt: previous?.startedAt || now.toISOString(),
    lastUpdatedAt: now.toISOString(),
    pregnancyWeek,
    intakeCompleted: true,
    intakeAssessment: {
      ...normalizedAssessment,
      completedAt: now.toISOString(),
      source: normalizedAssessment.source || "self_report",
    },
    reassessmentHistory: Array.isArray(previous?.reassessmentHistory) ? [...previous.reassessmentHistory] : [],
    careLevel: {
      ...getCbtCareLevelMeta(resolution.level, lang),
      reason: resolution.reason,
      dynamicRisk: resolution.dynamicRisk,
    },
    modules,
    homework,
    reassessmentDueAt: new Date(now.getTime() + 14 * DAY_MS).toISOString(),
    careTeamStatus: buildCareTeamStatus({
      lang,
      careLevel: resolution.level,
      now,
      previous: previous?.intakeCompleted ? previous?.careTeamStatus : null,
    }),
    crisisState: buildCrisisState({ lang, assessment: normalizedAssessment, checkIns, careLevel: resolution.level }),
  };
};

export const buildPartnerTaskSummary = ({ lang = "zh", state = {}, careLevel, crisisState }) => {
  const currentModule = getCurrentModule(state);
  const level = careLevel?.code || careLevel?.level || CBT_CARE_LEVEL.LEVEL_1;

  if (crisisState?.active) {
    return {
      status: "urgent",
      title: pickText(lang, { zh: "伴侣今天先做安全确认", en: "Partner first: safety check today" }),
      desc: pickText(lang, { zh: "主动陪伴、减少独处，并协助联系专业支持。", en: "Stay close, reduce isolation, and help connect professional care." }),
      helper: pickText(lang, { zh: "不要讲道理，先确认她现在是否安全。", en: "Do not reason first. Confirm safety first." }),
    };
  }

  if (!currentModule) {
    return {
      status: "pending",
      title: pickText(lang, { zh: "先完成基线筛查", en: "Complete intake first" }),
      desc: pickText(lang, { zh: "筛查完成后，系统会生成伴侣今天要做的一件事。", en: "After intake, the system will generate one partner action for today." }),
      helper: "",
    };
  }

  return {
    status: level === CBT_CARE_LEVEL.LEVEL_2 ? "follow_up" : "active",
    title: currentModule.partnerAction.title,
    desc: currentModule.partnerAction.desc,
    helper:
      level === CBT_CARE_LEVEL.LEVEL_2
        ? pickText(lang, { zh: "建议同时确认本周随访或转介安排。", en: "Also confirm this week's follow-up or referral plan." })
        : pickText(lang, { zh: "完成后记得问她现在还需要你做什么。", en: "After this, ask what else she needs from you now." }),
  };
};

export const buildTodayTask = ({ lang = "zh", state = {} }) => {
  if (!state?.intakeCompleted) {
    return {
      id: "cbt_intake",
      title: pickText(lang, { zh: "完成基线筛查", en: "Complete baseline screening" }),
      desc: pickText(lang, { zh: "录入 EPDS、GAD-7、ISI-7 和安全问题，系统会生成分层计划。", en: "Enter EPDS, GAD-7, ISI-7 and safety answers to unlock your plan." }),
      meta: pickText(lang, { zh: "约3分钟", en: "About 3 min" }),
      status: "pending",
    };
  }

  if (state?.crisisState?.active) {
    return {
      id: "cbt_crisis",
      title: pickText(lang, { zh: "优先完成安全计划", en: "Complete the safety plan first" }),
      desc: pickText(lang, { zh: "先联系专业支持，并让伴侣或家人知道你现在需要帮助。", en: "Contact professional support first and let partner or family know you need help." }),
      meta: pickText(lang, { zh: "立即", en: "Now" }),
      status: "urgent",
    };
  }

  const currentModule = getCurrentModule(state);
  const homework = getCurrentHomework(state);

  return {
    id: currentModule?.id || "cbt_today",
    title: currentModule?.microPractice?.title || pickText(lang, { zh: "今天做一个小练习", en: "Do one small practice today" }),
    desc: currentModule?.microPractice?.desc || "",
    meta: currentModule?.microPractice?.durationLabel || "",
    status: homework?.status === CBT_HOMEWORK_STATUS.DONE ? "done" : "active",
  };
};

export const buildCbtProgramOverview = ({ lang = "zh", state = {}, profile = {}, checkIns = [] }) => {
  const currentModule = getCurrentModule(state);
  const homework = getCurrentHomework(state);
  const level = state?.careLevel || getCbtCareLevelMeta(CBT_CARE_LEVEL.LEVEL_1, lang);
  const crisisState =
    state?.crisisState || buildCrisisState({ lang, assessment: state?.intakeAssessment, checkIns, careLevel: level.code });
  const careTeamStatus = state?.careTeamStatus || buildCareTeamStatus({ lang, careLevel: level.code });
  const completedCount = Array.isArray(state?.homework)
    ? state.homework.filter((item) => item.status === CBT_HOMEWORK_STATUS.DONE).length
    : 0;
  const totalCount = Array.isArray(state?.modules) ? state.modules.length : 0;
  const reassessmentDueAt = state?.reassessmentDueAt || null;
  const daysUntilReassessment = reassessmentDueAt
    ? Math.max(0, Math.ceil((new Date(reassessmentDueAt).getTime() - Date.now()) / DAY_MS))
    : null;
  const nextPhase =
    crisisState.active
      ? CBT_PHASE.CRISIS
      : reassessmentDueAt && new Date(reassessmentDueAt).getTime() < Date.now()
        ? CBT_PHASE.REASSESSMENT_DUE
        : state?.phase || CBT_PHASE.INTAKE;

  return {
    version: state?.version || CBT_PROGRAM_VERSION,
    careLevel: {
      ...level,
      code: level.code || CBT_CARE_LEVEL.LEVEL_1,
    },
    phase: nextPhase,
    todayTask: buildTodayTask({ lang, state }),
    weeklyModule: currentModule
      ? {
          ...currentModule,
          homework:
            homework && homework.moduleId === currentModule.id
              ? homework
              : Array.isArray(state?.homework)
                ? state.homework.find((item) => item.moduleId === currentModule.id) || null
                : null,
        }
      : null,
    reassessmentDueAt,
    reassessmentDueInDays: daysUntilReassessment,
    partnerTaskSummary: buildPartnerTaskSummary({ lang, state, careLevel: level, crisisState }),
    careTeamStatus,
    crisisState,
    intakeCompleted: Boolean(state?.intakeCompleted),
    intakeAssessment: state?.intakeAssessment || null,
    progress: {
      completedModules: completedCount,
      totalModules: totalCount,
      completionRate: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
    },
    profile: {
      pregnancyWeek: profile?.pregnancyWeek || state?.pregnancyWeek || "24+0",
      dueDate: profile?.dueDate || "",
    },
  };
};

export const buildCbtPartnerTaskFeed = ({ lang = "zh", state = {}, profile = {}, checkIns = [] }) => {
  const overview = buildCbtProgramOverview({ lang, state, profile, checkIns });
  const crisis = overview.crisisState;

  return {
    careLevel: overview.careLevel,
    headline: crisis?.active
      ? pickText(lang, { zh: "今天先做安全支持", en: "Lead with safety support today" })
      : pickText(lang, { zh: "伴侣今日支持动作", en: "Partner support for today" }),
    todayStatus: {
      title: overview.todayTask.title,
      desc: overview.todayTask.desc,
      status: overview.todayTask.status,
    },
    tasks: [
      {
        id: crisis?.active ? "partner_safety" : "partner_module_support",
        title: overview.partnerTaskSummary.title,
        desc: overview.partnerTaskSummary.desc,
        helper: overview.partnerTaskSummary.helper,
      },
    ],
    clinicalReminder:
      overview.careTeamStatus?.referralRecommended
        ? pickText(lang, { zh: "本周需要确认随访或转介安排。", en: "Confirm follow-up or referral this week." })
        : "",
  };
};

export const updateHomeworkState = (state = {}, homeworkId, patch = {}, now = new Date()) => {
  const list = Array.isArray(state?.homework) ? state.homework : [];
  const nextHomework = list.map((item) =>
    item.id === homeworkId
      ? {
          ...item,
          ...patch,
          response: {
            ...item.response,
            ...(patch.response && typeof patch.response === "object" ? patch.response : {}),
          },
          updatedAt: now.toISOString(),
        }
      : item
  );

  const currentIndex = nextHomework.findIndex((item) => item.id === homeworkId);
  const current = currentIndex >= 0 ? nextHomework[currentIndex] : null;
  let currentWeek = state?.currentWeek || 1;

  if (current?.status === CBT_HOMEWORK_STATUS.DONE) {
    const nextPending = nextHomework.find((item) => item.status !== CBT_HOMEWORK_STATUS.DONE);
    currentWeek = nextPending?.weekNumber || current.weekNumber || currentWeek;
    nextHomework.forEach((item, index) => {
      if (item.status === CBT_HOMEWORK_STATUS.TODO && item.weekNumber === currentWeek) {
        nextHomework[index] = {
          ...item,
          status: CBT_HOMEWORK_STATUS.IN_PROGRESS,
          updatedAt: now.toISOString(),
        };
      }
    });
  }

  return {
    ...state,
    homework: nextHomework,
    currentWeek,
    lastUpdatedAt: now.toISOString(),
  };
};

export const buildReassessmentState = ({
  lang = "zh",
  state = {},
  assessment = {},
  checkIns = [],
  profile = {},
  now = new Date(),
} = {}) => {
  const next = createInitialCbtState({
    lang,
    profile: {
      pregnancyWeek: profile?.pregnancyWeek || state?.pregnancyWeek || "24+0",
      dueDate: profile?.dueDate || "",
    },
    checkIns,
    assessment,
    now,
    previous: state,
  });
  const previousLevel = state?.careLevel?.code || CBT_CARE_LEVEL.LEVEL_1;
  const nextLevel = next.careLevel.code;

  return {
    ...next,
    currentWeek: Math.min(Number(state?.currentWeek || 1), next.modules.length || 1),
    homework:
      Array.isArray(state?.homework) && state.homework.length > 0
        ? next.modules.map((module) => {
            const existing = state.homework.find((item) => item.moduleId === module.id);
            return existing
              ? {
                  ...existing,
                  weekNumber: module.weekNumber,
                  title: module.homeworkTemplate.title,
                  prompt: module.homeworkTemplate.prompt,
                  helper: module.homeworkTemplate.helper,
                  type: module.homeworkTemplate.type,
                }
              : {
                  id: `hw_${module.id}`,
                  weekNumber: module.weekNumber,
                  moduleId: module.id,
                  type: module.homeworkTemplate.type,
                  title: module.homeworkTemplate.title,
                  prompt: module.homeworkTemplate.prompt,
                  helper: module.homeworkTemplate.helper,
                  status: module.weekNumber === (state?.currentWeek || 1) ? CBT_HOMEWORK_STATUS.IN_PROGRESS : CBT_HOMEWORK_STATUS.TODO,
                  response: {
                    summary: "",
                    action: "",
                    reflection: "",
                  },
                  createdAt: now.toISOString(),
                  updatedAt: now.toISOString(),
                };
          })
        : buildHomeworkEntries(next.modules, now),
    reassessmentHistory: [
      ...(Array.isArray(state?.reassessmentHistory) ? state.reassessmentHistory : []),
      {
        at: now.toISOString(),
        previousLevel,
        nextLevel,
        assessment: normalizeCbtAssessmentInput(assessment),
      },
    ],
    reassessmentDueAt: new Date(now.getTime() + 14 * DAY_MS).toISOString(),
  };
};
