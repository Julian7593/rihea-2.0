import { existsSync, readFileSync } from "node:fs";

const DEFAULT_TOP_K = 4;
const MAX_TOP_K = 8;

const DEFAULT_SYNC_ENTRIES = [
  {
    id: "feishu_ai_intro_001",
    title: "AI 助手简介与回答边界",
    summary: "本助手用于孕期与情绪健康场景，优先提供支持性信息、知识解释和应用功能引导，不替代医生诊断或治疗。",
    content:
      "AI 助手主要覆盖情绪支持、睡眠/饮食/运动建议、应用功能说明、内容推荐和风险升级提醒。遇到高风险表达时会优先走安全升级链路。",
    tags: ["ai简介", "回答边界", "产品能力"],
    scopeId: "product_intro",
    sourceUrl: "https://feishu.example/product_intro",
    updatedAt: "2026-04-01T09:00:00.000Z",
    accessScope: "configured_pages",
    documentId: "",
  },
  {
    id: "feishu_app_001",
    title: "App 功能说明与入口导航",
    summary: "用于回答打卡、CBT、内容推荐、AI 助手、伴侣同步和设置入口等产品功能问题。",
    content:
      "功能说明优先给清晰路径，再解释用途和适用场景。打卡适合快速记录状态，CBT 适合结构化练习，内容推荐适合先看资料，AI 助手适合先判断下一步，伴侣同步适合建立协作支持。",
    tags: ["功能", "入口", "导航", "打卡", "CBT", "伴侣同步", "AI助手", "内容推荐", "设置"],
    scopeId: "app_features",
    sourceUrl: "https://feishu.example/app_features",
    updatedAt: "2026-04-03T10:00:00.000Z",
    accessScope: "configured_pages",
    documentId: "",
  },
  {
    id: "feishu_app_checkin_001",
    title: "打卡入口与用途说明",
    summary: "打卡入口通常从首页进入，适合快速记录情绪、睡眠和当天状态变化。",
    content:
      "如果用户问打卡在哪里，优先回答：首页 -> 今日记录或每日打卡区域。打卡适合快速记录状态，不想一上来展开很多对话时优先使用。打卡之后可继续看趋势变化或进入 AI 助手、CBT。",
    tags: ["打卡", "首页", "记录", "入口", "checkin"],
    scopeId: "app_features",
    sourceUrl: "https://feishu.example/app_features/checkin",
    updatedAt: "2026-04-03T10:05:00.000Z",
    accessScope: "configured_pages",
    documentId: "",
  },
  {
    id: "feishu_app_cbt_001",
    title: "CBT 中心入口与使用时机",
    summary: "CBT 中心通常从关怀页进入，适合做结构化练习和梳理反复困扰的情绪或想法。",
    content:
      "如果用户问 CBT 怎么用，优先回答：进入关怀页 -> 打开 CBT 中心 -> 查看练习模块和进度。CBT 适合当用户已经知道自己被某个想法或情绪困住，想做更结构化的练习时使用。",
    tags: ["CBT", "关怀", "练习", "入口", "认知"],
    scopeId: "app_features",
    sourceUrl: "https://feishu.example/app_features/cbt",
    updatedAt: "2026-04-03T10:10:00.000Z",
    accessScope: "configured_pages",
    documentId: "",
  },
  {
    id: "feishu_app_partner_001",
    title: "伴侣同步入口与绑定路径",
    summary: "伴侣同步通常从“我的”页进入，用于邀请伴侣、建立绑定和管理共享级别。",
    content:
      "如果用户问伴侣同步在哪绑定，优先回答：进入“我的”页 -> 打开伴侣同步中心 -> 创建邀请并完成绑定 -> 设置共享级别。这个功能适合把重点状态和支持任务更清楚地共享给伴侣。",
    tags: ["伴侣", "绑定", "共享", "我的", "partner"],
    scopeId: "app_features",
    sourceUrl: "https://feishu.example/app_features/partner_sync",
    updatedAt: "2026-04-03T10:15:00.000Z",
    accessScope: "configured_pages",
    documentId: "",
  },
  {
    id: "feishu_app_content_001",
    title: "内容推荐入口与适用场景",
    summary: "内容推荐适合先看资料、先理解方法，再决定下一步做什么。",
    content:
      "如果用户问推荐内容在哪看或现在该看什么，优先说明可以进入相关主题内容区，按情绪、睡眠、饮食等主题筛选。内容推荐更适合想先阅读、先理解方法，再决定下一步的人。",
    tags: ["内容推荐", "文章", "课程", "入口", "内容"],
    scopeId: "app_features",
    sourceUrl: "https://feishu.example/app_features/content",
    updatedAt: "2026-04-03T10:20:00.000Z",
    accessScope: "configured_pages",
    documentId: "",
  },
  {
    id: "feishu_app_ai_001",
    title: "AI 助手与打卡 / CBT 的分工",
    summary: "AI 助手适合先说清问题和判断下一步；打卡适合记录；CBT 适合结构化练习。",
    content:
      "如果用户问 AI 助手和打卡、CBT 有什么区别，优先回答：AI 助手是对话入口，用来判断当前问题和下一步；打卡是记录入口；CBT 是结构化练习入口；内容推荐是阅读学习入口。",
    tags: ["AI助手", "打卡", "CBT", "区别", "功能分工"],
    scopeId: "app_features",
    sourceUrl: "https://feishu.example/app_features/ai_assistant",
    updatedAt: "2026-04-03T10:25:00.000Z",
    accessScope: "configured_pages",
    documentId: "",
  },
  {
    id: "feishu_app_settings_001",
    title: "设置与个人资料入口",
    summary: "提醒、隐私、账号资料等设置通常从“我的”页进入。",
    content:
      "如果用户问设置、提醒或隐私在哪里，优先回答：进入“我的”页 -> 查看提醒、隐私或个人资料设置。这个入口适合管理提醒节奏、账号资料和伴侣共享设置。",
    tags: ["设置", "提醒", "隐私", "个人资料", "我的"],
    scopeId: "app_features",
    sourceUrl: "https://feishu.example/app_features/settings",
    updatedAt: "2026-04-03T10:30:00.000Z",
    accessScope: "configured_pages",
    documentId: "",
  },
  {
    id: "feishu_sleep_001",
    title: "孕期睡眠支持知识卡",
    summary: "优先建议睡眠卫生、夜醒应对、放松流程和观察点，不给药物方案。",
    content:
      "对于夜醒和入睡困难，先建议低风险的小步骤，如慢呼吸、睡前流程、记录触发因素和次日观察。若伴随明显异常不适，应提示线下评估。",
    tags: ["睡眠", "夜醒", "失眠", "孕期"],
    scopeId: "pregnancy_sleep",
    sourceUrl: "https://feishu.example/pregnancy_sleep",
    updatedAt: "2026-04-02T10:30:00.000Z",
    accessScope: "configured_pages",
    documentId: "",
  },
  {
    id: "feishu_emotion_001",
    title: "孕期情绪支持手册",
    summary: "先承接感受，再给 1-3 条微行动建议，并可引导使用应用内打卡和 CBT 功能。",
    content:
      "情绪支持回答遵循 acknowledge-suggest-guide 结构，避免空泛安慰、避免绝对承诺，必要时提示联系支持者并观察风险变化。",
    tags: ["情绪", "焦虑", "CBT", "支持"],
    scopeId: "pregnancy_emotion",
    sourceUrl: "https://feishu.example/pregnancy_emotion",
    updatedAt: "2026-04-01T17:00:00.000Z",
    accessScope: "configured_pages",
    documentId: "",
  },
  {
    id: "feishu_diet_001",
    title: "孕期饮食说明",
    summary: "饮食建议优先基于孕周和安全边界，给替代方案，不输出处方化营养结论。",
    content:
      "饮食回答强调均衡、禁忌提醒、补充说明和可执行替代方案。若涉及个体医疗禁忌，应鼓励咨询专业医生。",
    tags: ["饮食", "营养", "孕周"],
    scopeId: "pregnancy_diet",
    sourceUrl: "https://feishu.example/pregnancy_diet",
    updatedAt: "2026-04-02T11:00:00.000Z",
    accessScope: "configured_pages",
    documentId: "",
  },
];

