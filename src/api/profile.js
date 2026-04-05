import { apiContracts } from "./contracts.js";
import { apiRequest, hasRemoteApi } from "./client.js";
import {
  buildPartnerHomeCard,
  buildPartnerOverview,
  PARTNER_SHARING_LEVEL,
  PARTNER_SYNC_STATUS,
} from "../utils/partnerSync";
<<<<<<< HEAD
import { appVersionInfo } from "../data/appMeta.js";
=======
>>>>>>> 356bd4d38d8b7f31d8a35a177e59ac40d7d6cf8a
import {
  buildPartnerBindingRequest,
  buildPartnerSyncSettingsRequest,
  buildPartnerTaskStateRequest,
  normalizePartnerHomeCardDto,
  normalizePartnerOverviewDto,
} from "./partnerSyncAdapter";

const wait = (ms = 220) => new Promise((resolve) => setTimeout(resolve, ms));
const PARTNER_SYNC_STORAGE_KEY = "rihea_partner_sync_v1";

const createMockAppointment = () => {
  const date = new Date();
  date.setDate(date.getDate() + 4);
  date.setHours(9, 30, 0, 0);
  return {
    id: "appt-1",
    title: "产检复查",
    dateTime: date.toISOString(),
    location: "产科门诊",
  };
};

const createDefaultPartnerSyncState = () => ({
  status: PARTNER_SYNC_STATUS.DISABLED,
  partnerName: "",
  partnerRelation: "Partner",
  inviteCode: "",
  sharingLevel: PARTNER_SHARING_LEVEL.OFF,
  riskAlerts: true,
  taskState: {},
  nextAppointment: createMockAppointment(),
});

const normalizePartnerSyncState = (value = {}) => ({
  status:
    value?.status === PARTNER_SYNC_STATUS.PENDING || value?.status === PARTNER_SYNC_STATUS.BOUND
      ? value.status
      : PARTNER_SYNC_STATUS.DISABLED,
  partnerName: typeof value?.partnerName === "string" ? value.partnerName.trim() : "",
  partnerRelation: typeof value?.partnerRelation === "string" ? value.partnerRelation.trim() || "Partner" : "Partner",
  inviteCode: typeof value?.inviteCode === "string" ? value.inviteCode.trim().toUpperCase() : "",
  sharingLevel:
    value?.sharingLevel === PARTNER_SHARING_LEVEL.SUMMARY || value?.sharingLevel === PARTNER_SHARING_LEVEL.SUMMARY_PLUS
      ? value.sharingLevel
      : PARTNER_SHARING_LEVEL.OFF,
  riskAlerts: value?.riskAlerts !== false,
  taskState: value?.taskState && typeof value.taskState === "object" ? { ...value.taskState } : {},
  nextAppointment:
    value?.nextAppointment && typeof value.nextAppointment === "object"
      ? {
          id: typeof value.nextAppointment.id === "string" ? value.nextAppointment.id : "appt-1",
          title: typeof value.nextAppointment.title === "string" ? value.nextAppointment.title : "产检复查",
          dateTime: typeof value.nextAppointment.dateTime === "string" ? value.nextAppointment.dateTime : createMockAppointment().dateTime,
          location: typeof value.nextAppointment.location === "string" ? value.nextAppointment.location : "产科门诊",
        }
      : createMockAppointment(),
});

const readStoredPartnerSyncState = () => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PARTNER_SYNC_STORAGE_KEY);
    if (!raw) return null;
    return normalizePartnerSyncState(JSON.parse(raw));
  } catch {
    return null;
  }
};

const persistPartnerSyncState = (state) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PARTNER_SYNC_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore storage errors
  }
};

const buildInviteCode = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let index = 0; index < 6; index += 1) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
};

