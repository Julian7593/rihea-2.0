import { randomUUID } from "node:crypto";
import { buildPartnerHomeCard, buildPartnerOverview, PARTNER_SHARING_LEVEL, PARTNER_SYNC_STATUS } from "../../src/utils/partnerSync.js";
import { toDateKey } from "../../src/utils/checkin.js";

const DAY_MS = 24 * 60 * 60 * 1000;

const addDays = (date, offset) => {
  const next = new Date(date);
  next.setDate(next.getDate() + offset);
  return next;
};

const normalizeLang = (lang) => (lang === "en" ? "en" : "zh");

const normalizeText = (value, fallback = "") => (typeof value === "string" ? value.trim() : fallback);

const normalizeSharingLevel = (value, fallback = PARTNER_SHARING_LEVEL.OFF) => {
  if (value === PARTNER_SHARING_LEVEL.SUMMARY || value === PARTNER_SHARING_LEVEL.SUMMARY_PLUS) {
    return value;
  }
  if (value === PARTNER_SHARING_LEVEL.OFF) {
    return value;
  }
  return fallback;
};

const createInviteCode = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let index = 0; index < 6; index += 1) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
};

const createSeedCheckIns = (referenceDate = new Date()) => [
  {
    date: toDateKey(referenceDate),
    mood: 2,
    tag: "家人支持",
    note: "今晚想早点休息",
    sleepHours: 5.5,
    sleepSource: "manual",
    updatedAt: referenceDate.getTime(),
  },
  {
    date: toDateKey(addDays(referenceDate, -1)),
    mood: 1,
    tag: "产检焦虑",
    note: "明天有点担心检查结果",
    sleepHours: 5,
    sleepSource: "manual",
    updatedAt: addDays(referenceDate, -1).getTime(),
  },
  {
    date: toDateKey(addDays(referenceDate, -2)),
    mood: 2,
    tag: "睡眠不佳",
    note: "昨晚醒了好几次",
    sleepHours: 5,
    sleepSource: "manual",
    updatedAt: addDays(referenceDate, -2).getTime(),
  },
];

export function createInitialPartnerSyncState(referenceDate = new Date()) {
  const appointmentDate = addDays(referenceDate, 4);
  appointmentDate.setHours(9, 30, 0, 0);

  return {
    pairId: null,
    status: PARTNER_SYNC_STATUS.DISABLED,
    owner: {
      userId: "owner_001",
      nickname: "Yiting",
      pregnancyWeek: "24+3",
      dueDate: "2026-06-08",
      checkIns: createSeedCheckIns(referenceDate),
    },
    partner: null,
    invite: null,
    sharing: {
      level: PARTNER_SHARING_LEVEL.OFF,
      riskAlertsEnabled: true,
      appointmentSyncEnabled: true,
      taskSyncEnabled: true,
    },
    nextAppointment: {
      id: "appt_001",
      title: "产检复查",
      dateTime: appointmentDate.toISOString(),
      location: "产科门诊",
    },
    taskState: {},
  };
}

function buildPreviewContext(state) {
  return {
    status: state.status,
    partnerName: state.partner?.nickname || "",
    partnerRelation: state.partner?.relation || "",
    inviteCode: state.invite?.code || "",
    sharingLevel: state.sharing.level,
    riskAlerts: state.sharing.riskAlertsEnabled,
    nextAppointment: state.nextAppointment,
    taskState: state.taskState || {},
  };
}

function buildProfileContext(state) {
  return {
    name: state.owner.nickname,
    pregnancyWeek: state.owner.pregnancyWeek,
    dueDate: state.owner.dueDate,
  };
}

function buildOverviewPreview(state, lang) {
  return buildPartnerOverview({
    lang,
    profile: buildProfileContext(state),
    checkIns: state.owner.checkIns || [],
    settings: buildPreviewContext(state),
  });
}

function buildHomeCardView(state, lang) {
  return buildPartnerHomeCard({
    lang,
    profile: buildProfileContext(state),
    checkIns: state.owner.checkIns || [],
    settings: buildPreviewContext(state),
  });
}

function mapOverviewDto(state, lang) {
  const preview = buildOverviewPreview(state, lang);

  return {
    pairId: state.pairId,
    status: state.status,
    owner: {
      userId: state.owner.userId,
      nickname: state.owner.nickname,
      pregnancyWeek: state.owner.pregnancyWeek,
      dueDate: state.owner.dueDate,
    },
    partner: state.partner,
    invite: state.invite,
    sharing: state.sharing,
    nextAppointment: state.nextAppointment,
    preview: {
      sharedScope: preview.sharedScope,
      todayStatus: preview.todayStatus,
      risk: {
        level: preview.risk.level,
        label: preview.risk.label,
        recommendation: preview.risk.recommendation,
        notice: preview.risk.notice || null,
      },
      tasks: preview.tasks,
      communication: preview.communication,
    },
  };
}

function mapHomeCardDto(state, lang) {
  const card = buildHomeCardView(state, lang);

  return {
    status: card.status,
    sharing: {
      level: card.sharingLevel,
    },
    partner: state.partner
      ? {
          userId: state.partner.userId,
          nickname: state.partner.nickname,
          relation: state.partner.relation,
        }
      : null,
    title: card.title,
    desc: card.desc,
    risk: {
      level: card.riskNotice?.level || "low",
      label: card.riskLabel,
      notice: card.riskNotice,
    },
    mainTask: card.mainTask,
    appointment: card.appointment,
    ctaLabel: card.ctaLabel,
  };
}

