import { apiContracts } from "./contracts";
import { apiRequest, hasRemoteApi } from "./client";
import {
  buildCbtAssessmentRequest,
  buildCbtHomeworkPatchRequest,
  buildCbtHomeworkRequest,
  buildCbtReferralRequest,
  normalizeCbtCareLevelDto,
  normalizeCbtCareTeamDto,
  normalizeCbtHomeworkDto,
  normalizeCbtModuleDto,
  normalizeCbtOverviewDto,
  normalizeCbtPartnerTasksDto,
} from "./cbtAdapter";
import {
  CBT_CARE_TEAM_STATUS,
  buildCbtPartnerTaskFeed,
  buildCbtProgramOverview,
  buildReassessmentState,
  createInitialCbtState,
  getModuleByWeek,
  updateHomeworkState,
  validateCbtAssessmentInput,
} from "../utils/cbtProgram";

const CBT_STORAGE_KEY = "rihea_cbt_program_v2";
const wait = (ms = 180) => new Promise((resolve) => setTimeout(resolve, ms));

const createDefaultLocalState = () => ({
  program: createInitialCbtState({
    lang: "zh",
    profile: {
      pregnancyWeek: "24+3",
      dueDate: "2026-06-08",
    },
    checkIns: [],
    now: new Date("2026-03-10T08:00:00.000Z"),
  }),
  referrals: [],
});

const readStoredState = () => {
  if (typeof window === "undefined") return createDefaultLocalState();
  try {
    const raw = window.localStorage.getItem(CBT_STORAGE_KEY);
    if (!raw) return createDefaultLocalState();
    const parsed = JSON.parse(raw);
    return {
      program: parsed?.program && typeof parsed.program === "object" ? parsed.program : createDefaultLocalState().program,
      referrals: Array.isArray(parsed?.referrals) ? parsed.referrals : [],
    };
  } catch {
    return createDefaultLocalState();
  }
};

const persistStoredState = (state) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CBT_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore storage errors
  }
};

const getLocalState = () => readStoredState();

const setLocalState = (state) => {
  persistStoredState(state);
  return state;
};

const buildLocalOverview = (context = {}, state = getLocalState()) =>
  buildCbtProgramOverview({
    lang: context?.lang || "zh",
    state: state.program,
    profile: context?.profile || {},
    checkIns: Array.isArray(context?.checkIns) ? context.checkIns : [],
  });

const buildLocalModule = (weekNumber, state = getLocalState()) => {
  const module = getModuleByWeek(state.program, weekNumber);
  if (!module) {
    throw new Error("CBT module not found.");
  }
  return normalizeCbtModuleDto({
    ...module,
    homework: Array.isArray(state.program.homework)
      ? state.program.homework.find((item) => item.moduleId === module.id) || null
      : null,
    current: Number(state.program.currentWeek) === Number(weekNumber),
  });
};

export async function fetchCbtOverview(context = {}, options = {}) {
  if (hasRemoteApi) {
    const lang = encodeURIComponent(context?.lang || "zh");
    const payload = await apiRequest(
      {
        ...apiContracts.cbt.getOverview,
        path: `${apiContracts.cbt.getOverview.path}?lang=${lang}`,
      },
      options
    );
    return normalizeCbtOverviewDto(payload);
  }

  await wait(120);
  return normalizeCbtOverviewDto(buildLocalOverview(context));
}

export async function submitCbtIntake(payload = {}, context = {}, options = {}) {
  if (hasRemoteApi) {
    const lang = encodeURIComponent(context?.lang || "zh");
    const result = await apiRequest(
      {
        ...apiContracts.cbt.submitIntake,
        path: `${apiContracts.cbt.submitIntake.path}?lang=${lang}`,
      },
      {
        ...options,
        body: buildCbtAssessmentRequest(payload),
      }
    );
    return {
      assessment: result?.assessment || null,
      careLevel: normalizeCbtCareLevelDto(result?.careLevel),
      weeklyPlan: Array.isArray(result?.weeklyPlan) ? result.weeklyPlan.map(normalizeCbtModuleDto) : [],
      overview: normalizeCbtOverviewDto(result?.overview),
    };
  }

  await wait(180);
  const validation = validateCbtAssessmentInput(payload);
  if (!validation.valid) {
    throw new Error(validation.errors[0]);
  }
  const currentTime = new Date();
  const state = getLocalState();
  const program = createInitialCbtState({
    lang: context?.lang || "zh",
    profile: context?.profile || {},
    checkIns: Array.isArray(context?.checkIns) ? context.checkIns : [],
    assessment: validation.assessment,
    now: currentTime,
    previous: state.program,
  });
  setLocalState({
    ...state,
    program,
  });
  return {
    assessment: program.intakeAssessment,
    careLevel: normalizeCbtCareLevelDto(program.careLevel),
    weeklyPlan: Array.isArray(program.modules) ? program.modules.map(normalizeCbtModuleDto) : [],
    overview: normalizeCbtOverviewDto(
      buildCbtProgramOverview({
        lang: context?.lang || "zh",
        state: program,
        profile: context?.profile || {},
        checkIns: Array.isArray(context?.checkIns) ? context.checkIns : [],
      })
    ),
  };
}