const mockDb = {
  profile: {
    name: "Yiting",
    pregnancyWeek: "24+3",
    progress: 61,
    dueDate: "2026-06-08",
    datingMethod: "dueDate",
    lmpDate: "",
    cycleLength: 28,
    ivfTransferDate: "",
    embryoAgeDays: 5,
    riskLevel: "low",
    partnerSync: true,
    city: "Shenzhen",
    phone: "",
    // 饮食与健康相关字段
    height: 165,                          // 身高 cm
    prePregnancyWeight: 58,              // 孕前体重 kg
    currentWeight: 64,                   // 当前体重 kg
    targetWeightGain: 12,                // 目标增重 kg
    allergies: [],                       // 过敏食物
    dietaryPreferences: [],               // 饮食偏好 vegetarian/vegan/low_salt 等
    foodDislikes: [],                     // 不喜欢的食物
    // 运动相关字段
    exerciseHistory: {                    // 运动历史
      level: "beginner",                 // beginner/intermediate/advanced
      regularActivities: [],              // 日常运动项目
      frequency: "1-2 times/week",       // 运动频率
    },
    // 医疗禁忌
    medicalContraindications: {           // 医疗禁忌
      diet: [],                          // 饮食禁忌
      exercise: [],                      // 运动禁忌
    },
  },
  privacy: {
    privateMode: false,
    shareForResearch: false,
  },
  support: {
    slots: [
      { id: "slot-1", label: "Today 19:30 - Online counseling" },
      { id: "slot-2", label: "Tomorrow 10:00 - Breathing coach" },
      { id: "slot-3", label: "Friday 15:00 - Clinical follow-up" },
    ],
    faqs: [
      { id: "faq-1", title: "How to check in daily", desc: "Complete mood + sleep hours + trigger + one-line note." },
      { id: "faq-2", title: "How partner sync works", desc: "Enable partner sync in quick settings." },
      { id: "faq-3", title: "How to export report", desc: "Use export button in health records page." },
    ],
<<<<<<< HEAD
    version: appVersionInfo.currentVersion,
=======
    version: "v1.0.0",
>>>>>>> 356bd4d38d8b7f31d8a35a177e59ac40d7d6cf8a
    contacts: [
      { id: "ec-1", title: "Primary emergency contact", phone: "+86 138-0000-0000" },
      { id: "ec-2", title: "Hospital hotline", phone: "400-000-1120" },
    ],
  },
  partnerSync: createDefaultPartnerSyncState(),
  fetalMovements: {
    records: [],
  },
};

const syncProfilePartnerFlag = () => {
  mockDb.profile.partnerSync =
    mockDb.partnerSync.status !== PARTNER_SYNC_STATUS.DISABLED &&
    mockDb.partnerSync.sharingLevel !== PARTNER_SHARING_LEVEL.OFF;
};

const getPartnerSyncState = () => {
  const stored = readStoredPartnerSyncState();
  if (stored) {
    mockDb.partnerSync = stored;
  }
  syncProfilePartnerFlag();
  return mockDb.partnerSync;
};

const setPartnerSyncState = (partial) => {
  const nextState = normalizePartnerSyncState({
    ...getPartnerSyncState(),
    ...partial,
  });
  mockDb.partnerSync = nextState;
  syncProfilePartnerFlag();
  persistPartnerSyncState(nextState);
  return nextState;
};

export async function fetchProfileOverview(options = {}) {
  if (hasRemoteApi) {
    return apiRequest(apiContracts.profile.getOverview, options);
  }
  await wait();
  getPartnerSyncState();
  return { ...mockDb.profile };
}

export async function patchProfileName(name, options = {}) {
  if (hasRemoteApi) {
    return apiRequest(apiContracts.profile.updateName, {
      ...options,
      body: { name },
    });
  }
  await wait();
  mockDb.profile.name = name;
  return { name };
}

export async function patchProfileBasic(payload, options = {}) {
  if (hasRemoteApi) {
    return apiRequest(apiContracts.profile.updateBasic, {
      ...options,
      body: payload,
    });
  }
  await wait();
  mockDb.profile = {
    ...mockDb.profile,
    ...payload,
  };
  return {
    name: mockDb.profile.name,
    dueDate: mockDb.profile.dueDate,
    pregnancyWeek: mockDb.profile.pregnancyWeek,
    datingMethod: mockDb.profile.datingMethod,
    lmpDate: mockDb.profile.lmpDate,
    cycleLength: mockDb.profile.cycleLength,
    ivfTransferDate: mockDb.profile.ivfTransferDate,
    embryoAgeDays: mockDb.profile.embryoAgeDays,
    city: mockDb.profile.city || "",
    phone: mockDb.profile.phone || "",
  };
}

export async function fetchRecordSummary(checkIns, options = {}) {
  if (hasRemoteApi) {
    return apiRequest(apiContracts.records.getSummary, options);
  }
  await wait(160);
  const latest = checkIns[0];
  const inMonth = checkIns.filter((item) => item.date.slice(0, 7) === new Date().toISOString().slice(0, 7)).length;
  return {
    monthCompletions: inMonth,
    comfortDoneRate: Math.min(95, 58 + inMonth * 2),
    latestMoodIndex: latest ? latest.mood : null,
  };
}

