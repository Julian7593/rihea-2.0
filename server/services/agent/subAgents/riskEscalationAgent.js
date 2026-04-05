import { AGENT_RISK_LEVEL } from "../constants.js";
import { buildEscalationPayload } from "../safety/escalationPolicy.js";
import { buildRiskEscalationPromptInput } from "../prompts/subAgentPrompts.js";

function buildEmergencyAnswer(lang, level) {
  if (lang === "en") {
    return level === AGENT_RISK_LEVEL.R3
      ? "I am switching to safety mode now. Your message suggests urgent risk. Please seek emergency in-person support immediately."
      : "I am switching to high-risk support mode now. Please prioritize in-person professional assessment and trusted support today.";
  }
  return level === AGENT_RISK_LEVEL.R3
    ? "我现在切换到安全模式。你的表达显示存在紧急风险，请立即寻求线下急救支持。"
    : "我现在切换到高风险支持模式。请优先安排线下专业评估，并联系可信任支持者。";
}

export function createRiskEscalationAgent() {
  return {
    async handle({ lang, message, riskLevel, precheckReasons = [], memoryPromptContext, runTool }) {
      const promptInput = buildRiskEscalationPromptInput({
        message,
        lang,
        riskLevel,
        precheckReasons,
        memoryPromptContext,
      });
      const signalResult = await runTool("detect_danger_signals", { text: message });
      const contactResult = await runTool("get_emergency_contacts", {});
      await runTool("create_escalation_record", {
        riskLevel,
        reasons: precheckReasons,
      });

      const contacts = contactResult.ok ? contactResult.data?.contacts || [] : [];
      const escalation = buildEscalationPayload({
        riskLevel,
        lang,
        reasons: precheckReasons,
        contacts,
      });

      const detectedCount = signalResult.ok ? Number(signalResult.data?.count || 0) : 0;
      const nextActions = escalation?.actions || [];
      const answer = buildEmergencyAnswer(lang, riskLevel);
      const concernLine = promptInput.signals.lastPrimaryConcern
        ? lang === "en"
          ? `Previous key concern: ${promptInput.signals.lastPrimaryConcern}.`
          : `你近期核心困扰：${promptInput.signals.lastPrimaryConcern}。`
        : "";
      return {
        answer:
          detectedCount > 0
            ? `${answer}${lang === "en" ? ` ${detectedCount} danger signal(s) detected.` : ` 已识别到${detectedCount}条危险信号。`}${concernLine ? ` ${concernLine}` : ""}`
            : `${answer}${concernLine ? ` ${concernLine}` : ""}`,
        riskLevel,
        nextActions,
        latestEmotionalState: {
          valence: "negative",
          arousal: "high",
          riskLevel,
          inferredFrom: ["safety_precheck", "danger_signal_tool", "prompt_memory"],
        },
        primaryDistressCandidate: {
          label: "high_risk_expression",
          confidence: riskLevel === AGENT_RISK_LEVEL.R3 ? 1 : 0.9,
        },
        escalation,
      };
    },
  };
}
