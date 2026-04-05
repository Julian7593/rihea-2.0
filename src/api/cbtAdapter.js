import {
  CBT_CARE_LEVEL,
  CBT_HOMEWORK_STATUS,
  CBT_HOMEWORK_TYPES,
} from "../utils/cbtProgram";

const normalizeText = (value, fallback = "") => (typeof value === "string" ? value.trim() : fallback);

const normalizeBoolean = (value) => Boolean(value);

const normalizeCareLevelCode = (value) => {
  if (value === CBT_CARE_LEVEL.LEVEL_2 || value === CBT_CARE_LEVEL.LEVEL_3) return value;
  return CBT_CARE_LEVEL.LEVEL_1;
};

const normalizeHomeworkStatus = (value) => {
  if (value === CBT_HOMEWORK_STATUS.IN_PROGRESS || value === CBT_HOMEWORK_STATUS.DONE) {
    return value;
  }
  return CBT_HOMEWORK_STATUS.TODO;
};

const normalizeHomeworkType = (value) => {
  const types = Object.values(CBT_HOMEWORK_TYPES);
  return types.includes(value) ? value : CBT_HOMEWORK_TYPES.THOUGHT_RECORD;
};

export const normalizeCbtHomeworkDto = (value) => {
  if (!value || typeof value !== "object") return null;
  return {
    id: normalizeText(value.id),
    weekNumber: Number.isFinite(Number(value.weekNumber)) ? Number(value.weekNumber) : 1,
    moduleId: normalizeText(value.moduleId),
    type: normalizeHomeworkType(value.type),
    title: normalizeText(value.title),
    prompt: normalizeText(value.prompt),
    helper: normalizeText(value.helper),
    status: normalizeHomeworkStatus(value.status),
    response: {
      summary: normalizeText(value?.response?.summary),
      action: normalizeText(value?.response?.action),
      reflection: normalizeText(value?.response?.reflection),
    },
    createdAt: normalizeText(value.createdAt),
    updatedAt: normalizeText(value.updatedAt),
  };
};

const normalizeModule = (value) => {
  if (!value || typeof value !== "object") return null;
  return {
    id: normalizeText(value.id),
    weekNumber: Number.isFinite(Number(value.weekNumber)) ? Number(value.weekNumber) : 1,
    version: normalizeText(value.version),
    pregnancyWeekRange: Array.isArray(value.pregnancyWeekRange) ? [...value.pregnancyWeekRange] : [4, 42],
    contraindications: Array.isArray(value.contraindications) ? [...value.contraindications] : [],
    escalationCopy: normalizeText(value.escalationCopy),
    title: normalizeText(value.title),
    summary: normalizeText(value.summary),
    priority: normalizeText(value.priority),
    microPractice: {
      title: normalizeText(value?.microPractice?.title),
      desc: normalizeText(value?.microPractice?.desc),
      durationLabel: normalizeText(value?.microPractice?.durationLabel),
    },
    partnerAction: {
      title: normalizeText(value?.partnerAction?.title),
      desc: normalizeText(value?.partnerAction?.desc),
    },
    homeworkTemplate: {
      type: normalizeHomeworkType(value?.homeworkTemplate?.type),
      title: normalizeText(value?.homeworkTemplate?.title),
      prompt: normalizeText(value?.homeworkTemplate?.prompt),
      helper: normalizeText(value?.homeworkTemplate?.helper),
    },
    homework: normalizeCbtHomeworkDto(value.homework),
    current: Boolean(value.current),
  };
};

export const normalizeCbtCareLevelDto = (value) => ({
  code: normalizeCareLevelCode(value?.code || value?.level),
  label: normalizeText(value?.label),
  desc: normalizeText(value?.desc),
  escalationCopy: normalizeText(value?.escalationCopy),
  reason: normalizeText(value?.reason),
  dynamicRisk: value?.dynamicRisk && typeof value.dynamicRisk === "object" ? { ...value.dynamicRisk } : null,
});