export async function submitCbtReassessment(payload = {}, context = {}, options = {}) {
  if (hasRemoteApi) {
    const lang = encodeURIComponent(context?.lang || "zh");
    const result = await apiRequest(
      {
        ...apiContracts.cbt.submitReassessment,
        path: `${apiContracts.cbt.submitReassessment.path}?lang=${lang}`,
      },
      {
        ...options,
        body: buildCbtAssessmentRequest(payload),
      }
    );
    return {
      assessment: result?.assessment || null,
      careLevel: normalizeCbtCareLevelDto(result?.careLevel),
      overview: normalizeCbtOverviewDto(result?.overview),
      transition: result?.transition || null,
    };
  }

  await wait(180);
  const validation = validateCbtAssessmentInput(payload);
  if (!validation.valid) {
    throw new Error(validation.errors[0]);
  }
  const state = getLocalState();
  const program = buildReassessmentState({
    lang: context?.lang || "zh",
    state: state.program,
    assessment: validation.assessment,
    checkIns: Array.isArray(context?.checkIns) ? context.checkIns : [],
    profile: context?.profile || {},
    now: new Date(),
  });
  setLocalState({
    ...state,
    program,
  });
  return {
    assessment: validation.assessment,
    careLevel: normalizeCbtCareLevelDto(program.careLevel),
    overview: normalizeCbtOverviewDto(
      buildCbtProgramOverview({
        lang: context?.lang || "zh",
        state: program,
        profile: context?.profile || {},
        checkIns: Array.isArray(context?.checkIns) ? context.checkIns : [],
      })
    ),
    transition: Array.isArray(program.reassessmentHistory)
      ? program.reassessmentHistory[program.reassessmentHistory.length - 1] || null
      : null,
  };
}

export async function fetchCbtModule(weekNumber, context = {}, options = {}) {
  if (hasRemoteApi) {
    const lang = encodeURIComponent(context?.lang || "zh");
    const path = apiContracts.cbt.getModule.path.replace("{week}", encodeURIComponent(String(weekNumber)));
    const payload = await apiRequest(
      {
        ...apiContracts.cbt.getModule,
        path: `${path}?lang=${lang}`,
      },
      options
    );
    return normalizeCbtModuleDto(payload);
  }

  await wait(110);
  return buildLocalModule(weekNumber, getLocalState());
}

export async function createCbtHomework(payload = {}, options = {}) {
  if (hasRemoteApi) {
    const payloadData = await apiRequest(apiContracts.cbt.createHomework, {
      ...options,
      body: buildCbtHomeworkRequest(payload),
    });
    return normalizeCbtHomeworkDto(payloadData);
  }

  await wait(140);
  const state = getLocalState();
  const weekNumber = Number(payload?.weekNumber) || Number(state.program.currentWeek) || 1;
  const module = getModuleByWeek(state.program, weekNumber);
  if (!module) {
    throw new Error("CBT module not found.");
  }
  const existing = Array.isArray(state.program.homework)
    ? state.program.homework.find((item) => item.moduleId === module.id) || null
    : null;
  if (existing) {
    const nextProgram = updateHomeworkState(
      state.program,
      existing.id,
      {
        status: payload?.status || existing.status,
        response: payload?.response,
      },
      new Date()
    );
    setLocalState({
      ...state,
      program: nextProgram,
    });
    return normalizeCbtHomeworkDto(nextProgram.homework.find((item) => item.id === existing.id));
  }
  throw new Error("CBT homework template missing.");
}