const getMovementStatus = (todayCount) => {
  if (todayCount <= 0) return "unknown";
  if (todayCount < 3) return "need_attention";
  return "normal";
};

const buildFetalMovementSummary = () => {
  const todayKey = new Date().toISOString().slice(0, 10);
  const todayRecords = mockDb.fetalMovements.records.filter((item) => item.recordedAt.slice(0, 10) === todayKey);
  const latest = mockDb.fetalMovements.records[0] || null;
  return {
    todayCount: todayRecords.length,
    lastRecordedAt: latest ? latest.recordedAt : null,
    status: getMovementStatus(todayRecords.length),
  };
};

export async function fetchFetalMovementSummary(options = {}) {
  if (hasRemoteApi) {
    return apiRequest(apiContracts.records.getFetalMovementSummary, options);
  }
  await wait(140);
  return buildFetalMovementSummary();
}

export async function fetchFetalMovementRecords(days = 7, options = {}) {
  if (hasRemoteApi) {
    const queryDays = Number.isFinite(Number(days)) ? Number(days) : 7;
    return apiRequest(
      {
        ...apiContracts.records.getFetalMovementRecords,
        path: `${apiContracts.records.getFetalMovementRecords.path}?days=${encodeURIComponent(queryDays)}`,
      },
      options
    );
  }
  await wait(130);
  const countDays = Number.isFinite(Number(days)) ? Number(days) : 7;
  const threshold = new Date();
  threshold.setDate(threshold.getDate() - Math.max(0, countDays - 1));
  const thresholdTime = threshold.getTime();
  const records = mockDb.fetalMovements.records.filter((item) => {
    const t = new Date(item.recordedAt).getTime();
    return Number.isFinite(t) && t >= thresholdTime;
  });
  return { records };
}

export async function createFetalMovementRecord(payload = {}, options = {}) {
  if (hasRemoteApi) {
    return apiRequest(apiContracts.records.createFetalMovementRecord, {
      ...options,
      body: payload,
    });
  }
  await wait(160);
  const recordedAt = new Date().toISOString();
  const record = {
    id: `fm-${Date.now()}`,
    recordedAt,
    source: payload?.source || "home_card",
    weekLabel: payload?.weekLabel || "",
    note: payload?.note || "",
  };
  mockDb.fetalMovements.records = [record, ...mockDb.fetalMovements.records];
  const summary = buildFetalMovementSummary();
  return {
    id: record.id,
    recordedAt,
    todayCount: summary.todayCount,
  };
}

export async function patchFetalMovementRecord(id, payload = {}, options = {}) {
  if (hasRemoteApi) {
    const path = apiContracts.records.updateFetalMovementRecord.path.replace("{id}", encodeURIComponent(id));
    return apiRequest(
      {
        ...apiContracts.records.updateFetalMovementRecord,
        path,
      },
      {
        ...options,
        body: payload,
      }
    );
  }
  await wait(150);
  const index = mockDb.fetalMovements.records.findIndex((item) => item.id === id);
  if (index < 0) {
    throw new Error("Movement record not found.");
  }
  const note = typeof payload?.note === "string" ? payload.note : "";
  const updatedAt = new Date().toISOString();
  mockDb.fetalMovements.records[index] = {
    ...mockDb.fetalMovements.records[index],
    note,
    updatedAt,
  };
  return {
    id,
    note,
    updatedAt,
  };
}

export async function fetchPrivacySettings(options = {}) {
  if (hasRemoteApi) {
    return apiRequest(apiContracts.privacy.getSettings, options);
  }
  await wait();
  return { ...mockDb.privacy };
}

export async function fetchPartnerSyncOverview(context = {}, options = {}) {
  if (hasRemoteApi) {
    const lang = encodeURIComponent(context?.lang || "zh");
    const payload = await apiRequest(
      {
        ...apiContracts.partner.getOverview,
        path: `${apiContracts.partner.getOverview.path}?lang=${lang}`,
      },
      options
    );
    return normalizePartnerOverviewDto(payload);
  }
  await wait(180);
  const state = getPartnerSyncState();
  return {
    ...state,
    preview: buildPartnerOverview({
      lang: context?.lang || "zh",
      profile: context?.profile || mockDb.profile,
      checkIns: Array.isArray(context?.checkIns) ? context.checkIns : [],
      settings: state,
    }),
  };
}

