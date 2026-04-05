export const AGENT_RISK_LEVEL = {
  R0: "R0",
  R1: "R1",
  R2: "R2",
  R3: "R3",
};

export const AGENT_ROUTE = {
  EMOTIONAL_SUPPORT: "emotional_support",
  FEATURE_GUIDE: "feature_guide",
  RISK_ESCALATION: "risk_escalation",
};

export const RISK_LEVEL_WEIGHT = {
  [AGENT_RISK_LEVEL.R0]: 0,
  [AGENT_RISK_LEVEL.R1]: 1,
  [AGENT_RISK_LEVEL.R2]: 2,
  [AGENT_RISK_LEVEL.R3]: 3,
};

export const SESSION_MAX_ROUNDS = 12;

export const TOOL_MAX_CALLS_PER_TURN = 8;

export const ROUTE_CONFIDENCE_THRESHOLD = 0.65;

export const CLARIFY_CONFIDENCE_THRESHOLD = 0.6;

export function normalizeLang(lang) {
  return lang === "en" ? "en" : "zh";
}

export function maxRiskLevel(left, right) {
  const safeLeft = left && left in RISK_LEVEL_WEIGHT ? left : AGENT_RISK_LEVEL.R0;
  const safeRight = right && right in RISK_LEVEL_WEIGHT ? right : AGENT_RISK_LEVEL.R0;
  return RISK_LEVEL_WEIGHT[safeLeft] >= RISK_LEVEL_WEIGHT[safeRight] ? safeLeft : safeRight;
}
