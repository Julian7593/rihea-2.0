import path from "node:path";

const DEFAULT_PORT = 8787;
const DEFAULT_HOST = "0.0.0.0";
const DEFAULT_MODEL_KEY = "deepseek_chat";
const DEFAULT_MODEL_ALLOWLIST = ["deepseek_chat", "deepseek_reasoner", "doubao_chat"];
const DEFAULT_WEB_SEARCH_ALLOWLIST = ["nhc.gov.cn", "who.int", "acog.org", "mayoclinic.org", "cdc.gov", "nhs.uk"];
const DEFAULT_NUTRITION_PHOTO_PROVIDER = "mock";

function parseBoolean(value, fallback = false) {
  if (typeof value === "boolean") return value;
  if (typeof value !== "string") return fallback;
  if (value.toLowerCase() === "true") return true;
  if (value.toLowerCase() === "false") return false;
  return fallback;
}

function parseNumber(value, fallback) {
  const next = Number(value);
  if (!Number.isFinite(next)) return fallback;
  return next;
}

function parseList(value, fallback = []) {
  if (typeof value !== "string" || !value.trim()) return [...fallback];
  const list = value
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  return list.length ? Array.from(new Set(list)) : [...fallback];
}

export const serverConfig = {
  port: Number(process.env.PORT) || DEFAULT_PORT,
  host: process.env.HOST || DEFAULT_HOST,
  corsOrigin: process.env.CORS_ORIGIN || true,
  partnerSyncDataFilePath:
    process.env.PARTNER_SYNC_DATA_FILE ||
    path.resolve(process.cwd(), "server", "data", "partner-sync-state.local.json"),
  cbtDataFilePath:
    process.env.CBT_DATA_FILE ||
    path.resolve(process.cwd(), "server", "data", "cbt-state.local.json"),
  agentSessionDataFilePath:
    process.env.AGENT_SESSION_DATA_FILE ||
    path.resolve(process.cwd(), "server", "data", "agent-session-memory.local.json"),
  agentUserStateDataFilePath:
    process.env.AGENT_USER_STATE_DATA_FILE ||
    path.resolve(process.cwd(), "server", "data", "agent-user-state-memory.local.json"),
  agentAuditDataFilePath:
    process.env.AGENT_AUDIT_DATA_FILE ||
    path.resolve(process.cwd(), "server", "data", "agent-audit.local.json"),
  modelGateway: {
    overrideEnabled: parseBoolean(process.env.MODEL_OVERRIDE_ENABLED, false),
    defaultModelKey: String(process.env.DEFAULT_MODEL_KEY || DEFAULT_MODEL_KEY).trim().toLowerCase() || DEFAULT_MODEL_KEY,
    allowlist: parseList(process.env.MODEL_ALLOWLIST, DEFAULT_MODEL_ALLOWLIST),
    timeoutMs: Math.max(1000, parseNumber(process.env.LLM_TIMEOUT_MS, 8000)),
  },
  webSearch: {
    enabled: parseBoolean(process.env.WEB_SEARCH_ENABLED, false),
    provider: String(process.env.WEB_SEARCH_PROVIDER || "serper").trim().toLowerCase(),
    apiKey: String(process.env.WEB_SEARCH_API_KEY || "").trim(),
    timeoutMs: Math.max(1000, parseNumber(process.env.WEB_SEARCH_TIMEOUT_MS, 5000)),
    topK: Math.max(1, Math.min(10, parseNumber(process.env.WEB_SEARCH_TOP_K, 5))),
    allowlist: parseList(process.env.WEB_SEARCH_ALLOWLIST, DEFAULT_WEB_SEARCH_ALLOWLIST),
    serperBaseUrl: String(process.env.WEB_SEARCH_SERPER_BASE_URL || "https://google.serper.dev").replace(/\/$/, ""),
    zhipuBaseUrl: String(process.env.WEB_SEARCH_ZHIPU_BASE_URL || "https://open.bigmodel.cn/api/paas/v4").replace(/\/$/, ""),
    zhipuEngine: String(process.env.WEB_SEARCH_ZHIPU_ENGINE || "search_std").trim(),
    zhipuContentSize: String(process.env.WEB_SEARCH_ZHIPU_CONTENT_SIZE || "medium").trim(),
    zhipuRecencyFilter: String(process.env.WEB_SEARCH_ZHIPU_RECENCY_FILTER || "noLimit").trim(),
    zhipuSearchIntent: parseBoolean(process.env.WEB_SEARCH_ZHIPU_SEARCH_INTENT, false),
  },
  nutritionPhotoAnalysis: {
    provider: String(process.env.NUTRITION_PHOTO_PROVIDER || DEFAULT_NUTRITION_PHOTO_PROVIDER).trim().toLowerCase(),
    timeoutMs: Math.max(1000, parseNumber(process.env.NUTRITION_PHOTO_TIMEOUT_MS, 10000)),
    logmealApiKey: String(process.env.LOGMEAL_API_KEY || "").trim(),
    logmealBaseUrl: String(process.env.LOGMEAL_BASE_URL || "https://api.logmeal.com").replace(/\/$/, ""),
    zhipuApiKey: String(process.env.ZHIPU_API_KEY || "").trim(),
    zhipuBaseUrl: String(process.env.ZHIPU_BASE_URL || "https://open.bigmodel.cn/api/paas/v4").replace(/\/$/, ""),
    zhipuVisionModel: String(process.env.ZHIPU_VISION_MODEL || "glm-5v-turbo").trim(),
    zhipuVisionTimeoutMs: Math.max(1000, parseNumber(process.env.ZHIPU_VISION_TIMEOUT_MS, 15000)),
  },
  feishuKnowledge: {
    liveEnabled: parseBoolean(process.env.FEISHU_KB_LIVE_ENABLED, false),
    appId: String(process.env.FEISHU_APP_ID || "").trim(),
    appSecret: String(process.env.FEISHU_APP_SECRET || "").trim(),
    baseUrl: String(process.env.FEISHU_BASE_URL || "https://open.feishu.cn").replace(/\/$/, ""),
    syncEnabled: parseBoolean(process.env.FEISHU_KB_SYNC_ENABLED, false),
    syncIntervalMinutes: Math.max(15, parseNumber(process.env.FEISHU_KB_SYNC_INTERVAL_MINUTES, 720)),
    syncFilePath:
      process.env.FEISHU_KB_SYNC_FILE ||
      path.resolve(process.cwd(), "server", "data", "feishu-knowledge.local.json"),
    targetsFilePath:
      process.env.FEISHU_KB_TARGETS_FILE ||
      path.resolve(process.cwd(), "server", "data", "feishu-sync-targets.local.json"),
  },
  knowledgeBase: {
    enabled: parseBoolean(process.env.KNOWLEDGE_BASE_ENABLED, true),
    defaultTenantId: String(process.env.KNOWLEDGE_BASE_DEFAULT_TENANT || "rihea-default").trim() || "rihea-default",
    manualDocumentsFilePath:
      process.env.KNOWLEDGE_BASE_DOCUMENTS_FILE ||
      path.resolve(process.cwd(), "server", "kb", "knowledge-documents.local.json"),
    sourceRegistryFilePath:
      process.env.KNOWLEDGE_BASE_SOURCE_REGISTRY_FILE ||
      path.resolve(process.cwd(), "server", "kb", "knowledge-connectors.local.json"),
  },
  providers: {
    deepseek: {
      apiKey: process.env.DEEPSEEK_API_KEY || "",
      baseUrl: process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com",
    },
    doubao: {
      apiKey: process.env.DOUBAO_API_KEY || "",
      baseUrl: process.env.DOUBAO_BASE_URL || "https://ark.cn-beijing.volces.com/api/v3",
    },
    openai: {
      apiKey: process.env.OPENAI_API_KEY || "",
      baseUrl: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
    },
  },
};
