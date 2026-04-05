import { AGENT_RISK_LEVEL } from "../constants.js";

function zhFallbackActions(level) {
  if (level === AGENT_RISK_LEVEL.R3) {
    return [
      "请立即停止当前活动，优先联系线下急救资源或就近医院。",
      "请联系你信任的家人/伴侣，并明确告知当前风险感受。",
      "如果你有伤害自己或他人的冲动，请立刻拨打当地急救电话。",
    ];
  }
  if (level === AGENT_RISK_LEVEL.R2) {
    return [
      "建议尽快联系产科医生或心理专业人员进行线下评估。",
      "今天请优先安排一个可执行的支持动作（联系家人/预约咨询）。",
      "如出现持续加重或危险信号，请立即转入紧急就医流程。",
    ];
  }
  return [];
}

function enFallbackActions(level) {
  if (level === AGENT_RISK_LEVEL.R3) {
    return [
      "Stop current activity and seek emergency in-person support immediately.",
      "Contact a trusted partner/family member and share your current risk state clearly.",
      "If you feel at risk of harming yourself or others, call emergency services now.",
    ];
  }
  if (level === AGENT_RISK_LEVEL.R2) {
    return [
      "Please contact your obstetric or mental health professional for in-person assessment soon.",
      "Prioritize one concrete support action today (call support person / book professional help).",
      "If symptoms worsen or danger signals appear, switch to emergency care immediately.",
    ];
  }
  return [];
}

export function buildEscalationPayload({ riskLevel, lang = "zh", reasons = [], contacts = [] }) {
  if (riskLevel !== AGENT_RISK_LEVEL.R2 && riskLevel !== AGENT_RISK_LEVEL.R3) {
    return null;
  }

  const isEn = lang === "en";
  const urgent = riskLevel === AGENT_RISK_LEVEL.R3;
  return {
    required: true,
    level: riskLevel,
    title: isEn ? (urgent ? "Emergency Safety Escalation" : "High-Risk Escalation") : urgent ? "紧急安全升级" : "高风险升级",
    reasons: Array.isArray(reasons) ? reasons.slice(0, 6) : [],
    contacts: Array.isArray(contacts) ? contacts : [],
    actions: isEn ? enFallbackActions(riskLevel) : zhFallbackActions(riskLevel),
  };
}
