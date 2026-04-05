import { AGENT_RISK_LEVEL } from "../constants.js";
import { assessEmotionalRisk } from "../../../../src/utils/riskAssessment.js";
import { detectDangerSignalsInText, DANGER_SIGNAL_TYPES } from "../../../../src/utils/dangerSignalDetector.js";

const R3_KEYWORDS = [
  "自杀",
  "不想活",
  "结束生命",
  "伤害自己",
  "kill myself",
  "suicide",
  "end my life",
  "hurt myself",
];

const DISTRESS_KEYWORDS = ["崩溃", "绝望", "撑不住", "panic", "hopeless", "overwhelmed"];

function containsKeyword(message, keywords) {
  const lower = String(message || "").toLowerCase();
  return keywords.some((keyword) => lower.includes(String(keyword).toLowerCase()));
}

function mapEmotionalRiskToAgentLevel(emotionalRiskLevel) {
  if (emotionalRiskLevel === "high") return AGENT_RISK_LEVEL.R2;
  if (emotionalRiskLevel === "medium") return AGENT_RISK_LEVEL.R1;
  return AGENT_RISK_LEVEL.R0;
}

export function runSafetyPrecheck({ message, checkIns = [], lang = "zh" }) {
  const reasons = [];
  const matchedSignals = detectDangerSignalsInText(message || "");
  const hasDirectR3Keyword = containsKeyword(message, R3_KEYWORDS);

  if (hasDirectR3Keyword) {
    reasons.push(lang === "en" ? "Detected direct self-harm expression." : "检测到直接自伤/轻生表达。");
    return {
      riskLevel: AGENT_RISK_LEVEL.R3,
      stopNormalFlow: true,
      reasons,
      matchedSignals,
      emotionalRisk: null,
    };
  }

  if (matchedSignals.some((signal) => signal.type === DANGER_SIGNAL_TYPES.EMERGENCY)) {
    reasons.push(lang === "en" ? "Detected emergency danger signal." : "检测到紧急危险信号。");
    return {
      riskLevel: AGENT_RISK_LEVEL.R3,
      stopNormalFlow: true,
      reasons,
      matchedSignals,
      emotionalRisk: null,
    };
  }

  if (matchedSignals.some((signal) => signal.type === DANGER_SIGNAL_TYPES.HIGH)) {
    reasons.push(lang === "en" ? "Detected high-risk danger signal." : "检测到高危危险信号。");
    return {
      riskLevel: AGENT_RISK_LEVEL.R2,
      stopNormalFlow: true,
      reasons,
      matchedSignals,
      emotionalRisk: null,
    };
  }

  const emotionalRisk = assessEmotionalRisk({
    lang,
    checkIns: Array.isArray(checkIns) ? checkIns : [],
  });
  const emotionalLevel =
    emotionalRisk?.alert?.level === "urgent"
      ? AGENT_RISK_LEVEL.R3
      : mapEmotionalRiskToAgentLevel(emotionalRisk.level);

  if (emotionalLevel === AGENT_RISK_LEVEL.R2 && containsKeyword(message, DISTRESS_KEYWORDS)) {
    reasons.push(lang === "en" ? "High emotional risk with acute distress wording." : "高情绪风险且存在急性痛苦表达。");
    return {
      riskLevel: AGENT_RISK_LEVEL.R2,
      stopNormalFlow: true,
      reasons,
      matchedSignals,
      emotionalRisk,
    };
  }

  if (emotionalLevel === AGENT_RISK_LEVEL.R2) {
    reasons.push(lang === "en" ? "High emotional risk from recent check-ins." : "近期打卡评估为高情绪风险。");
  }
  if (emotionalLevel === AGENT_RISK_LEVEL.R1) {
    reasons.push(lang === "en" ? "Medium emotional risk from recent check-ins." : "近期打卡评估为中等情绪风险。");
  }

  return {
    riskLevel: emotionalLevel,
    stopNormalFlow: false,
    reasons,
    matchedSignals,
    emotionalRisk,
  };
}