export async function fetchPartnerHomeCard(context = {}, options = {}) {
  if (hasRemoteApi) {
    const lang = encodeURIComponent(context?.lang || "zh");
    const payload = await apiRequest(
      {
        ...apiContracts.partner.getHomeCard,
        path: `${apiContracts.partner.getHomeCard.path}?lang=${lang}`,
      },
      options
    );
    return normalizePartnerHomeCardDto(payload);
  }
  await wait(150);
  const state = getPartnerSyncState();
  return buildPartnerHomeCard({
    lang: context?.lang || "zh",
    profile: context?.profile || mockDb.profile,
    checkIns: Array.isArray(context?.checkIns) ? context.checkIns : [],
    settings: state,
  });
}

export async function createPartnerInvite(options = {}) {
  if (hasRemoteApi) {
    const payload = await apiRequest(apiContracts.partner.createInvite, {
      ...options,
      body: {},
    });
    return payload;
  }
  await wait(160);
  const current = getPartnerSyncState();
  return setPartnerSyncState({
    ...current,
    status: PARTNER_SYNC_STATUS.PENDING,
    inviteCode: buildInviteCode(),
    sharingLevel:
      current.sharingLevel === PARTNER_SHARING_LEVEL.OFF ? PARTNER_SHARING_LEVEL.SUMMARY : current.sharingLevel,
  });
}

export async function confirmPartnerBinding(payload = {}, options = {}) {
  if (hasRemoteApi) {
    return apiRequest(apiContracts.partner.confirmBinding, {
      ...options,
      body: buildPartnerBindingRequest(payload),
    });
  }
  await wait(180);
  return setPartnerSyncState({
    status: PARTNER_SYNC_STATUS.BOUND,
    partnerName: typeof payload?.partnerName === "string" ? payload.partnerName : "Alex",
    partnerRelation: typeof payload?.partnerRelation === "string" ? payload.partnerRelation : "Partner",
    sharingLevel:
      payload?.sharingLevel === PARTNER_SHARING_LEVEL.SUMMARY_PLUS
        ? PARTNER_SHARING_LEVEL.SUMMARY_PLUS
        : PARTNER_SHARING_LEVEL.SUMMARY,
  });
}

export async function patchPartnerSyncSettings(partial = {}, options = {}) {
  if (hasRemoteApi) {
    return apiRequest(apiContracts.partner.updateSettings, {
      ...options,
      body: buildPartnerSyncSettingsRequest(partial),
    });
  }
  await wait(160);
  const current = getPartnerSyncState();
  return setPartnerSyncState({
    ...current,
    ...partial,
    taskState:
      partial?.taskState && typeof partial.taskState === "object"
        ? {
            ...current.taskState,
            ...partial.taskState,
          }
        : current.taskState,
  });
}

export async function patchPartnerTaskState(taskId, done, options = {}) {
  if (hasRemoteApi) {
    return apiRequest(apiContracts.partner.updateTaskState, {
      ...options,
      body: buildPartnerTaskStateRequest(taskId, done),
    });
  }
  await wait(140);
  const current = getPartnerSyncState();
  return setPartnerSyncState({
    ...current,
    taskState: {
      ...current.taskState,
      [taskId]: Boolean(done),
    },
  });
}

export async function unbindPartnerSync(options = {}) {
  if (hasRemoteApi) {
    return apiRequest(apiContracts.partner.unbind, {
      ...options,
      body: {},
    });
  }
  await wait(180);
  return setPartnerSyncState(createDefaultPartnerSyncState());
}

export async function patchPrivacySettings(partial, options = {}) {
  if (hasRemoteApi) {
    return apiRequest(apiContracts.privacy.updateSettings, {
      ...options,
      body: partial,
    });
  }
  await wait(160);
  mockDb.privacy = {
    ...mockDb.privacy,
    ...partial,
  };
  return { ...mockDb.privacy };
}

export async function fetchCounselingSlots(options = {}) {
  if (hasRemoteApi) {
    return apiRequest(apiContracts.support.getCounselingSlots, options);
  }
  await wait();
  return { slots: [...mockDb.support.slots] };
}

export async function fetchHelpCenter(options = {}) {
  if (hasRemoteApi) {
    return apiRequest(apiContracts.support.getHelpCenter, options);
  }
  await wait();
  return {
    version: mockDb.support.version,
    faqs: [...mockDb.support.faqs],
  };
}

export async function fetchEmergencyContacts(options = {}) {
  if (hasRemoteApi) {
    return apiRequest(apiContracts.support.getEmergencyContacts, options);
  }
  await wait();
  return { contacts: [...mockDb.support.contacts] };
}
