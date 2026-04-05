function sanitizeModelKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

export const DEFAULT_MODEL_REGISTRY = {
  deepseek_chat: {
    provider: "deepseek",
    model: "deepseek-chat",
  },
  deepseek_reasoner: {
    provider: "deepseek",
    model: "deepseek-reasoner",
  },
  doubao_chat: {
    provider: "doubao",
    model: process.env.DOUBAO_MODEL_ID || "FILL_DOUBAO_MODEL_ID",
  },
  openai_gpt4o_mini: {
    provider: "openai",
    model: "gpt-4o-mini",
  },
};

export function getModelSpec(modelKey, registry = DEFAULT_MODEL_REGISTRY) {
  const key = sanitizeModelKey(modelKey);
  return registry[key] || null;
}

export function parseAllowlist(raw, fallback = ["deepseek_chat", "deepseek_reasoner", "doubao_chat"]) {
  if (!raw || typeof raw !== "string") return [...fallback];
  const list = raw
    .split(",")
    .map((item) => sanitizeModelKey(item))
    .filter(Boolean);
  return list.length ? Array.from(new Set(list)) : [...fallback];
}

export function normalizeModelKey(value, fallback = "deepseek_chat") {
  const key = sanitizeModelKey(value);
  return key || sanitizeModelKey(fallback);
}
