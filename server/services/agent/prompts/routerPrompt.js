import { normalizePromptSlots, summarizePromptContext } from "./promptContext.js";
import { buildRouterPromptPackText } from "./promptPacks.js";

export const ROUTER_AGENT_PROMPT = `
You are the Main Routing Agent for a Pregnancy / Emotional Wellness in-app assistant.

Your job is decision-making only, not final counseling content generation.

Hard rules:
1) Safety first: if risk is R2/R3 or high-risk expressions are detected, force route to "risk_escalation".
2) Do not output medical diagnosis, treatment conclusion, or efficacy guarantees.
3) Prefer deterministic routing when confidence is high; use LLM semantic judgment only when needed.
4) Output must be strict JSON and auditable.

You must decide:
- primary_intent, secondary_intents, confidence
- risk level and whether risk override is applied
- whether to read KB / user profile / memory
- target sub-agent route
- whether fallback is triggered
- whether escalation is required

Output JSON fields:
- route, topic, classification, risk, retrieval_plan, fallback, escalation, reason, audit_trace.

${buildRouterPromptPackText()}
`;

const ROUTER_CONTEXT_ALLOWLIST = [
  "risk_level_current",
  "risk_level_baseline",
  "last_primary_concern",
  "pregnancy_week",
  "language_pref",
  "faq_type_top3",
  "conversation_tone_pref",
];

export function buildRouterPromptInput({
  requestId,
  userId,
  sessionId,
  message,
  lang,
  precheck,
  memoryPromptContext,
  clientContext,
  routerCapabilities,
}) {
  const contextSlots = normalizePromptSlots(memoryPromptContext, {
    allowlist: ROUTER_CONTEXT_ALLOWLIST,
    maxSlots: 10,
  });

  return {
    systemPrompt: ROUTER_AGENT_PROMPT,
    taskInput: {
      requestId: String(requestId || ""),
      userId: String(userId || ""),
      sessionId: String(sessionId || ""),
      message: String(message || ""),
      lang: lang === "en" ? "en" : "zh",
      clientContext: {
        checkInsCount: Array.isArray(clientContext?.checkIns) ? clientContext.checkIns.length : 0,
        channel: typeof clientContext?.channel === "string" ? clientContext.channel : "",
        appVersion: typeof clientContext?.appVersion === "string" ? clientContext.appVersion : "",
      },
      safetyPrecheck: {
        riskLevel: precheck?.riskLevel || "R0",
        stopNormalFlow: Boolean(precheck?.stopNormalFlow),
        reasons: Array.isArray(precheck?.reasons) ? precheck.reasons : [],
        matchedSignalsCount: Array.isArray(precheck?.matchedSignals) ? precheck.matchedSignals.length : 0,
      },
      routerCapabilities: {
        kbAvailable: routerCapabilities?.kb_available !== false,
        profileAvailable: routerCapabilities?.profile_available !== false,
        memoryAvailable: routerCapabilities?.memory_available !== false,
        subAgents: Array.isArray(routerCapabilities?.sub_agents) ? routerCapabilities.sub_agents : [],
      },
      memoryContext: summarizePromptContext(contextSlots),
    },
  };
}
