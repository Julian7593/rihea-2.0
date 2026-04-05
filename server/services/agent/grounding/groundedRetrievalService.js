const DEFAULT_TOP_K = 4;
const DEFAULT_STALE_AFTER_MINUTES = 1440;
const FRESH_KEYWORDS = ["最新", "更新", "最近", "当前版本", "recent", "latest", "update", "new"];

function normalizeText(value, maxLength = 240) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function normalizeCitation(item = {}, fallbackSourceType = "local_kb") {
  const sourceType = normalizeText(item.source_type || item.sourceType || item.source || fallbackSourceType, 32);
  return {
    id: normalizeText(item.id, 80),
    title: normalizeText(item.title, 140),
    snippet: normalizeText(item.summary || item.snippet || item.content, 240),
    url: normalizeText(item.source_url || item.url, 320),
    source_type: sourceType || fallbackSourceType,
    scope_id: normalizeText(item.scope_id || item.scopeId, 64),
    updated_at: normalizeText(item.updated_at || item.updatedAt, 40),
    score: Number.isFinite(Number(item.score)) ? Number(item.score) : 0,
    tags: Array.isArray(item.tags) ? item.tags.slice(0, 6) : [],
    domain: normalizeText(item.domain, 48),
    severity: normalizeText(item.severity, 32),
    knowledge_id: normalizeText(item.knowledge_id || item.knowledgeId, 80),
  };
}

function uniqueByKey(items = [], keySelector) {
  const seen = new Set();
  const list = [];
  for (const item of items) {
    const key = keySelector(item);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    list.push(item);
  }
  return list;
}

function shouldUseWeb({ message, citations = [], sourcePreference = "" }) {
  const safe = String(message || "").toLowerCase();
  if (sourcePreference === "web_first") return true;
  if (safe.includes("最新") || safe.includes("更新") || safe.includes("recent") || safe.includes("latest")) return true;
  return citations.length === 0;
}

function containsFreshKeyword(text = "") {
  const safe = String(text || "").toLowerCase();
  return FRESH_KEYWORDS.some((item) => safe.includes(String(item).toLowerCase()));
}

function parseTimestamp(value = "") {
  const ts = Date.parse(String(value || ""));
  return Number.isFinite(ts) ? ts : null;
}

function buildKbFreshness({ citations = [], staleAfterMinutes = DEFAULT_STALE_AFTER_MINUTES, checkedLive = false } = {}) {
  const feishuLike = citations.filter((item) => item.source_type === "feishu_sync" || item.source_type === "feishu_live");
  const timestamps = feishuLike.map((item) => parseTimestamp(item.updated_at)).filter((item) => item !== null);
  const newestTs = timestamps.length ? Math.max(...timestamps) : null;
  const ageMinutes = newestTs ? Math.max(0, Math.round((Date.now() - newestTs) / 60000)) : null;
  let status = "unknown";
  if (!feishuLike.length) status = "missing";
  else if (ageMinutes !== null && ageMinutes <= staleAfterMinutes) status = "fresh";
  else if (ageMinutes !== null) status = "stale";

  return {
    status,
    checked_live: Boolean(checkedLive),
    newest_updated_at: newestTs ? new Date(newestTs).toISOString() : null,
    age_minutes: ageMinutes,
    stale_after_minutes: staleAfterMinutes,
  };
}

