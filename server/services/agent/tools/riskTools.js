import { assessEmotionalRisk } from "../../../../src/utils/riskAssessment.js";
import { detectDangerSignalsInText, getEmergencyContacts } from "../../../../src/utils/dangerSignalDetector.js";
import { AGENT_RISK_LEVEL } from "../constants.js";
import {
  defineSkill,
  SKILL_CAPABILITY_TYPE,
  SKILL_PERMISSION_LEVEL,
  SKILL_SIDE_EFFECT_LEVEL,
} from "../skills/platform/contracts.js";

function mapRiskToAgentLevel(riskLevel) {
  if (riskLevel === "high") return AGENT_RISK_LEVEL.R2;
  if (riskLevel === "medium") return AGENT_RISK_LEVEL.R1;
  return AGENT_RISK_LEVEL.R0;
}

export function createRiskTools({ cbtService, auditLogger }) {
  return {
    assessEmotionalRisk: defineSkill({
      id: "assess_emotional_risk",
      name: "assess_emotional_risk",
      version: "1.0.0",
      category: "risk",
      capability_type: SKILL_CAPABILITY_TYPE.ANALYSIS,
      permission_level: SKILL_PERMISSION_LEVEL.ANALYZE,
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
        timeout_ms: 1500,
        idempotent: true,
        cacheable: false,
        model_callable: true,
      },
      async handler(_input, ctx) {
          const result = assessEmotionalRisk({
            lang: ctx.lang,
            checkIns: Array.isArray(ctx?.clientContext?.checkIns) ? ctx.clientContext.checkIns : [],
            cbtAssessment:
              ctx?.clientContext?.cbtAssessment ||
              ctx?.clientContext?.intakeAssessment ||
              ctx?.clientContext?.profile?.cbtAssessment ||
              null,
          });
          return {
            ...result,
            riskLevel: result?.alert?.level === "urgent" ? AGENT_RISK_LEVEL.R3 : mapRiskToAgentLevel(result.level),
          };
        },
    }),
    detectDangerSignals: defineSkill({
      id: "detect_danger_signals",
      name: "detect_danger_signals",
      version: "1.0.0",
      category: "risk",
      capability_type: SKILL_CAPABILITY_TYPE.ANALYSIS,
      permission_level: SKILL_PERMISSION_LEVEL.ANALYZE,
      side_effect_level: SKILL_SIDE_EFFECT_LEVEL.NONE,
      input_schema: {
        type: "object",
        required: ["text"],
        properties: {
          text: { type: "string" },
        },
      },
      output_schema: {
        type: "object",
      },
      async handler(input) {
        const signals = detectDangerSignalsInText(input.text || "");
        return {
          count: signals.length,
          signals,
        };
      },
    }),
    searchMedicalContent: defineSkill({
      id: "search_medical_content",
      name: "search_medical_content",
      version: "1.0.0",
      category: "retrieval",
      capability_type: SKILL_CAPABILITY_TYPE.RETRIEVAL,
      permission_level: SKILL_PERMISSION_LEVEL.READ,
      side_effect_level: SKILL_SIDE_EFFECT_LEVEL.NONE,
      input_schema: {
        type: "object",
        required: ["query"],
        properties: {
          query: { type: "string" },
        },
      },
      output_schema: {
        type: "object",
      },
      async handler(input, ctx) {
        const list = Array.isArray(ctx?.clientContext?.knowledgeHits) ? ctx.clientContext.knowledgeHits : [];
        const query = String(input.query || "").toLowerCase();
        const hits = list.filter((item) => String(item?.title || "").toLowerCase().includes(query)).slice(0, 5);
        return { hits };
      },
    }),
    getCbtOverview: defineSkill({
      id: "get_cbt_overview",
      name: "get_cbt_overview",
      version: "1.0.0",
      category: "cbt",
      capability_type: SKILL_CAPABILITY_TYPE.ANALYSIS,
      permission_level: SKILL_PERMISSION_LEVEL.ANALYZE,
      side_effect_level: SKILL_SIDE_EFFECT_LEVEL.NONE,
      input_schema: {
        type: "object",
        required: [],
        properties: {},
      },
      output_schema: {
        type: "object",
      },
      async handler(_input, ctx) {
        if (!cbtService || typeof cbtService.getOverview !== "function") {
          return {
            available: false,
            reason: "CBT service unavailable.",
          };
        }
        const overview = await cbtService.getOverview({ lang: ctx.lang });
        return {
          available: true,
          overview,
        };
      },
    }),
    createEscalationRecord: defineSkill({
      id: "create_escalation_record",
      name: "create_escalation_record",
      version: "1.0.0",
      category: "audit",
      capability_type: SKILL_CAPABILITY_TYPE.ACTION,
      permission_level: SKILL_PERMISSION_LEVEL.ANALYZE,
      side_effect_level: SKILL_SIDE_EFFECT_LEVEL.NONE,
      input_schema: {
        type: "object",
        required: ["riskLevel"],
        properties: {
          riskLevel: { type: "string" },
          reasons: { type: "array" },
        },
      },
      output_schema: {
        type: "object",
      },
      async handler(input, ctx) {
        if (auditLogger && typeof auditLogger.log === "function") {
          await auditLogger.log({
            type: "ESCALATION",
            userId: ctx.userId,
            sessionId: ctx.sessionId,
            riskLevel: input.riskLevel,
            reasons: Array.isArray(input.reasons) ? input.reasons : [],
            source: "tool:create_escalation_record",
            requestId: ctx.requestId,
          });
        }
        return {
          created: true,
          riskLevel: input.riskLevel,
          reasons: Array.isArray(input.reasons) ? input.reasons : [],
        };
      },
    }),
    getEmergencyContacts: defineSkill({
      id: "get_emergency_contacts",
      name: "get_emergency_contacts",
      version: "1.0.0",
      category: "risk",
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
      async handler(_input, ctx) {
        const profile = ctx?.clientContext?.profile || {};
        return {
          contacts: getEmergencyContacts(profile),
        };
      },
    }),
    recommendProfessionalHelp: defineSkill({
      id: "recommend_professional_help",
      name: "recommend_professional_help",
      version: "1.0.0",
      category: "risk",
      capability_type: SKILL_CAPABILITY_TYPE.ANALYSIS,
      permission_level: SKILL_PERMISSION_LEVEL.ANALYZE,
      side_effect_level: SKILL_SIDE_EFFECT_LEVEL.NONE,
      input_schema: {
        type: "object",
        required: ["riskLevel"],
        properties: {
          riskLevel: { type: "string" },
        },
      },
      output_schema: {
        type: "object",
      },
      async handler(input, ctx) {
        const zh = {
          R3: [
            "建议立即联系急救系统或最近医院急诊。",
            "优先联系产科医生与心理危机热线。",
          ],
          R2: ["建议24小时内完成线下专业评估（产科/心理）。", "联系可信任家人一起陪同就诊。"],
        };
        const en = {
          R3: ["Seek emergency in-person support immediately.", "Contact obstetric care and crisis support line now."],
          R2: ["Book in-person obstetric/mental health assessment within 24 hours.", "Ask a trusted family member to support you."],
        };
        const map = ctx.lang === "en" ? en : zh;
        return {
          suggestions: map[input.riskLevel] || [],
        };
      },
    }),
  };
}
