import {
  PARTNER_SHARING_LEVEL,
  PARTNER_SYNC_STATUS,
} from "../utils/partnerSync";

const normalizeText = (value, fallback = "") =>
  typeof value === "string" ? value.trim() : fallback;

const normalizeStatus = (value) => {
  if (value === PARTNER_SYNC_STATUS.PENDING || value === PARTNER_SYNC_STATUS.BOUND) {
    return value;
  }
  return PARTNER_SYNC_STATUS.DISABLED;
};

const normalizeSharingLevel = (value) => {
  if (value === PARTNER_SHARING_LEVEL.SUMMARY || value === PARTNER_SHARING_LEVEL.SUMMARY_PLUS) {
    return value;
  }
  return PARTNER_SHARING_LEVEL.OFF;
};

const normalizeAppointment = (value) => {
  if (!value || typeof value !== "object") return null;
  return {
    id: normalizeText(value.id, "appt-1"),
    title: normalizeText(value.title, "产检复查"),
    dateTime: normalizeText(value.dateTime),
    location: normalizeText(value.location),
  };
};

const normalizeTask = (value) => {
  if (!value || typeof value !== "object") return null;
  const id = normalizeText(value.id);
  const title = normalizeText(value.title);
  const desc = normalizeText(value.desc || value.description);
  if (!id || !title || !desc) return null;
  return {
    id,
    title,
    desc,
    meta: normalizeText(value.meta),
    done: Boolean(value.done),
    category: normalizeText(value.category),
  };
};

const normalizeNotice = (value) => {
  if (!value || typeof value !== "object") return null;
  const title = normalizeText(value.title);
  const desc = normalizeText(value.desc || value.description);
  if (!title || !desc) return null;
  return {
    level: normalizeText(value.level, "low"),
    title,
    desc,
  };
};

const normalizeRisk = (value) => {
  if (!value || typeof value !== "object") {
    return {
      level: "low",
      label: "Low Risk",
      recommendation: "",
      notice: null,
    };
  }

  return {
    level: normalizeText(value.level, "low"),
    label: normalizeText(value.label, "Low Risk"),
    recommendation: normalizeText(value.recommendation),
    notice: normalizeNotice(value.notice),
  };
};

const normalizeTodayStatus = (value) => {
  if (!value || typeof value !== "object") {
    return {
      title: "",
      label: "",
      desc: "",
      checkedIn: false,
    };
  }
  return {
    title: normalizeText(value.title),
    label: normalizeText(value.label),
    desc: normalizeText(value.desc || value.description),
    checkedIn: Boolean(value.checkedIn),
  };
};

const normalizeCommunication = (value) => ({
  say: normalizeText(value?.say),
  avoid: normalizeText(value?.avoid),
  ask: normalizeText(value?.ask),
});

const collectTasks = (preview = {}) => {
  const previewTasks = Array.isArray(preview?.tasks) ? preview.tasks.map(normalizeTask).filter(Boolean) : [];
  if (previewTasks.length > 0) return previewTasks;

  const mainTask = normalizeTask(preview?.mainTask);
  const backupTasks = Array.isArray(preview?.backupTasks) ? preview.backupTasks.map(normalizeTask).filter(Boolean) : [];
  return [mainTask, ...backupTasks].filter(Boolean);
};

export function normalizePartnerOverviewDto(dto = {}) {
  const status = normalizeStatus(dto?.status);
  const partner = dto?.partner && typeof dto.partner === "object" ? dto.partner : null;
  const invite = dto?.invite && typeof dto.invite === "object" ? dto.invite : null;
  const sharing = dto?.sharing && typeof dto.sharing === "object" ? dto.sharing : {};
  const preview = dto?.preview && typeof dto.preview === "object" ? dto.preview : {};
  const tasks = collectTasks(preview);
  const taskState = tasks.reduce(
    (acc, task) => ({
      ...acc,
      [task.id]: Boolean(task.done),
    }),
    dto?.taskState && typeof dto.taskState === "object" ? { ...dto.taskState } : {}
  );
  const nextAppointment = normalizeAppointment(dto?.nextAppointment);
  const risk = normalizeRisk(preview?.risk);
  const communication = normalizeCommunication(preview?.communication);

  return {
    pairId: normalizeText(dto?.pairId),
    status,
    partnerId: normalizeText(partner?.userId),
    partnerName: normalizeText(partner?.nickname),
    partnerRelation: normalizeText(partner?.relation || partner?.role),
    inviteCode: normalizeText(invite?.code),
    inviteExpiresAt: normalizeText(invite?.expiresAt),
    sharingLevel: normalizeSharingLevel(sharing?.level),
    riskAlerts: sharing?.riskAlertsEnabled !== false,
    appointmentSync: sharing?.appointmentSyncEnabled !== false,
    taskSync: sharing?.taskSyncEnabled !== false,
    taskState,
    nextAppointment,
    preview: {
      status,
      sharingLevel: normalizeSharingLevel(sharing?.level),
      partnerName: normalizeText(partner?.nickname),
      partnerRelation: normalizeText(partner?.relation || partner?.role),
      inviteCode: normalizeText(invite?.code),
      riskAlerts: sharing?.riskAlertsEnabled !== false,
      sharedScope: normalizeText(preview?.sharedScope),
      todayStatus: normalizeTodayStatus(preview?.todayStatus),
      pregnancyWeek: normalizeText(preview?.pregnancyWeek || dto?.owner?.pregnancyWeek),
      dueDate: normalizeText(preview?.dueDate || dto?.owner?.dueDate),
      risk,
      nextAppointment,
      tasks,
      mainTask: tasks[0] || null,
      backupTasks: tasks.slice(1),
      communication,
    },
  };
}

export function normalizePartnerHomeCardDto(dto = {}) {
  return {
    status: normalizeStatus(dto?.status),
    sharingLevel: normalizeSharingLevel(dto?.sharingLevel || dto?.sharing?.level),
    partnerName: normalizeText(dto?.partnerName || dto?.partner?.nickname),
    title: normalizeText(dto?.title),
    desc: normalizeText(dto?.desc || dto?.description),
    riskLabel: normalizeText(dto?.riskLabel || dto?.risk?.label),
    mainTask: normalizeTask(dto?.mainTask),
    riskNotice: normalizeNotice(dto?.riskNotice || dto?.risk?.notice),
    appointment: normalizeAppointment(dto?.appointment),
    ctaLabel: normalizeText(dto?.ctaLabel),
  };
}

export function buildPartnerBindingRequest(payload = {}) {
  return {
    partner: {
      nickname: normalizeText(payload?.partnerName),
      relation: normalizeText(payload?.partnerRelation),
    },
    sharing: {
      level: normalizeSharingLevel(payload?.sharingLevel),
    },
  };
}

export function buildPartnerSyncSettingsRequest(partial = {}) {
  const request = {};

  if ("sharingLevel" in partial || "riskAlerts" in partial) {
    request.sharing = {};
    if ("sharingLevel" in partial) {
      request.sharing.level = normalizeSharingLevel(partial.sharingLevel);
    }
    if ("riskAlerts" in partial) {
      request.sharing.riskAlertsEnabled = Boolean(partial.riskAlerts);
    }
  }

  return request;
}

export function buildPartnerTaskStateRequest(taskId, done) {
  return {
    taskId: normalizeText(taskId),
    done: Boolean(done),
  };
}