function buildGroundingSummary(citations = []) {
  const sourceCounts = citations.reduce((acc, item) => {
    const key = item.source_type || "local_kb";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return {
    total_citations: citations.length,
    source_breakdown: sourceCounts,
    primary_source: citations[0]?.source_type || null,
  };
}

function buildConfidence(citations = [], webUsed = false) {
  if (citations.length >= 3 && !webUsed) return 0.9;
  if (citations.length >= 2) return 0.82;
  if (citations.length >= 1) return webUsed ? 0.68 : 0.75;
  return 0.42;
}

function buildFallbackReason(citations = [], webUsed = false, webErrorCode = null) {
  if (citations.length > 0) return null;
  if (webUsed && webErrorCode) return `web_search_${String(webErrorCode).toLowerCase()}`;
  return "knowledge_not_found";
}

function preferSourceOrder(sourceType = "") {
  const map = {
    local_kb: 1,
    feishu_sync: 2,
    feishu_live: 3,
    web: 4,
  };
  return map[sourceType] || 99;
}

export function createGroundedRetrievalService({ config = {} } = {}) {
  const configuredStaleMinutes = Number(config?.staleAfterMinutes || 0);
  const syncIntervalMinutes = Number(config?.syncIntervalMinutes || 0);
  const staleAfterMinutes = Math.max(
    60,
    configuredStaleMinutes > 0
      ? configuredStaleMinutes
      : syncIntervalMinutes > 0
        ? syncIntervalMinutes * 2
        : DEFAULT_STALE_AFTER_MINUTES
  );

  return {
    async retrieve({
      message,
      lang,
      topic,
      classification,
      promptSignals,
      sourcePreference = "kb_first",
      feishuScopeId = "",
      runTool,
      clientContext = {},
      webSearchAllowed = true,
    }) {
      const citations = [];
      const usedSources = [];
      const safeTopK = DEFAULT_TOP_K;
      const latestIntent = containsFreshKeyword(message);

      const localResult = await runTool("search_local_kb", {
        query: message,
        pregnancyWeek: String(promptSignals?.pregnancyWeek || ""),
        category: topic === "general" ? "" : topic,
        topK: safeTopK,
      });
      const localHits = localResult.ok && Array.isArray(localResult.data?.hits) ? localResult.data.hits : [];
      citations.push(...localHits.map((item) => normalizeCitation(item, "local_kb")));
      if (localHits.length > 0) usedSources.push("local_kb");

      const feishuSyncResult = await runTool("search_feishu_sync", {
        query: message,
        scopeId: feishuScopeId || clientContext?.feishuScopeId || "",
        tags: Array.isArray(classification?.secondary_intents) ? classification.secondary_intents : [],
        topK: safeTopK,
      });
      const feishuSyncHits = feishuSyncResult.ok && Array.isArray(feishuSyncResult.data?.hits)
        ? feishuSyncResult.data.hits
        : [];
      citations.push(...feishuSyncHits.map((item) => normalizeCitation(item, "feishu_sync")));
      if (feishuSyncHits.length > 0) usedSources.push("feishu_sync");

      const syncFreshness = buildKbFreshness({
        citations: feishuSyncHits.map((item) => normalizeCitation(item, "feishu_sync")),
        staleAfterMinutes,
        checkedLive: false,
      });
      const shouldUseFeishuLive =
        sourcePreference === "feishu_first" ||
        feishuSyncHits.length === 0 ||
        syncFreshness.status === "stale" ||
        latestIntent;

      let feishuLiveMeta = {
        used: false,
        error_code: null,
      };

      if (shouldUseFeishuLive) {
        const feishuLiveResult = await runTool("search_feishu_live", {
          query: message,
          scopeId: feishuScopeId || clientContext?.feishuScopeId || "",
          topK: safeTopK,
        });
        const feishuLiveHits = feishuLiveResult.ok && Array.isArray(feishuLiveResult.data?.hits)
          ? feishuLiveResult.data.hits
          : [];
        citations.push(...feishuLiveHits.map((item) => normalizeCitation(item, "feishu_live")));
        if (feishuLiveHits.length > 0) usedSources.push("feishu_live");
        feishuLiveMeta = {
          used: feishuLiveHits.length > 0,
          error_code: feishuLiveResult.ok ? feishuLiveResult.data?.error_code || null : feishuLiveResult.error || "FEISHU_LIVE_FAILED",
        };
      }

      let webMeta = null;
      const canUseWebNow =
        webSearchAllowed &&
        (citations.length === 0 ||
          shouldUseWeb({ message, citations, sourcePreference }) ||
          (latestIntent && !usedSources.includes("feishu_live")));
      if (canUseWebNow) {
        const webResult = await runTool("search_web", {
          query: message,
          lang,
          topK: 5,
        });
        if (webResult.ok) {
          const webHits = Array.isArray(webResult.data?.sources) ? webResult.data.sources : [];
          citations.push(
            ...webHits.map((item) =>
              normalizeCitation(
                {
                  ...item,
                  source_type: "web",
                  source_url: item.url,
                  summary: item.snippet,
                  updated_at: item.published_at,
                },
                "web"
              )
            )
          );
          if (webHits.length > 0) usedSources.push("web");
          webMeta = webResult.data?.search_meta || null;
        } else {
          webMeta = {
            used: false,
            error_code: webResult.error || "WEB_SEARCH_FAILED",
          };
        }
      }

      const normalizedCitations = uniqueByKey(citations, (item) => item.url || item.id)
        .sort((left, right) => {
          const sourceOrder = preferSourceOrder(left.source_type) - preferSourceOrder(right.source_type);
          if (sourceOrder !== 0) return sourceOrder;
          return Number(right.score || 0) - Number(left.score || 0);
        })
        .slice(0, 6);

      const normalizedUsedSources = Array.from(new Set(usedSources));
      const groundingSummary = buildGroundingSummary(normalizedCitations);
      const confidence = buildConfidence(normalizedCitations, normalizedUsedSources.includes("web"));
      const kbFreshness = buildKbFreshness({
        citations: normalizedCitations,
        staleAfterMinutes,
        checkedLive: shouldUseFeishuLive,
      });

      return {
        citations: normalizedCitations,
        usedSources: normalizedUsedSources,
        groundingSummary,
        confidence,
        fallbackReason:
          buildFallbackReason(normalizedCitations, normalizedUsedSources.includes("web"), webMeta?.error_code || null) ||
          (shouldUseFeishuLive && feishuLiveMeta.error_code ? `feishu_live_${String(feishuLiveMeta.error_code).toLowerCase()}` : null),
        kbFreshness,
        feishuLiveMeta,
        webMeta,
        semanticCandidates: [],
      };
    },
  };
}
