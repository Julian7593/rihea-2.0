import { apiContracts } from "./contracts";
import { apiRequest, hasRemoteApi } from "./client";

const wait = (ms = 140) => new Promise((resolve) => setTimeout(resolve, ms));

function buildLocalFallbackAnswer({ lang, message }) {
  if (lang === "en") {
    const answer = `I have recorded your message: "${message}". Local fallback mode is active, so this is a safe placeholder response.`;
    return {
      answer,
      answer_raw: answer,
      riskLevel: "R0",
      disclaimer:
        "This assistant provides supportive information only and does not replace licensed medical or mental health professionals.",
      nextActions: ["Set VITE_API_BASE_URL to enable full backend orchestration."],
      escalation: null,
      routing: null,
      toolTrace: [],
      reasoning_summary: null,
      sources: [],
      citations: [],
      usedSources: [],
      groundingSummary: null,
      kbFreshness: null,
      confidence: null,
      fallbackReason: "REMOTE_API_NOT_CONFIGURED",
      relatedQuestionCards: [],
      search_meta: {
        used: false,
        query: String(message || ""),
        latency_ms: 0,
        provider: "local_fallback",
        error_code: "REMOTE_API_NOT_CONFIGURED",
      },
      memoryUpdates: {},
    };
  }

  const answer = `我已记录你的问题：“${message}”。当前处于本地回退模式，这是一个安全占位回复。`;
  return {
    answer,
    answer_raw: answer,
    riskLevel: "R0",
    disclaimer: "本助手仅提供支持性信息，不替代执业医生或心理专业人士。",
    nextActions: ["配置 VITE_API_BASE_URL 后可启用完整后端 Agent 编排能力。"],
    escalation: null,
    routing: null,
    toolTrace: [],
    reasoning_summary: null,
    sources: [],
    citations: [],
    usedSources: [],
    groundingSummary: null,
    kbFreshness: null,
    confidence: null,
    fallbackReason: "REMOTE_API_NOT_CONFIGURED",
    relatedQuestionCards: [],
    search_meta: {
      used: false,
      query: String(message || ""),
      latency_ms: 0,
      provider: "local_fallback",
      error_code: "REMOTE_API_NOT_CONFIGURED",
    },
    memoryUpdates: {},
  };
}

export async function requestAgentChat(payload = {}, options = {}) {
  const body = {
    userId: payload.userId,
    sessionId: payload.sessionId,
    message: payload.message,
    lang: payload.lang === "en" ? "en" : "zh",
    presetQuestionId: payload.presetQuestionId,
    sourcePreference: payload.sourcePreference,
    feishuScopeId: payload.feishuScopeId,
    clientContext: payload.clientContext || {},
  };

  if (hasRemoteApi) {
    return apiRequest(apiContracts.agent.chat, {
      ...options,
      body,
    });
  }

  await wait(120);
  return buildLocalFallbackAnswer({
    lang: body.lang,
    message: String(body.message || ""),
  });
}

export async function requestAgentPresets({ lang = "zh", category = "" } = {}, options = {}) {
  if (hasRemoteApi) {
    const query = new URLSearchParams();
    query.set("lang", lang === "en" ? "en" : "zh");
    if (category) query.set("category", category);
    return apiRequest(
      {
        ...apiContracts.agent.getPresets,
        path: `${apiContracts.agent.getPresets.path}?${query.toString()}`,
      },
      options
    );
  }

  return {
    lang: lang === "en" ? "en" : "zh",
    category,
    items: [],
  };
}
