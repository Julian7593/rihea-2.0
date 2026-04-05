import {
  defineSkill,
  SKILL_CAPABILITY_TYPE,
  SKILL_PERMISSION_LEVEL,
  SKILL_SIDE_EFFECT_LEVEL,
} from "./platform/contracts.js";

function safeString(value, maxLength = 160) {
  return String(value || "").trim().slice(0, maxLength);
}

function buildDraftEffect(type, action, summary, payload = {}) {
  return {
    type,
    action,
    summary,
    payload,
  };
}

export function createReminderDraftSkill() {
  return defineSkill({
    id: "create_reminder_draft",
    name: "create_reminder_draft",
    version: "1.0.0",
    category: "action",
    capability_type: SKILL_CAPABILITY_TYPE.ACTION,
    permission_level: SKILL_PERMISSION_LEVEL.WRITE_DRAFT,
    side_effect_level: SKILL_SIDE_EFFECT_LEVEL.DRAFT_ONLY,
    input_schema: {
      type: "object",
      required: ["title"],
      properties: {
        title: { type: "string", minLength: 1 },
        schedule: { type: "string" },
        timezone: { type: "string" },
      },
    },
    output_schema: { type: "object" },
    async handler(input = {}) {
      const draft = {
        title: safeString(input.title, 120),
        schedule: safeString(input.schedule, 80) || "TBD",
        timezone: safeString(input.timezone, 40) || "Asia/Shanghai",
      };
      return {
        created: false,
        reminder_draft: draft,
        draft_effects: [buildDraftEffect("reminder", "create", `Draft reminder: ${draft.title}`, draft)],
      };
    },
  });
}

export function createSupportPlanDraftSkill() {
  return defineSkill({
    id: "generate_support_plan_draft",
    name: "generate_support_plan_draft",
    version: "1.0.0",
    category: "action",
    capability_type: SKILL_CAPABILITY_TYPE.ACTION,
    permission_level: SKILL_PERMISSION_LEVEL.WRITE_DRAFT,
    side_effect_level: SKILL_SIDE_EFFECT_LEVEL.DRAFT_ONLY,
    input_schema: {
      type: "object",
      required: [],
      properties: {
        topic: { type: "string" },
        goals: { type: "array" },
        evidence: { type: "array" },
      },
    },
    output_schema: { type: "object" },
    async handler(input = {}) {
      const topic = safeString(input?.topic, 80) || "general_support";
      const goals = Array.isArray(input?.goals) ? input.goals.map((item) => safeString(item, 80)).filter(Boolean) : [];
      const plan = {
        topic,
        goals: goals.length ? goals : ["stabilize", "observe", "follow_up"],
        next_steps: [
          "Clarify current priority and symptom pattern.",
          "Choose one low-risk action for the next 10-15 minutes.",
          "Review whether escalation or professional support is needed.",
        ],
        evidence_count: Array.isArray(input?.evidence) ? input.evidence.length : 0,
      };
      return {
        created: false,
        plan_draft: plan,
        draft_effects: [buildDraftEffect("plan", "create", `Draft support plan for ${topic}`, plan)],
      };
    },
  });
}

export function createReferralDraftSkill() {
  return defineSkill({
    id: "create_referral_draft",
    name: "create_referral_draft",
    version: "1.0.0",
    category: "action",
    capability_type: SKILL_CAPABILITY_TYPE.ACTION,
    permission_level: SKILL_PERMISSION_LEVEL.WRITE_DRAFT,
    side_effect_level: SKILL_SIDE_EFFECT_LEVEL.DRAFT_ONLY,
    input_schema: {
      type: "object",
      required: ["riskLevel"],
      properties: {
        riskLevel: { type: "string" },
        reasons: { type: "array" },
        targetSupport: { type: "string" },
      },
    },
    output_schema: { type: "object" },
    async handler(input = {}) {
      const draft = {
        risk_level: safeString(input?.riskLevel, 20),
        target_support: safeString(input?.targetSupport, 80) || "professional_assessment",
        reasons: Array.isArray(input?.reasons) ? input.reasons.map((item) => safeString(item, 120)).filter(Boolean) : [],
      };
      return {
        created: false,
        referral_draft: draft,
        draft_effects: [buildDraftEffect("referral", "create", `Draft referral for risk ${draft.risk_level}`, draft)],
      };
    },
  });
}

export function createRecordUserStateDraftSkill() {
  return defineSkill({
    id: "record_user_state_draft",
    name: "record_user_state_draft",
    version: "1.0.0",
    category: "action",
    capability_type: SKILL_CAPABILITY_TYPE.ACTION,
    permission_level: SKILL_PERMISSION_LEVEL.WRITE_DRAFT,
    side_effect_level: SKILL_SIDE_EFFECT_LEVEL.DRAFT_ONLY,
    input_schema: {
      type: "object",
      required: ["statePatch"],
      properties: {
        statePatch: { type: "object" },
        reason: { type: "string" },
      },
    },
    output_schema: { type: "object" },
    async handler(input = {}) {
      const patch = input?.statePatch && typeof input.statePatch === "object" ? input.statePatch : {};
      const draft = {
        state_patch: patch,
        reason: safeString(input?.reason, 160) || "agent_generated_draft",
      };
      return {
        created: false,
        state_update_draft: draft,
        draft_effects: [buildDraftEffect("user_state", "update", "Draft user state update", draft)],
      };
    },
  });
}