function normalizeText(value, maxLength = 320) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function normalizeTags(value) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => normalizeText(item, 32)).filter(Boolean).slice(0, 10);
}

function tokenize(query) {
  const safe = normalizeText(query, 180).toLowerCase();
  if (!safe) return [];
  const matched = safe.match(/[\u4e00-\u9fa5]{1,}|[a-z0-9_]+/gi) || [];
  return Array.from(new Set(matched.map((item) => item.trim()).filter(Boolean))).slice(0, 10);
}

function scoreEntry(entry, { tokens, scopeId, tags }) {
  const searchable = `${entry.title} ${entry.summary} ${entry.content} ${entry.tags.join(" ")}`.toLowerCase();
  let score = 0;

  for (const token of tokens) {
    if (entry.title.toLowerCase().includes(token)) score += 4;
    else if (entry.summary.toLowerCase().includes(token)) score += 3;
    else if (searchable.includes(token)) score += 1;
  }

  for (const tag of tags) {
    if (entry.tags.some((item) => item.toLowerCase().includes(String(tag).toLowerCase()))) score += 2;
  }

  if (scopeId && entry.scopeId === scopeId) score += 2.5;
  return score;
}

function normalizeEntry(entry = {}) {
  return {
    id: normalizeText(entry.id, 80),
    title: normalizeText(entry.title, 120),
    summary: normalizeText(entry.summary, 320),
    content: normalizeText(entry.content, 500),
    tags: normalizeTags(entry.tags),
    scopeId: normalizeText(entry.scopeId, 64),
    sourceUrl: normalizeText(entry.sourceUrl || entry.source_url, 320),
    updatedAt: normalizeText(entry.updatedAt || entry.updated_at, 40),
    accessScope: normalizeText(entry.accessScope || entry.access_scope, 64) || "configured_pages",
    documentId: normalizeText(entry.documentId || entry.document_id, 120),
    domain: normalizeText(entry.domain, 48),
    applicability: normalizeTags(entry.applicability),
    severity: normalizeText(entry.severity || "normal", 32) || "normal",
    status: normalizeText(entry.status || "active", 32) || "active",
    version: Number.isFinite(Number(entry.version)) ? Number(entry.version) : 1,
    vectorId: normalizeText(entry.vectorId || entry.vector_id, 120),
    owner: normalizeText(entry.owner, 80),
    expiresAt: normalizeText(entry.expiresAt || entry.expires_at, 40),
    docType: normalizeText(entry.docType || entry.doc_type || "docx", 24) || "docx",
    wikiNodeToken: normalizeText(entry.wikiNodeToken || entry.wiki_node_token, 120),
  };
}

