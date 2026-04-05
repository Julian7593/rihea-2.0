import {
  defineSkill,
  SKILL_CAPABILITY_TYPE,
  SKILL_PERMISSION_LEVEL,
  SKILL_SIDE_EFFECT_LEVEL,
} from "../skills/platform/contracts.js";

function normalizeProfile(profile = {}) {
  const safeProfile = profile && typeof profile === "object" ? profile : {};
  return {
    name: typeof safeProfile.name === "string" ? safeProfile.name : "",
    pregnancyWeek: typeof safeProfile.pregnancyWeek === "string" ? safeProfile.pregnancyWeek : "",
    dueDate: typeof safeProfile.dueDate === "string" ? safeProfile.dueDate : "",
    riskLevel: typeof safeProfile.riskLevel === "string" ? safeProfile.riskLevel : "unknown",
    language: safeProfile.language === "en" ? "en" : "zh",
  };
}

function normalizeCheckIns(checkIns = []) {
  if (!Array.isArray(checkIns)) return [];
  return checkIns.slice(0, 50).map((item) => ({
    date: item?.date || "",
    mood: Number.isFinite(Number(item?.mood)) ? Number(item.mood) : null,
    tag: typeof item?.tag === "string" ? item.tag : "",
    note: typeof item?.note === "string" ? item.note : "",
    sleepHours: Number.isFinite(Number(item?.sleepHours)) ? Number(item.sleepHours) : null,
  }));
}

export function createContextTools() {
  return {
    getUserProfile: defineSkill({
      id: "get_user_profile",
      name: "get_user_profile",
      version: "1.0.0",
      category: "context",
      capability_type: SKILL_CAPABILITY_TYPE.RETRIEVAL,
      permission_level: SKILL_PERMISSION_LEVEL.READ,
      side_effect_level: SKILL_SIDE_EFFECT_LEVEL.NONE,
      input_schema: {
        type: "object",
        required: [],
        properties: {},
      },
      output_schema: {
        type: "object",
      },
      policy: {
        timeout_ms: 1000,
        idempotent: true,
        cacheable: false,
        model_callable: true,
        read_only_hint: true,
      },
      async handler(_input, ctx) {
        const profile = normalizeProfile(ctx?.clientContext?.profile || {});
        return {
          userId: ctx.userId,
          profile,
        };
      },
    }),
    getRecentCheckins: defineSkill({
      id: "get_recent_checkins",
      name: "get_recent_checkins",
      version: "1.0.0",
      category: "context",
      capability_type: SKILL_CAPABILITY_TYPE.RETRIEVAL,
      permission_level: SKILL_PERMISSION_LEVEL.READ,
      side_effect_level: SKILL_SIDE_EFFECT_LEVEL.NONE,
      input_schema: {
        type: "object",
        required: [],
        properties: {
          limit: { type: "number" },
        },
      },
      output_schema: {
        type: "object",
      },
      policy: {
        timeout_ms: 1000,
        idempotent: true,
        cacheable: false,
        model_callable: true,
        read_only_hint: true,
      },
      async handler(input, ctx) {
        const limit = Number.isFinite(Number(input?.limit)) ? Math.max(1, Number(input.limit)) : 7;
        const checkIns = normalizeCheckIns(ctx?.clientContext?.checkIns || []);
        return {
          userId: ctx.userId,
          count: Math.min(limit, checkIns.length),
          checkIns: checkIns.slice(0, limit),
        };
      },
    }),
    getPregnancyContext: defineSkill({
      id: "get_pregnancy_context",
      name: "get_pregnancy_context",
      version: "1.0.0",
      category: "context",
      capability_type: SKILL_CAPABILITY_TYPE.RETRIEVAL,
      permission_level: SKILL_PERMISSION_LEVEL.READ,
      side_effect_level: SKILL_SIDE_EFFECT_LEVEL.NONE,
      input_schema: {
        type: "object",
        required: [],
        properties: {},
      },
      output_schema: {
        type: "object",
      },
      policy: {
        timeout_ms: 1000,
        idempotent: true,
        cacheable: false,
        model_callable: true,
        read_only_hint: true,
      },
      async handler(_input, ctx) {
        const profile = normalizeProfile(ctx?.clientContext?.profile || {});
        return {
          userId: ctx.userId,
          pregnancyWeek: profile.pregnancyWeek || "unknown",
          dueDate: profile.dueDate || "unknown",
          riskLevel: profile.riskLevel || "unknown",
        };
      },
    }),
  };
}
