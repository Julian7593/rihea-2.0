import { randomUUID } from "node:crypto";
import { toDateKey } from "../../src/utils/checkin.js";
import {
  CBT_CARE_TEAM_STATUS,
  CBT_HOMEWORK_STATUS,
  CBT_HOMEWORK_TYPES,
  buildCbtPartnerTaskFeed,
  buildCbtProgramOverview,
  buildReassessmentState,
  createInitialCbtState,
  getCurrentHomework,
  getCurrentModule,
  getModuleByWeek,
  updateHomeworkState,
  validateCbtAssessmentInput,
} from "../../src/utils/cbtProgram.js";

const DAY_MS = 24 * 60 * 60 * 1000;

const addDays = (date, offset) => {
  const next = new Date(date);
  next.setDate(next.getDate() + offset);
  return next;
};

const normalizeLang = (lang) => (lang === "en" ? "en" : "zh");

const normalizeText = (value, fallback = "") => (typeof value === "string" ? value.trim() : fallback);

const assertHomeworkType = (value) => {
  const types = Object.values(CBT_HOMEWORK_TYPES);
  if (types.includes(value)) return value;
  const error = new Error("Invalid homework type.");
  error.code = "CBT_INVALID_HOMEWORK_TYPE";
  error.statusCode = 400;
  throw error;
};

const assertHomeworkStatus = (value) => {
  if (
    value === undefined ||
    value === CBT_HOMEWORK_STATUS.TODO ||
    value === CBT_HOMEWORK_STATUS.IN_PROGRESS ||
    value === CBT_HOMEWORK_STATUS.DONE
  ) {
    return value;
  }
  const error = new Error("Invalid homework status.");
  error.code = "CBT_INVALID_HOMEWORK_STATUS";
  error.statusCode = 400;
  throw error;
};

const createSeedCheckIns = (referenceDate = new Date()) => [
  {
    date: toDateKey(referenceDate),
    mood: 1,
    tag: "睡眠不佳",
    note: "昨晚反复醒来，今天很紧绷",
    sleepHours: 4.5,
    updatedAt: referenceDate.getTime(),
  },
  {
    date: toDateKey(addDays(referenceDate, -1)),
    mood: 1,
    tag: "产检焦虑",
    note: "总担心分娩和检查结果",
    sleepHours: 5,
    updatedAt: addDays(referenceDate, -1).getTime(),
  },
  {
    date: toDateKey(addDays(referenceDate, -2)),
    mood: 2,
    tag: "家人支持",
    note: "今天还可以，但心里有点慌",
    sleepHours: 5.5,
    updatedAt: addDays(referenceDate, -2).getTime(),
  },
];

export function createInitialCbtServiceState(referenceDate = new Date()) {
  const profile = {
    userId: "owner_001",
    nickname: "Yiting",
    pregnancyWeek: "24+3",
    dueDate: "2026-06-08",
    checkIns: createSeedCheckIns(referenceDate),
  };

  return {
    owner: profile,
    program: createInitialCbtState({
      lang: "zh",
      profile,
      checkIns: profile.checkIns,
      now: referenceDate,
    }),
    referrals: [],
  };
}

const buildOverviewPayload = (state, lang) =>
  buildCbtProgramOverview({
    lang,
    state: state.program,
    profile: {
      pregnancyWeek: state.owner.pregnancyWeek,
      dueDate: state.owner.dueDate,
    },
    checkIns: state.owner.checkIns || [],
  });

const buildModulePayload = (state, weekNumber, lang) => {
  const module = getModuleByWeek(state.program, weekNumber);
  if (!module) {
    const error = new Error("CBT module not found.");
    error.code = "CBT_MODULE_NOT_FOUND";
    error.statusCode = 404;
    throw error;
  }

  const homework = Array.isArray(state.program.homework)
    ? state.program.homework.find((item) => item.moduleId === module.id) || null
    : null;

  return {
    ...module,
    homework,
    current: Number(state.program.currentWeek) === Number(weekNumber),
  };
};

