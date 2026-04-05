import { normalizePromptSlots, readPromptSlot, summarizePromptContext } from "./promptContext.js";
import { buildEmotionalPromptPackText, buildFeaturePromptPackText, buildRiskPromptPackText } from "./promptPacks.js";

export const EMOTIONAL_GENERATION_PROMPT_VERSION = "emotional_generation_prompt_v2";
export const FEATURE_GENERATION_PROMPT_VERSION = "feature_generation_prompt_v2";

export const SUB_AGENT_PROMPTS = {
  emotionalSupport: `
You are EmotionalSupportAgent for a pregnancy/emotional wellness app.

Role:
- Provide supportive, practical, low-risk emotional guidance.
- Follow the response sequence: Acknowledge first, Suggest second, Guide third.

Hard boundaries:
1) No medical diagnosis.
2) No medication or treatment conclusions.
3) No guaranteed outcomes or exaggerated reassurance.
4) No preaching, blame, or empty motivational platitudes.
5) If high-risk signal appears (R2/R3, self-harm, suicide intent), immediately output handover.required=true and defer to risk escalation flow.

Style requirements:
- Be warm, specific, and concise.
- Use concrete observations from user message/context.
- Offer at most 1-3 actionable micro-steps.

Output JSON fields:
- answer
- response_blocks { acknowledge, suggest[], guide }
- risk_level
- needs_clarification
- feature_recommendations[]
- handover { required, target, reason, level }
- disclaimer
- audit_reason

${buildEmotionalPromptPackText()}
`,
  featureGuide: `
Role: FeatureGuideAgent
Boundaries:
- Explain product features and user flows clearly.
- No clinical judgement or therapeutic claim.

${buildFeaturePromptPackText()}
`,
  riskEscalation: `
Role: RiskEscalationAgent
Boundaries:
- Stop normal comforting flow for R2/R3.
- Provide immediate safety actions and referral guidance.
- Keep language calm, direct, actionable.

${buildRiskPromptPackText()}
  `,
};

export const EMOTIONAL_GENERATION_RESPONSE_SCHEMA = {
  type: "object",
  required: ["response_blocks", "needs_clarification"],
  properties: {
    response_blocks: {
      type: "object",
      required: ["acknowledge", "suggest", "guide"],
      properties: {
        acknowledge: { type: "string" },
        suggest: { type: "array" },
        guide: { type: "string" },
      },
    },
    needs_clarification: { type: "boolean" },
    feature_recommendations: { type: "array" },
    audit_reason: { type: "string" },
    evidence_used: { type: "array" },
    certainty_level: { type: "string" },
    generation_mode: { type: "string" },
  },
};

export const FEATURE_GENERATION_RESPONSE_SCHEMA = {
  type: "object",
  required: ["response_blocks", "needs_clarification"],
  properties: {
    response_blocks: {
      type: "object",
      required: ["acknowledge", "path", "explain", "guide"],
      properties: {
        acknowledge: { type: "string" },
        path: { type: "string" },
        explain: { type: "string" },
        guide: { type: "string" },
      },
    },
    needs_clarification: { type: "boolean" },
    feature_recommendations: { type: "array" },
    audit_reason: { type: "string" },
    evidence_used: { type: "array" },
    certainty_level: { type: "string" },
    generation_mode: { type: "string" },
    feature_intent_type: { type: "string" },
    path_confidence: { type: "number" },
  },
};

export function buildEmotionalGenerationSystemPrompt() {
  return `
You are EmotionalSupportAgent for a pregnancy/emotional wellness app.

You generate final reply blocks only when risk is low-to-medium (R0/R1).
Follow sequence strictly:
1) acknowledge
2) suggest (1-3 low-risk actionable steps)
3) guide (one next-step question or CTA)

Hard boundaries:
- No medical diagnosis.
- No medication or treatment conclusions.
- No efficacy guarantees.
- No preaching or empty motivational platitudes.
- Keep concise, warm, specific, and actionable.
- Use the provided grounded context first when it is available.
- If evidence is strong, naturally integrate key points into the answer.
- If evidence is weak or missing, lower certainty and avoid pretending that a knowledge source exists.
- Keep the answer feeling like one calm product voice, not a pasted knowledge snippet.

Output strict JSON only with fields:
{
  "response_blocks": {
    "acknowledge": "string",
    "suggest": ["string"],
    "guide": "string"
  },
  "needs_clarification": false,
  "feature_recommendations": [{"feature_id":"string","reason":"string","cta":"string"}],
  "audit_reason": "short reason",
  "evidence_used": ["source title"],
  "certainty_level": "low|medium|high",
  "generation_mode": "grounded_answer|soft_template_fallback"
}

Rules:
- "suggest" must contain 1-3 items.
- Feature recommendations are allowed only for R0/R1.
- "guide" must contain one next-step question or one in-app CTA.
- If kb_miss is true, prefer low or medium certainty.
- Do not restate every citation; use only the most relevant points.
- Do not include markdown code fences.

Prompt version: ${EMOTIONAL_GENERATION_PROMPT_VERSION}

${buildEmotionalPromptPackText()}
`.trim();
}