function loadEntriesFromFile(filePath) {
  if (!filePath || !existsSync(filePath)) return [];

  try {
    const raw = readFileSync(filePath, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function createFeishuSyncIndex({ entries = null, filePath = "" } = {}) {
  function getEntries() {
    const fileEntries = loadEntriesFromFile(filePath);
    const sourceEntries = fileEntries.length > 0 ? fileEntries : Array.isArray(entries) && entries.length > 0 ? entries : DEFAULT_SYNC_ENTRIES;
    return sourceEntries.map(normalizeEntry).filter((item) => item.id);
  }

  return {
    size() {
      return getEntries().length;
    },

    listScopes() {
      const normalizedEntries = getEntries();
      return Array.from(
        new Map(
          normalizedEntries.map((item) => [
            item.scopeId,
            {
              id: item.scopeId,
              title: item.scopeId,
              accessScope: item.accessScope,
            },
          ])
        ).values()
      ).filter((item) => item.id);
    },

    search({ query = "", topK = DEFAULT_TOP_K, scopeId = "", tags = [] } = {}) {
      const normalizedEntries = getEntries();
      const tokens = tokenize(query);
      const safeTopK = Number.isFinite(Number(topK))
        ? Math.max(1, Math.min(MAX_TOP_K, Number(topK)))
        : DEFAULT_TOP_K;
      const safeScopeId = normalizeText(scopeId, 64);
      const safeTags = normalizeTags(tags);

      const hits = normalizedEntries
        .filter((entry) => entry.status === "active")
        .filter((entry) => entry.severity !== "high_risk")
        .map((entry) => ({
          entry,
          score: scoreEntry(entry, {
            tokens,
            scopeId: safeScopeId,
            tags: safeTags,
          }),
        }))
        .filter((item) => item.score > 0 || (!tokens.length && !safeScopeId))
        .sort((a, b) => b.score - a.score)
        .slice(0, safeTopK)
        .map((item) => ({
          id: item.entry.id,
          title: item.entry.title,
          summary: item.entry.summary,
          content: item.entry.content,
          tags: item.entry.tags,
          source_type: "feishu_sync",
          scope_id: item.entry.scopeId,
          source_url: item.entry.sourceUrl,
          updated_at: item.entry.updatedAt,
          access_scope: item.entry.accessScope,
          document_id: item.entry.documentId,
          domain: item.entry.domain,
          applicability: item.entry.applicability,
          severity: item.entry.severity,
          status: item.entry.status,
          version: item.entry.version,
          vector_id: item.entry.vectorId,
          owner: item.entry.owner,
          expires_at: item.entry.expiresAt,
          doc_type: item.entry.docType,
          wiki_node_token: item.entry.wikiNodeToken,
          score: Number(item.score.toFixed(2)),
        }));

      return {
        query: normalizeText(query, 180),
        total: hits.length,
        hits,
      };
    },
  };
}