const buildCareTeamPayload = (state, lang) => ({
  careLevel: state.program.careLevel,
  careTeamStatus: state.program.careTeamStatus,
  crisisState: state.program.crisisState,
  referralHistory: Array.isArray(state.referrals) ? [...state.referrals] : [],
  summary:
    lang === "en"
      ? "Clinical coordination covers referral intent, follow-up timing, and crisis routing."
      : "临床协作当前覆盖转介意向、随访安排和危机转介。",
});

export function createCbtService({ store, now = () => new Date() }) {
  const readState = async () => store.read();
  const writeState = async (nextState) => store.write(nextState);

  return {
    async getOverview({ lang = "zh" } = {}) {
      const state = await readState();
      return buildOverviewPayload(state, normalizeLang(lang));
    },

    async submitIntake(payload = {}, { lang = "zh" } = {}) {
      const validation = validateCbtAssessmentInput(payload);
      if (!validation.valid) {
        const error = new Error(validation.errors[0]);
        error.code = "CBT_INVALID_ASSESSMENT";
        error.statusCode = 400;
        throw error;
      }

      const state = await readState();
      const currentTime = now();
      const nextProgram = createInitialCbtState({
        lang: normalizeLang(lang),
        profile: {
          pregnancyWeek: state.owner.pregnancyWeek,
          dueDate: state.owner.dueDate,
        },
        checkIns: state.owner.checkIns || [],
        assessment: validation.assessment,
        now: currentTime,
        previous: state.program,
      });

      const nextState = {
        ...state,
        program: nextProgram,
      };
      await writeState(nextState);

      return {
        assessment: nextProgram.intakeAssessment,
        careLevel: nextProgram.careLevel,
        weeklyPlan: nextProgram.modules,
        overview: buildOverviewPayload(nextState, normalizeLang(lang)),
      };
    },

    async submitReassessment(payload = {}, { lang = "zh" } = {}) {
      const validation = validateCbtAssessmentInput(payload);
      if (!validation.valid) {
        const error = new Error(validation.errors[0]);
        error.code = "CBT_INVALID_ASSESSMENT";
        error.statusCode = 400;
        throw error;
      }

      const state = await readState();
      const currentTime = now();
      const nextProgram = buildReassessmentState({
        lang: normalizeLang(lang),
        state: state.program,
        assessment: validation.assessment,
        checkIns: state.owner.checkIns || [],
        profile: {
          pregnancyWeek: state.owner.pregnancyWeek,
          dueDate: state.owner.dueDate,
        },
        now: currentTime,
      });
      const nextState = {
        ...state,
        program: nextProgram,
      };
      await writeState(nextState);

      return {
        assessment: validation.assessment,
        careLevel: nextProgram.careLevel,
        overview: buildOverviewPayload(nextState, normalizeLang(lang)),
        transition: nextProgram.reassessmentHistory[nextProgram.reassessmentHistory.length - 1] || null,
      };
    },

    async getModule(weekNumber, { lang = "zh" } = {}) {
      const state = await readState();
      return buildModulePayload(state, Number(weekNumber), normalizeLang(lang));
    },

    async createHomework(payload = {}, { lang = "zh" } = {}) {
      const state = await readState();
      const safeWeek = Number.isFinite(Number(payload?.weekNumber)) ? Number(payload.weekNumber) : state.program.currentWeek || 1;
      const module = getModuleByWeek(state.program, safeWeek) || getCurrentModule(state.program);
      if (!module) {
        const error = new Error("CBT module not found.");
        error.code = "CBT_MODULE_NOT_FOUND";
        error.statusCode = 404;
        throw error;
      }

      const type = assertHomeworkType(payload?.type || module.homeworkTemplate?.type || getCurrentHomework(state.program)?.type);
      const existing = Array.isArray(state.program.homework)
        ? state.program.homework.find((item) => item.moduleId === module.id || item.type === type) || null
        : null;

      if (existing) {
        const updatedState = updateHomeworkState(
          state.program,
          existing.id,
          {
            status: payload?.status || existing.status,
            response: payload?.response,
          },
          now()
        );
        const nextState = { ...state, program: updatedState };
        await writeState(nextState);
        return nextState.program.homework.find((item) => item.id === existing.id) || existing;
      }

      const currentTime = now().toISOString();
      const entry = {
        id: `hw_custom_${randomUUID()}`,
        weekNumber: safeWeek,
        moduleId: module.id,
        type,
        title: module.homeworkTemplate.title,
        prompt: module.homeworkTemplate.prompt,
        helper: module.homeworkTemplate.helper,
        status: payload?.status || CBT_HOMEWORK_STATUS.IN_PROGRESS,
        response: {
          summary: normalizeText(payload?.response?.summary),
          action: normalizeText(payload?.response?.action),
          reflection: normalizeText(payload?.response?.reflection),
        },
        createdAt: currentTime,
        updatedAt: currentTime,
      };

      const nextState = {
        ...state,
        program: {
          ...state.program,
          homework: [...(Array.isArray(state.program.homework) ? state.program.homework : []), entry],
          lastUpdatedAt: currentTime,
        },
      };
      await writeState(nextState);
      return entry;
    },

    async updateHomework(homeworkId, payload = {}) {
      assertHomeworkStatus(payload?.status);
      const state = await readState();
      const current = Array.isArray(state.program.homework)
        ? state.program.homework.find((item) => item.id === homeworkId)
        : null;
      if (!current) {
        const error = new Error("CBT homework not found.");
        error.code = "CBT_HOMEWORK_NOT_FOUND";
        error.statusCode = 404;
        throw error;
      }

      const nextProgram = updateHomeworkState(
        state.program,
        homeworkId,
        {
          status: payload?.status || current.status,
          response: payload?.response,
        },
        now()
      );
      const nextState = {
        ...state,
        program: nextProgram,
      };
      await writeState(nextState);

      return nextState.program.homework.find((item) => item.id === homeworkId) || current;
    },

    async getCareTeam({ lang = "zh" } = {}) {
      const state = await readState();
      return buildCareTeamPayload(state, normalizeLang(lang));
    },

    async createReferral(payload = {}, { lang = "zh" } = {}) {
      const state = await readState();
      const currentTime = now();
      const channel = normalizeText(payload?.channel, "psychology");
      const slotId = normalizeText(payload?.slotId);
      const selectedSlot =
        Array.isArray(state.program.careTeamStatus?.slots) && slotId
          ? state.program.careTeamStatus.slots.find((item) => item.id === slotId) || null
          : null;

      const referral = {
        id: `ref_${randomUUID()}`,
        channel,
        slotId: selectedSlot?.id || "",
        slotLabel: selectedSlot?.label || "",
        requestedAt: currentTime.toISOString(),
        note: normalizeText(payload?.note),
      };

      const nextState = {
        ...state,
        referrals: [...(Array.isArray(state.referrals) ? state.referrals : []), referral],
        program: {
          ...state.program,
          careTeamStatus: {
            ...state.program.careTeamStatus,
            status: selectedSlot ? CBT_CARE_TEAM_STATUS.SCHEDULED : CBT_CARE_TEAM_STATUS.REFERRED,
            referralRecommended: true,
            channel,
            note: referral.note,
            lastActionAt: currentTime.toISOString(),
            nextFollowUpAt:
              selectedSlot?.dateTime || new Date(currentTime.getTime() + 7 * DAY_MS).toISOString(),
          },
          lastUpdatedAt: currentTime.toISOString(),
        },
      };
      await writeState(nextState);

      return {
        referral,
        careTeamStatus: nextState.program.careTeamStatus,
        summary:
          normalizeLang(lang) === "en"
            ? "Referral intent recorded."
            : "已记录转介/预约意向。",
      };
    },

    async getPartnerTasks({ lang = "zh" } = {}) {
      const state = await readState();
      return buildCbtPartnerTaskFeed({
        lang: normalizeLang(lang),
        state: state.program,
        profile: {
          pregnancyWeek: state.owner.pregnancyWeek,
          dueDate: state.owner.dueDate,
        },
        checkIns: state.owner.checkIns || [],
      });
    },
  };
}