const normalizeCareTeamStatus = (value) => ({
  status: normalizeText(value?.status, "none"),
  referralRecommended: normalizeBoolean(value?.referralRecommended),
  nextFollowUpAt: normalizeText(value?.nextFollowUpAt),
  lastActionAt: normalizeText(value?.lastActionAt),
  channel: normalizeText(value?.channel),
  note: normalizeText(value?.note),
  slots: Array.isArray(value?.slots)
    ? value.slots.map((item) => ({
        id: normalizeText(item?.id),
        label: normalizeText(item?.label),
        dateTime: normalizeText(item?.dateTime),
      }))
    : [],
});

const normalizeCrisisState = (value) => ({
  active: normalizeBoolean(value?.active),
  level: normalizeText(value?.level, "none"),
  title: normalizeText(value?.title),
  desc: normalizeText(value?.desc),
  actions: Array.isArray(value?.actions)
    ? value.actions.map((item) => ({
        id: normalizeText(item?.id),
        label: normalizeText(item?.label),
      }))
    : [],
});

export function normalizeCbtOverviewDto(dto = {}) {
  return {
    version: normalizeText(dto?.version),
  careLevel: normalizeCbtCareLevelDto(dto?.careLevel),
    phase: normalizeText(dto?.phase, "intake"),
    todayTask: {
      id: normalizeText(dto?.todayTask?.id),
      title: normalizeText(dto?.todayTask?.title),
      desc: normalizeText(dto?.todayTask?.desc),
      meta: normalizeText(dto?.todayTask?.meta),
      status: normalizeText(dto?.todayTask?.status),
    },
    weeklyModule: normalizeModule(dto?.weeklyModule),
    reassessmentDueAt: normalizeText(dto?.reassessmentDueAt),
    reassessmentDueInDays: Number.isFinite(Number(dto?.reassessmentDueInDays)) ? Number(dto.reassessmentDueInDays) : null,
    partnerTaskSummary: {
      status: normalizeText(dto?.partnerTaskSummary?.status),
      title: normalizeText(dto?.partnerTaskSummary?.title),
      desc: normalizeText(dto?.partnerTaskSummary?.desc),
      helper: normalizeText(dto?.partnerTaskSummary?.helper),
    },
    careTeamStatus: normalizeCareTeamStatus(dto?.careTeamStatus),
    crisisState: normalizeCrisisState(dto?.crisisState),
    intakeCompleted: normalizeBoolean(dto?.intakeCompleted),
    intakeAssessment: dto?.intakeAssessment && typeof dto.intakeAssessment === "object"
      ? {
          epdsScore: Number.isFinite(Number(dto.intakeAssessment.epdsScore)) ? Number(dto.intakeAssessment.epdsScore) : 0,
          gad7Score: Number.isFinite(Number(dto.intakeAssessment.gad7Score)) ? Number(dto.intakeAssessment.gad7Score) : 0,
          isi7Score: Number.isFinite(Number(dto.intakeAssessment.isi7Score)) ? Number(dto.intakeAssessment.isi7Score) : 0,
          selfHarmRisk: normalizeBoolean(dto.intakeAssessment.selfHarmRisk),
          childbirthFear: {
            uncertainty: Number.isFinite(Number(dto?.intakeAssessment?.childbirthFear?.uncertainty))
              ? Number(dto.intakeAssessment.childbirthFear.uncertainty)
              : 0,
            painLossOfControl: Number.isFinite(Number(dto?.intakeAssessment?.childbirthFear?.painLossOfControl))
              ? Number(dto.intakeAssessment.childbirthFear.painLossOfControl)
              : 0,
          },
          completedAt: normalizeText(dto?.intakeAssessment?.completedAt),
          source: normalizeText(dto?.intakeAssessment?.source),
        }
      : null,
    progress: {
      completedModules: Number.isFinite(Number(dto?.progress?.completedModules)) ? Number(dto.progress.completedModules) : 0,
      totalModules: Number.isFinite(Number(dto?.progress?.totalModules)) ? Number(dto.progress.totalModules) : 0,
      completionRate: Number.isFinite(Number(dto?.progress?.completionRate)) ? Number(dto.progress.completionRate) : 0,
    },
    profile: {
      pregnancyWeek: normalizeText(dto?.profile?.pregnancyWeek),
      dueDate: normalizeText(dto?.profile?.dueDate),
    },
  };
}