function ensureTaskExists(state, taskId, lang) {
  const preview = buildOverviewPreview(state, lang);
  const task = preview.tasks.find((item) => item.id === taskId);
  if (!task) {
    const error = new Error("Partner task not found");
    error.code = "PARTNER_TASK_NOT_FOUND";
    error.statusCode = 404;
    throw error;
  }
  return task;
}

function assertInviteUsable(state, now) {
  if (!state.invite?.code) return;
  if (state.invite.status === "expired") {
    const error = new Error("Invite code has expired");
    error.code = "PARTNER_INVITE_EXPIRED";
    error.statusCode = 410;
    throw error;
  }
  if (state.invite.expiresAt && new Date(state.invite.expiresAt).getTime() < now.getTime()) {
    const error = new Error("Invite code has expired");
    error.code = "PARTNER_INVITE_EXPIRED";
    error.statusCode = 410;
    throw error;
  }
}

export function createPartnerSyncService({ store, now = () => new Date() }) {
  const readState = async () => store.read();
  const writeState = async (state) => store.write(state);

  return {
    async getOverview({ lang = "zh" } = {}) {
      const state = await readState();
      return mapOverviewDto(state, normalizeLang(lang));
    },

    async getHomeCard({ lang = "zh" } = {}) {
      const state = await readState();
      return mapHomeCardDto(state, normalizeLang(lang));
    },

    async createInvite() {
      const state = await readState();
      const nextState = {
        ...state,
        pairId: state.pairId || `pair_${randomUUID()}`,
        status: state.status === PARTNER_SYNC_STATUS.BOUND ? PARTNER_SYNC_STATUS.BOUND : PARTNER_SYNC_STATUS.PENDING,
        invite: {
          code: createInviteCode(),
          expiresAt: new Date(now().getTime() + 7 * DAY_MS).toISOString(),
          status: "pending",
        },
        sharing: {
          ...state.sharing,
          level:
            state.sharing.level === PARTNER_SHARING_LEVEL.OFF
              ? PARTNER_SHARING_LEVEL.SUMMARY
              : state.sharing.level,
        },
      };

      await writeState(nextState);

      return {
        pairId: nextState.pairId,
        status: nextState.status,
        invite: nextState.invite,
        sharing: nextState.sharing,
      };
    },

    async bindPartner(payload = {}) {
      const state = await readState();
      assertInviteUsable(state, now());

      const nextSharingLevel = normalizeSharingLevel(
        payload?.sharing?.level,
        state.sharing.level === PARTNER_SHARING_LEVEL.OFF ? PARTNER_SHARING_LEVEL.SUMMARY : state.sharing.level
      );

      const nextState = {
        ...state,
        pairId: state.pairId || `pair_${randomUUID()}`,
        status: PARTNER_SYNC_STATUS.BOUND,
        partner: {
          userId: state.partner?.userId || `partner_${randomUUID()}`,
          nickname: normalizeText(payload?.partner?.nickname, state.partner?.nickname || "Alex"),
          relation: normalizeText(payload?.partner?.relation, state.partner?.relation || "伴侣"),
          joinedAt: state.partner?.joinedAt || now().toISOString(),
        },
        invite: state.invite
          ? {
              ...state.invite,
              status: "used",
            }
          : null,
        sharing: {
          ...state.sharing,
          level: nextSharingLevel,
        },
      };

      await writeState(nextState);

      return {
        pairId: nextState.pairId,
        status: nextState.status,
        partner: nextState.partner,
        sharing: nextState.sharing,
      };
    },

    async updateSettings(payload = {}) {
      const state = await readState();
      const nextState = {
        ...state,
        sharing: {
          ...state.sharing,
          level: normalizeSharingLevel(payload?.sharing?.level, state.sharing.level),
          riskAlertsEnabled:
            typeof payload?.sharing?.riskAlertsEnabled === "boolean"
              ? payload.sharing.riskAlertsEnabled
              : state.sharing.riskAlertsEnabled,
        },
      };

      await writeState(nextState);

      return {
        pairId: nextState.pairId,
        status: nextState.status,
        sharing: nextState.sharing,
      };
    },

    async updateTaskState(taskId, done, { lang = "zh" } = {}) {
      const state = await readState();

      if (state.status === PARTNER_SYNC_STATUS.DISABLED) {
        const error = new Error("Partner sync is not active");
        error.code = "PARTNER_INVALID_STATUS";
        error.statusCode = 409;
        throw error;
      }

      ensureTaskExists(state, taskId, normalizeLang(lang));

      const nextState = {
        ...state,
        taskState: {
          ...state.taskState,
          [taskId]: Boolean(done),
        },
      };

      await writeState(nextState);

      return {
        task: {
          id: taskId,
          done: Boolean(done),
          updatedAt: now().toISOString(),
        },
      };
    },

    async unbind() {
      const state = await readState();
      const nextState = {
        ...state,
        pairId: null,
        status: PARTNER_SYNC_STATUS.DISABLED,
        partner: null,
        invite: null,
        sharing: {
          ...state.sharing,
          level: PARTNER_SHARING_LEVEL.OFF,
        },
        taskState: {},
      };

      await writeState(nextState);

      return {
        pairId: null,
        status: nextState.status,
      };
    },
  };
}