export async function patchCbtHomework(homeworkId, payload = {}, options = {}) {
  if (hasRemoteApi) {
    const path = apiContracts.cbt.updateHomework.path.replace("{id}", encodeURIComponent(homeworkId));
    const payloadData = await apiRequest(
      {
        ...apiContracts.cbt.updateHomework,
        path,
      },
      {
        ...options,
        body: buildCbtHomeworkPatchRequest(payload),
      }
    );
    return normalizeCbtHomeworkDto(payloadData);
  }

  await wait(140);
  const state = getLocalState();
  const current = Array.isArray(state.program.homework)
    ? state.program.homework.find((item) => item.id === homeworkId)
    : null;
  if (!current) {
    throw new Error("CBT homework not found.");
  }
  const nextProgram = updateHomeworkState(
    state.program,
    homeworkId,
    {
      status: payload?.status || current.status,
      response: payload?.response,
    },
    new Date()
  );
  setLocalState({
    ...state,
    program: nextProgram,
  });
  return normalizeCbtHomeworkDto(nextProgram.homework.find((item) => item.id === homeworkId));
}

export async function fetchCbtCareTeam(context = {}, options = {}) {
  if (hasRemoteApi) {
    const lang = encodeURIComponent(context?.lang || "zh");
    const payload = await apiRequest(
      {
        ...apiContracts.cbt.getCareTeam,
        path: `${apiContracts.cbt.getCareTeam.path}?lang=${lang}`,
      },
      options
    );
    return normalizeCbtCareTeamDto(payload);
  }

  await wait(120);
  const state = getLocalState();
  return normalizeCbtCareTeamDto({
    careLevel: state.program.careLevel,
    careTeamStatus: state.program.careTeamStatus,
    crisisState: state.program.crisisState,
    referralHistory: state.referrals || [],
    summary: "local mock",
  });
}

export async function createCbtReferral(payload = {}, context = {}, options = {}) {
  if (hasRemoteApi) {
    const lang = encodeURIComponent(context?.lang || "zh");
    const response = await apiRequest(
      {
        ...apiContracts.cbt.createReferral,
        path: `${apiContracts.cbt.createReferral.path}?lang=${lang}`,
      },
      {
        ...options,
        body: buildCbtReferralRequest(payload),
      }
    );
    return {
      referral: response?.referral || null,
      careTeamStatus: normalizeCbtCareTeamDto({
        careTeamStatus: response?.careTeamStatus,
      }).careTeamStatus,
      summary: response?.summary || "",
    };
  }

  await wait(150);
  const state = getLocalState();
  const slotId = payload?.slotId || "";
  const slot = Array.isArray(state.program.careTeamStatus?.slots)
    ? state.program.careTeamStatus.slots.find((item) => item.id === slotId) || null
    : null;
  const referral = {
    id: `ref_local_${Date.now()}`,
    channel: payload?.channel || "psychology",
    slotId: slot?.id || "",
    slotLabel: slot?.label || "",
    requestedAt: new Date().toISOString(),
    note: payload?.note || "",
  };
  const nextState = {
    ...state,
    referrals: [...(Array.isArray(state.referrals) ? state.referrals : []), referral],
    program: {
      ...state.program,
      careTeamStatus: {
        ...state.program.careTeamStatus,
        status: slot ? CBT_CARE_TEAM_STATUS.SCHEDULED : CBT_CARE_TEAM_STATUS.REFERRED,
        referralRecommended: true,
        channel: referral.channel,
        note: referral.note,
        lastActionAt: referral.requestedAt,
        nextFollowUpAt: slot?.dateTime || state.program.careTeamStatus?.nextFollowUpAt || "",
      },
    },
  };
  setLocalState(nextState);
  return {
    referral,
    careTeamStatus: normalizeCbtCareTeamDto({ careTeamStatus: nextState.program.careTeamStatus }).careTeamStatus,
    summary: context?.lang === "en" ? "Referral saved." : "转介已记录。",
  };
}

export async function fetchCbtPartnerTasks(context = {}, options = {}) {
  if (hasRemoteApi) {
    const lang = encodeURIComponent(context?.lang || "zh");
    const payload = await apiRequest(
      {
        ...apiContracts.cbt.getPartnerTasks,
        path: `${apiContracts.cbt.getPartnerTasks.path}?lang=${lang}`,
      },
      options
    );
    return normalizeCbtPartnerTasksDto(payload);
  }

  await wait(110);
  const state = getLocalState();
  return normalizeCbtPartnerTasksDto(
    buildCbtPartnerTaskFeed({
      lang: context?.lang || "zh",
      state: state.program,
      profile: context?.profile || {},
      checkIns: Array.isArray(context?.checkIns) ? context.checkIns : [],
    })
  );
}

