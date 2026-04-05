const DEFAULT_PRESET_SCOPE = "kb_first";

const PRESET_CARDS = [
  {
    id: "ai_intro",
    category: "featured",
    sortOrder: 10,
    titleZh: "AI 助手能做什么",
    titleEn: "What this AI can do",
    userVisibleTextZh: "请介绍一下这个 AI 助手能做什么、回答边界是什么。",
    userVisibleTextEn: "Please explain what this AI assistant can do and what its answer boundaries are.",
    agentHint: "Prefer product knowledge and feature explanation over emotional support.",
    preferredSourceScope: "kb_first",
    feishuScopeId: "product_intro",
  },
  {
    id: "pregnancy_sleep",
    category: "featured",
    sortOrder: 20,
    titleZh: "孕期睡眠困扰",
    titleEn: "Pregnancy sleep concerns",
    userVisibleTextZh: "孕期总是睡不好、夜醒频繁，我应该先怎么调整？",
    userVisibleTextEn: "I keep sleeping poorly during pregnancy and wake up often. What should I adjust first?",
    agentHint: "Prefer pregnancy sleep guidance and emotional support.",
    preferredSourceScope: DEFAULT_PRESET_SCOPE,
    feishuScopeId: "pregnancy_sleep",
  },
  {
    id: "pregnancy_emotion",
    category: "featured",
    sortOrder: 30,
    titleZh: "情绪波动怎么缓解",
    titleEn: "How to ease mood swings",
    userVisibleTextZh: "孕期情绪波动很大、总是焦虑，我现在可以怎么做？",
    userVisibleTextEn: "My mood swings a lot during pregnancy and I keep feeling anxious. What can I do now?",
    agentHint: "Prefer emotional support with grounded pregnancy guidance.",
    preferredSourceScope: DEFAULT_PRESET_SCOPE,
    feishuScopeId: "pregnancy_emotion",
  },
  {
    id: "pregnancy_diet",
    category: "library",
    sortOrder: 40,
    titleZh: "孕期饮食建议",
    titleEn: "Pregnancy diet advice",
    userVisibleTextZh: "请给我一个孕期饮食建议的简要说明，优先引用知识库。",
    userVisibleTextEn: "Give me a short pregnancy diet guide and prefer knowledge-base grounded advice.",
    agentHint: "Prefer nutrition knowledge with citations.",
    preferredSourceScope: DEFAULT_PRESET_SCOPE,
    feishuScopeId: "pregnancy_diet",
  },
  {
    id: "pregnancy_exercise",
    category: "library",
    sortOrder: 50,
    titleZh: "孕期运动建议",
    titleEn: "Pregnancy exercise advice",
    userVisibleTextZh: "孕期适合做哪些低风险运动？请优先引用知识库。",
    userVisibleTextEn: "What low-risk exercises are suitable during pregnancy? Prefer knowledge-base citations.",
    agentHint: "Prefer exercise guidance and stop conditions.",
    preferredSourceScope: DEFAULT_PRESET_SCOPE,
    feishuScopeId: "pregnancy_exercise",
  },
  {
    id: "partner_support",
    category: "featured",
    sortOrder: 60,
    titleZh: "如何和伴侣沟通支持需求",
    titleEn: "How to ask partner support",
    userVisibleTextZh: "我想和伴侣沟通我的支持需求，怎么表达会更清楚？",
    userVisibleTextEn: "I want to communicate my support needs to my partner. How can I express them more clearly?",
    agentHint: "Prefer emotional support and communication framing.",
    preferredSourceScope: "local_kb",
    feishuScopeId: "partner_support",
  },
];

function normalizeText(value = "", maxLength = 140) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function normalizePreset(card = {}) {
  return {
    id: normalizeText(card.id, 64),
    category: normalizeText(card.category, 32) || "featured",
    sortOrder: Number.isFinite(Number(card.sortOrder)) ? Number(card.sortOrder) : 999,
    title: {
      zh: normalizeText(card.titleZh, 80),
      en: normalizeText(card.titleEn, 80),
    },
    userVisibleText: {
      zh: normalizeText(card.userVisibleTextZh, 180),
      en: normalizeText(card.userVisibleTextEn, 180),
    },
    agentHint: normalizeText(card.agentHint, 180),
    preferredSourceScope: normalizeText(card.preferredSourceScope, 48) || DEFAULT_PRESET_SCOPE,
    feishuScopeId: normalizeText(card.feishuScopeId, 64),
  };
}

function sortPresets(a, b) {
  return a.sortOrder - b.sortOrder;
}

export function createPromptPresetService({ cards = PRESET_CARDS } = {}) {
  const normalizedCards = Array.isArray(cards) ? cards.map(normalizePreset).filter((item) => item.id) : [];

  return {
    list({ lang = "zh", category = "" } = {}) {
      const safeCategory = normalizeText(category, 32);
      const filtered = safeCategory
        ? normalizedCards.filter((item) => item.category === safeCategory)
        : normalizedCards;

      return filtered
        .slice()
        .sort(sortPresets)
        .map((item) => ({
          id: item.id,
          category: item.category,
          title: item.title[lang === "en" ? "en" : "zh"] || item.title.zh,
          userVisibleText: item.userVisibleText[lang === "en" ? "en" : "zh"] || item.userVisibleText.zh,
          agentHint: item.agentHint,
          preferredSourceScope: item.preferredSourceScope,
          feishuScopeId: item.feishuScopeId || null,
        }));
    },

    getById(id) {
      const safeId = normalizeText(id, 64);
      return normalizedCards.find((item) => item.id === safeId) || null;
    },
  };
}