export function normalizeCbtModuleDto(dto = {}) {
  return normalizeModule(dto);
}

export function normalizeCbtCareTeamDto(dto = {}) {
  return {
    careLevel: normalizeCbtCareLevelDto(dto?.careLevel),
    careTeamStatus: normalizeCareTeamStatus(dto?.careTeamStatus),
    crisisState: normalizeCrisisState(dto?.crisisState),
    referralHistory: Array.isArray(dto?.referralHistory)
      ? dto.referralHistory.map((item) => ({
          id: normalizeText(item?.id),
          channel: normalizeText(item?.channel),
          slotId: normalizeText(item?.slotId),
          slotLabel: normalizeText(item?.slotLabel),
          requestedAt: normalizeText(item?.requestedAt),
          note: normalizeText(item?.note),
        }))
      : [],
    summary: normalizeText(dto?.summary),
  };
}

export function normalizeCbtPartnerTasksDto(dto = {}) {
  return {
    careLevel: normalizeCbtCareLevelDto(dto?.careLevel),
    headline: normalizeText(dto?.headline),
    todayStatus: {
      title: normalizeText(dto?.todayStatus?.title),
      desc: normalizeText(dto?.todayStatus?.desc),
      status: normalizeText(dto?.todayStatus?.status),
    },
    tasks: Array.isArray(dto?.tasks)
      ? dto.tasks.map((item) => ({
          id: normalizeText(item?.id),
          title: normalizeText(item?.title),
          desc: normalizeText(item?.desc),
          helper: normalizeText(item?.helper),
        }))
      : [],
    clinicalReminder: normalizeText(dto?.clinicalReminder),
  };
}

export function buildCbtAssessmentRequest(payload = {}) {
  return {
    epdsScore: Number(payload?.epdsScore) || 0,
    gad7Score: Number(payload?.gad7Score) || 0,
    isi7Score: Number(payload?.isi7Score) || 0,
    selfHarmRisk: Boolean(payload?.selfHarmRisk),
    childbirthFear: {
      uncertainty: Number(payload?.childbirthFear?.uncertainty) || 0,
      painLossOfControl: Number(payload?.childbirthFear?.painLossOfControl) || 0,
    },
    source: normalizeText(payload?.source, "self_report"),
  };
}

export function buildCbtHomeworkRequest(payload = {}) {
  const request = {
    type: normalizeHomeworkType(payload?.type),
  };
  if ("weekNumber" in payload) {
    request.weekNumber = Number(payload.weekNumber) || 1;
  }
  if ("status" in payload) {
    request.status = normalizeHomeworkStatus(payload.status);
  }
  if (payload?.response && typeof payload.response === "object") {
    request.response = {
      summary: normalizeText(payload.response.summary),
      action: normalizeText(payload.response.action),
      reflection: normalizeText(payload.response.reflection),
    };
  }
  return request;
}

export function buildCbtHomeworkPatchRequest(payload = {}) {
  const request = {};
  if ("status" in payload) {
    request.status = normalizeHomeworkStatus(payload.status);
  }
  if (payload?.response && typeof payload.response === "object") {
    request.response = {
      summary: normalizeText(payload.response.summary),
      action: normalizeText(payload.response.action),
      reflection: normalizeText(payload.response.reflection),
    };
  }
  return request;
}

export function buildCbtReferralRequest(payload = {}) {
  return {
    channel: normalizeText(payload?.channel, "psychology"),
    slotId: normalizeText(payload?.slotId),
    note: normalizeText(payload?.note),
  };
}
