import { existsSync, readFileSync } from "node:fs";

function normalizeText(value, maxLength = 320) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function normalizeTags(value) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => normalizeText(item, 32)).filter(Boolean).slice(0, 10);
}

function tokenize(query = "") {
  const safe = normalizeText(query, 180).toLowerCase();
  if (!safe) return [];
  const matched = safe.match(/[\u4e00-\u9fa5]{1,}|[a-z0-9_]+/gi) || [];
  return Array.from(new Set(matched.map((item) => item.trim()).filter(Boolean))).slice(0, 10);
}

function loadTargets(filePath) {
  if (!filePath || !existsSync(filePath)) return [];

  try {
    const raw = readFileSync(filePath, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normalizeTarget(target = {}) {
  return {
    knowledgeId: normalizeText(target.knowledgeId || target.knowledge_id, 80),
    title: normalizeText(target.title, 160),
    domain: normalizeText(target.domain, 48),
    tags: normalizeTags(target.tags),
    applicability: normalizeTags(target.applicability),
    severity: normalizeText(target.severity || "normal", 32) || "normal",
    docType: normalizeText(target.docType || target.doc_type || "docx", 24) || "docx",
    documentId: normalizeText(target.documentId || target.document_id, 120),
    wikiNodeToken: normalizeText(target.wikiNodeToken || target.wiki_node_token, 120),
    scopeId: normalizeText(target.scopeId || target.scope_id, 64),
    status: normalizeText(target.status || "active", 32) || "active",
    version: Number.isFinite(Number(target.version)) ? Number(target.version) : 1,
    expiresAt: normalizeText(target.expiresAt || target.expires_at, 40),
    owner: normalizeText(target.owner, 80),
    vectorId: normalizeText(target.vectorId || target.vector_id, 120),
    sourceUrl: normalizeText(target.sourceUrl || target.source_url, 320),
  };
}

function scoreHit(hit = {}, tokens = []) {
  const searchable = `${hit.title} ${hit.summary} ${hit.content} ${(hit.tags || []).join(" ")} ${(hit.domain || "")}`.toLowerCase();
  let score = Number(hit.score || 0);
  for (const token of tokens) {
    if (hit.title.toLowerCase().includes(token)) score += 4;
    else if (hit.summary.toLowerCase().includes(token)) score += 2;
    else if (searchable.includes(token)) score += 1;
  }
  return score;
}

export function createFeishuLiveService({
  config = {},
  feishuClient = null,
  now = () => Date.now(),
} = {}) {
  const enabled = Boolean(config?.liveEnabled || config?.enabled);
  const targetsFilePath = String(config?.targetsFilePath || "").trim();
  const syncIntervalMinutes = Math.max(15, Number(config?.syncIntervalMinutes || 720));
  const cacheTtlMs = Math.max(30_000, Math.min(30 * 60_000, syncIntervalMinutes * 60 * 1000));
  const contentCache = new Map();

  function getTargets(scopeId = "") {
    const safeScopeId = normalizeText(scopeId, 64);
    return loadTargets(targetsFilePath)
      .map(normalizeTarget)
      .filter((item) => item.status === "active")
      .filter((item) => item.severity !== "high_risk")
      .filter((item) => item.documentId || item.wikiNodeToken)
      .filter((item) => !safeScopeId || item.scopeId === safeScopeId);
  }

  async function fetchLiveTarget(target) {
    const cacheKey = target.knowledgeId || target.documentId || target.wikiNodeToken;
    const currentTs = Number(now());
    const cached = contentCache.get(cacheKey);
    if (cached && cached.expiresAt > currentTs) {
      return cached.payload;
    }

    if (!feishuClient || typeof feishuClient.getTargetRawContent !== "function") {
      const error = new Error("Feishu client is not configured.");
      error.code = "FEISHU_LIVE_UNCONFIGURED";
      throw error;
    }

    const payload = await feishuClient.getTargetRawContent(target);
    const normalized = {
      id: target.knowledgeId || payload.documentId || target.documentId || target.wikiNodeToken,
      title: normalizeText(target.title || payload.title || `Feishu ${payload.documentId}`, 120),
      summary: normalizeText(payload.content, 320),
      content: normalizeText(payload.content, 4000),
      tags: target.tags,
      source_type: "feishu_live",
      scope_id: target.scopeId,
      source_url: normalizeText(payload.sourceUrl || target.sourceUrl, 320),
      updated_at: normalizeText(payload.fetchedAt, 40),
      score: 0,
      knowledge_id: target.knowledgeId,
      domain: target.domain,
      applicability: target.applicability,
      severity: target.severity,
      status: target.status,
      version: target.version,
      vector_id: target.vectorId,
      owner: target.owner,
      expires_at: target.expiresAt,
      document_id: payload.documentId || target.documentId,
      wiki_node_token: target.wikiNodeToken,
      doc_type: target.docType,
    };

    contentCache.set(cacheKey, {
      payload: normalized,
      expiresAt: currentTs + cacheTtlMs,
    });

    return normalized;
  }

  return {
    async search({ query = "", topK = 4, scopeId = "" } = {}) {
      if (!enabled) {
        return {
          used: false,
          hits: [],
          error_code: "FEISHU_LIVE_DISABLED",
        };
      }

      const targets = getTargets(scopeId);
      if (!targets.length) {
        return {
          used: false,
          hits: [],
          error_code: "FEISHU_LIVE_TARGETS_EMPTY",
        };
      }

      const tokens = tokenize(query);
      const safeTopK = Math.max(1, Math.min(8, Number(topK || 4)));
      const results = await Promise.allSettled(targets.map((target) => fetchLiveTarget(target)));
      const errors = results
        .filter((item) => item.status === "rejected")
        .map((item) => item.reason?.code || "FEISHU_LIVE_FETCH_FAILED");
      const hits = results
        .filter((item) => item.status === "fulfilled")
        .map((item) => item.value)
        .map((item) => ({
          ...item,
          score: Number((scoreHit(item, tokens) + (scopeId && item.scope_id === scopeId ? 2.5 : 0)).toFixed(2)),
        }))
        .filter((item) => item.score > 0 || !tokens.length)
        .sort((a, b) => b.score - a.score)
        .slice(0, safeTopK);

      return {
        used: hits.length > 0,
        hits,
        error_code:
          hits.length > 0
            ? null
            : errors.length === results.length
              ? errors[0] || "FEISHU_LIVE_FETCH_FAILED"
              : "FEISHU_LIVE_NO_MATCH",
      };
    },
  };
}
