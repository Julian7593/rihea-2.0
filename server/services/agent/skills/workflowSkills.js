import {
  defineWorkflowSkill,
  SKILL_PERMISSION_LEVEL,
  SKILL_SIDE_EFFECT_LEVEL,
  WORKFLOW_APPROVAL_BOUNDARY,
  WORKFLOW_FAILURE_POLICY,
} from "./platform/contracts.js";

export function getWorkflowSkillManifests() {
  return [
    defineWorkflowSkill({
      id: "grounded_consultation_workflow",
      name: "grounded_consultation_workflow",
      version: "1.0.0",
      category: "workflow",
      permission_level: SKILL_PERMISSION_LEVEL.WRITE_DRAFT,
      side_effect_level: SKILL_SIDE_EFFECT_LEVEL.DRAFT_ONLY,
      failure_policy: WORKFLOW_FAILURE_POLICY.ABORT,
      approval_boundary: WORKFLOW_APPROVAL_BOUNDARY.STEP,
      input_schema: {
        type: "object",
        required: ["query"],
        properties: {
          query: { type: "string" },
          topic: { type: "string" },
          topK: { type: "number" },
          goals: { type: "array" },
        },
      },
      output_schema: { type: "object" },
      steps: [
        {
          id: "knowledge_search",
          skill_id: "search_knowledge_base",
          step_inputs_from: {
            query: "$input.query",
            tenantId: "$context.clientContext.tenantId",
            principalIds: "$context.clientContext.principalIds",
            lang: "$context.lang",
            topK: "$input.topK",
          },
        },
        {
          id: "trend_analysis",
          skill_id: "analyze_emotional_trends",
          step_inputs_from: {
            checkIns: "$context.clientContext.checkIns",
          },
        },
        {
          id: "plan_draft",
          skill_id: "generate_support_plan_draft",
          step_inputs_from: {
            topic: "$input.topic",
            goals: "$input.goals",
            evidence: "$steps.knowledge_search.data.hits",
          },
        },
      ],
    }),
    defineWorkflowSkill({
      id: "risk_escalation_workflow",
      name: "risk_escalation_workflow",
      version: "1.0.0",
      category: "workflow",
      permission_level: SKILL_PERMISSION_LEVEL.WRITE_DRAFT,
      side_effect_level: SKILL_SIDE_EFFECT_LEVEL.DRAFT_ONLY,
      failure_policy: WORKFLOW_FAILURE_POLICY.ABORT,
      approval_boundary: WORKFLOW_APPROVAL_BOUNDARY.STEP,
      input_schema: {
        type: "object",
        required: [],
        properties: {
          riskLevel: { type: "string" },
          reasons: { type: "array" },
        },
      },
      output_schema: { type: "object" },
      steps: [
        {
          id: "risk_assessment",
          skill_id: "assess_emotional_risk",
          step_inputs_from: {},
        },
        {
          id: "risk_explanation",
          skill_id: "explain_risk_level",
          step_inputs_from: {
            riskLevel: "$input.riskLevel",
            reasons: "$input.reasons",
          },
        },
        {
          id: "referral_draft",
          skill_id: "create_referral_draft",
          step_inputs_from: {
            riskLevel: "$input.riskLevel",
            reasons: "$input.reasons",
          },
        },
      ],
    }),
    defineWorkflowSkill({
      id: "nutrition_followup_workflow",
      name: "nutrition_followup_workflow",
      version: "1.0.0",
      category: "workflow",
      permission_level: SKILL_PERMISSION_LEVEL.WRITE_DRAFT,
      side_effect_level: SKILL_SIDE_EFFECT_LEVEL.DRAFT_ONLY,
      failure_policy: WORKFLOW_FAILURE_POLICY.ABORT,
      approval_boundary: WORKFLOW_APPROVAL_BOUNDARY.STEP,
      input_schema: {
        type: "object",
        required: ["imageBase64"],
        properties: {
          imageBase64: { type: "string" },
          mealType: { type: "string" },
          fileName: { type: "string" },
          goals: { type: "array" },
        },
      },
      output_schema: { type: "object" },
      steps: [
        {
          id: "meal_photo_analysis",
          skill_id: "analyze_meal_photo",
          step_inputs_from: {
            imageBase64: "$input.imageBase64",
            mealType: "$input.mealType",
            fileName: "$input.fileName",
            pregnancyWeek: "$context.clientContext.profile.pregnancyWeek",
          },
        },
        {
          id: "nutrition_structure",
          skill_id: "analyze_nutrition_structure",
          step_inputs_from: {
            detectedFoods: "$steps.meal_photo_analysis.data.detectedFoods",
          },
        },
        {
          id: "nutrition_plan_draft",
          skill_id: "generate_support_plan_draft",
          step_inputs_from: {
            topic: "nutrition_followup",
            goals: "$input.goals",
            evidence: "$steps.meal_photo_analysis.data.detectedFoods",
          },
        },
      ],
    }),
  ];
}