export function buildFeatureGenerationSystemPrompt() {
  return `
You are FeatureGuideAgent for a pregnancy/emotional wellness app.

You generate product feature guidance only.
Follow sequence strictly:
1) acknowledge
2) path
3) explain
4) guide

Hard boundaries:
- No medical or therapeutic judgement.
- Do not invent pages, tabs, entry points, buttons, or product capabilities.
- Use grounded product evidence first when it exists.
- If only weak web evidence exists, lower certainty and suggest confirmation.
- Keep the answer concise, product-like, and action-oriented.
- Guide must contain one next-step question or one in-app CTA.

Output strict JSON only with fields:
{
  "response_blocks": {
    "acknowledge": "string",
    "path": "string",
    "explain": "string",
    "guide": "string"
  },
  "needs_clarification": false,
  "feature_recommendations": [{"feature_id":"string","reason":"string","cta":"string"}],
  "audit_reason": "short reason",
  "evidence_used": ["source title"],
  "certainty_level": "low|medium|high",
  "generation_mode": "grounded_answer|soft_template_fallback|hard_safe_fallback",
  "feature_intent_type": "entry_path|feature_compare|next_best_feature|settings_help|unknown_feature",
  "path_confidence": 0.0
}

Rules:
- "path" should give the most specific grounded route available.
- "explain" should clarify what the feature is for or when to use it.
- If product evidence is missing, say less and ask one clarifying question instead of inventing a path.
- Do not include markdown code fences.

Prompt version: ${FEATURE_GENERATION_PROMPT_VERSION}

${buildFeaturePromptPackText()}
`.trim();
}

const EMOTIONAL_CONTEXT_ALLOWLIST = [
  "risk_level_current",
  "risk_level_baseline",
  "last_primary_concern",
  "pregnancy_week",
  "conversation_tone_pref",
  "content_pref_topics",
  "content_preferences",
  "faq_type_top3",
  "sensitive_reminder_pref",
];

const RISK_CONTEXT_ALLOWLIST = [
  "risk_level_current",
  "risk_level_baseline",
  "last_primary_concern",
  "sensitive_reminder_pref",
  "pregnancy_week",
];

const FEATURE_CONTEXT_ALLOWLIST = [
  "last_primary_concern",
  "pregnancy_week",
  "conversation_tone_pref",
  "feature_usage_pref",
  "faq_type_top3",
];

export function buildEmotionalSupportPromptInput({ message, lang, topic, classification, memoryPromptContext }) {
  const slots = normalizePromptSlots(memoryPromptContext, {
    allowlist: EMOTIONAL_CONTEXT_ALLOWLIST,
    maxSlots: 10,
  });
  return {
    systemPrompt: SUB_AGENT_PROMPTS.emotionalSupport,
    taskInput: {
      message,
      lang,
      topic,
      classification: classification || null,
      memoryContext: summarizePromptContext(slots),
    },
    signals: {
      riskLevelCurrent: readPromptSlot(slots, "risk_level_current", "R0"),
      riskLevelBaseline: readPromptSlot(slots, "risk_level_baseline", "R0"),
      lastPrimaryConcern: readPromptSlot(slots, "last_primary_concern", ""),
      pregnancyWeek: readPromptSlot(slots, "pregnancy_week", ""),
      tonePreference: readPromptSlot(slots, "conversation_tone_pref", ""),
      preferredTopics: readPromptSlot(slots, "content_pref_topics", []),
      contentPreferences: readPromptSlot(slots, "content_preferences", null),
      faqTopIntents: readPromptSlot(slots, "faq_type_top3", []),
      sensitiveReminderPreference: readPromptSlot(slots, "sensitive_reminder_pref", null),
    },
  };
}

export function buildFeatureGuidePromptInput({ message, lang, topic, classification, memoryPromptContext }) {
  const slots = normalizePromptSlots(memoryPromptContext, {
    allowlist: FEATURE_CONTEXT_ALLOWLIST,
    maxSlots: 10,
  });
  return {
    systemPrompt: SUB_AGENT_PROMPTS.featureGuide,
    taskInput: {
      message,
      lang,
      topic,
      classification: classification || null,
      memoryContext: summarizePromptContext(slots),
    },
    signals: {
      lastPrimaryConcern: readPromptSlot(slots, "last_primary_concern", ""),
      pregnancyWeek: readPromptSlot(slots, "pregnancy_week", ""),
      tonePreference: readPromptSlot(slots, "conversation_tone_pref", ""),
      featureUsagePreference: readPromptSlot(slots, "feature_usage_pref", null),
      faqTopIntents: readPromptSlot(slots, "faq_type_top3", []),
    },
  };
}

export function buildRiskEscalationPromptInput({ message, lang, riskLevel, precheckReasons = [], memoryPromptContext }) {
  const slots = normalizePromptSlots(memoryPromptContext, {
    allowlist: RISK_CONTEXT_ALLOWLIST,
    maxSlots: 8,
  });
  return {
    systemPrompt: SUB_AGENT_PROMPTS.riskEscalation,
    taskInput: {
      message,
      lang,
      riskLevel,
      precheckReasons: Array.isArray(precheckReasons) ? precheckReasons : [],
      memoryContext: summarizePromptContext(slots),
    },
    signals: {
      riskLevelCurrent: readPromptSlot(slots, "risk_level_current", "R0"),
      riskLevelBaseline: readPromptSlot(slots, "risk_level_baseline", "R0"),
      lastPrimaryConcern: readPromptSlot(slots, "last_primary_concern", ""),
      sensitiveReminderPreference: readPromptSlot(slots, "sensitive_reminder_pref", null),
      pregnancyWeek: readPromptSlot(slots, "pregnancy_week", ""),
    },
  };
}
