function normalizeText(value, maxLength = 300) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function toHostname(url) {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return "";
  }
}

function normalizeAllowlist(allowlist = []) {
  return Array.from(
    new Set(
      (Array.isArray(allowlist) ? allowlist : [])
        .map((item) => String(item || "").trim().toLowerCase())
        .filter(Boolean)
    )
  );
}

function isDomainAllowed(hostname, allowlist = []) {
  const host = String(hostname || "").toLowerCase();
  if (!host) return false;
  return allowlist.some((domain) => host === domain || host.endsWith(`.${domain}`));
}

function timeoutSignal(timeoutMs = 5000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return {
    signal: controller.signal,
    clear: () => clearTimeout(timer),
  };
}

function normalizeSerperSource(item = {}) {
  const url = normalizeText(item?.link || "", 600);
  const domain = toHostname(url);
  return {
    title: normalizeText(item?.title || "", 180),
    url,
    snippet: normalizeText(item?.snippet || "", 260),
    domain,
    published_at: normalizeText(item?.date || "", 40) || undefined,
  };
}

function normalizeZhipuSource(item = {}) {
  const url = normalizeText(item?.link || item?.url || "", 600);
  const domain = toHostname(url);
  return {
    title: normalizeText(item?.title || "", 180),
    url,
    snippet: normalizeText(item?.content || item?.snippet || "", 260),
    domain,
    published_at: normalizeText(item?.publish_date || item?.published_at || "", 40) || undefined,
  };
}

function dedupeSources(sources = []) {
  const seen = new Set();
  const list = [];
  for (const item of sources) {
    const url = String(item?.url || "");
    if (!url || seen.has(url)) continue;
    seen.add(url);
    list.push(item);
  }
  return list;
}

function pickCustomDomainFilter(allowlist = [], domains = []) {
  const customDomains = normalizeAllowlist(domains);
  if (customDomains.length > 0) {
    for (const domain of customDomains) {
      if (allowlist.includes(domain)) return domain;
    }
  }
  return "";
}

function filterSourcesByAllowlist(rawItems = [], normalizeSource, allowlist = [], topK = 5) {
  const normalized = rawItems
    .map((item) => normalizeSource(item))
    .filter((item) => item.url && item.title && isDomainAllowed(item.domain, allowlist));

  return dedupeSources(normalized).slice(0, topK);
}

async function requestZhipuSearch({
  query,
  count,
  timeout,
  apiKey,
  baseUrl,
  fetchImpl,
  zhipuEngine,
  zhipuSearchIntent,
  zhipuContentSize,
  zhipuRecencyFilter,
  userId,
  requestId,
  domainFilter = "",
}) {
  const payload = {
    search_query: query,
    search_engine: zhipuEngine,
    search_intent: Boolean(zhipuSearchIntent),
    search_recency_filter: zhipuRecencyFilter,
    count,
    content_size: zhipuContentSize,
  };
  if (domainFilter) payload.search_domain_filter = domainFilter;
  if (userId) payload.user_id = String(userId).slice(0, 64);
  if (requestId) payload.request_id = String(requestId).slice(0, 64);

  const response = await fetchImpl(`${baseUrl}/web_search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
    signal: timeout.signal,
  });

  if (!response.ok) {
    return {
      ok: false,
      rawItems: [],
      error_code: `HTTP_${response.status}`,
    };
  }

  const body = await response.json().catch(() => ({}));
  return {
    ok: true,
    rawItems: Array.isArray(body?.search_result) ? body.search_result : [],
    error_code: null,
  };
}

async function searchBySerper({
  query,
  lang,
  topK,
  timeoutMs,
  apiKey,
  baseUrl,
  allowlist,
  fetchImpl,
}) {
  const timeout = timeoutSignal(timeoutMs);
  const startedAt = Date.now();
  try {
    const response = await fetchImpl(`${baseUrl}/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
      body: JSON.stringify({
        q: query,
        gl: lang === "en" ? "us" : "cn",
        hl: lang === "en" ? "en" : "zh-cn",
        num: Math.max(1, Math.min(10, Number(topK || 5))),
      }),
      signal: timeout.signal,
    });

    if (!response.ok) {
      return {
        used: false,
        sources: [],
        error_code: `HTTP_${response.status}`,
        latency_ms: Date.now() - startedAt,
      };
    }

    const payload = await response.json().catch(() => ({}));
    const rawItems = Array.isArray(payload?.organic) ? payload.organic : [];
    const normalized = rawItems
      .map((item) => normalizeSerperSource(item))
      .filter((item) => item.url && item.title && isDomainAllowed(item.domain, allowlist));
    const deduped = dedupeSources(normalized).slice(0, topK);

    return {
      used: deduped.length > 0,
      sources: deduped,
      error_code: deduped.length > 0 ? null : "NO_ALLOWED_SOURCES",
      latency_ms: Date.now() - startedAt,
    };
  } catch (error) {
    return {
      used: false,
      sources: [],
      error_code: error?.name === "AbortError" ? "TIMEOUT" : "REQUEST_FAILED",
      latency_ms: Date.now() - startedAt,
    };
  } finally {
    timeout.clear();
  }
}

async function searchByZhipu({
  query,
  topK,
  timeoutMs,
  apiKey,
  baseUrl,
  allowlist,
  domains,
  fetchImpl,
  zhipuEngine = "search_std",
  zhipuSearchIntent = false,
  zhipuContentSize = "medium",
  zhipuRecencyFilter = "noLimit",
  userId = "",
  requestId = "",
}) {
  const timeout = timeoutSignal(timeoutMs);
  const startedAt = Date.now();
  try {
    const normalizedTopK = Math.max(1, Math.min(10, Number(topK || 5)));
    const customDomainFilter = pickCustomDomainFilter(allowlist, domains);
    const initialSearch = await requestZhipuSearch({
      query,
      count: normalizedTopK,
      timeout,
      apiKey,
      baseUrl,
      fetchImpl,
      zhipuEngine,
      zhipuSearchIntent,
      zhipuContentSize,
      zhipuRecencyFilter,
      userId,
      requestId,
      domainFilter: customDomainFilter,
    });

    if (!initialSearch.ok) {
      return {
        used: false,
        sources: [],
        error_code: initialSearch.error_code,
        latency_ms: Date.now() - startedAt,
      };
    }

    let deduped = filterSourcesByAllowlist(
      initialSearch.rawItems,
      normalizeZhipuSource,
      allowlist,
      normalizedTopK
    );

    const canFallbackByDomain = !customDomainFilter && deduped.length < normalizedTopK && allowlist.length > 1;
    if (canFallbackByDomain) {
      for (const domain of allowlist) {
        const domainSearch = await requestZhipuSearch({
          query,
          count: Math.min(3, normalizedTopK),
          timeout,
          apiKey,
          baseUrl,
          fetchImpl,
          zhipuEngine,
          zhipuSearchIntent,
          zhipuContentSize,
          zhipuRecencyFilter,
          userId,
          requestId,
          domainFilter: domain,
        });
        if (!domainSearch.ok) continue;

        const merged = dedupeSources([
          ...deduped,
          ...filterSourcesByAllowlist(domainSearch.rawItems, normalizeZhipuSource, allowlist, normalizedTopK),
        ]);
        deduped = merged.slice(0, normalizedTopK);
        if (deduped.length >= normalizedTopK) break;
      }
    }

    return {
      used: deduped.length > 0,
      sources: deduped,
      error_code: deduped.length > 0 ? null : "NO_ALLOWED_SOURCES",
      latency_ms: Date.now() - startedAt,
    };
  } catch (error) {
    return {
      used: false,
      sources: [],
      error_code: error?.name === "AbortError" ? "TIMEOUT" : "REQUEST_FAILED",
      latency_ms: Date.now() - startedAt,
    };
  } finally {
    timeout.clear();
  }
}

export function createWebSearchService({
  config = {},
  fetchImpl = fetch,
} = {}) {
  const enabled = Boolean(config?.enabled);
  const provider = normalizeText(config?.provider || "serper", 32).toLowerCase() || "serper";
  const apiKey = normalizeText(config?.apiKey || "", 256);
  const configuredTimeoutMs = Number.isFinite(Number(config?.timeoutMs)) ? Math.max(1000, Number(config.timeoutMs)) : 5000;
  const timeoutMs = provider === "zhipu" ? Math.max(10000, configuredTimeoutMs) : configuredTimeoutMs;
  const topKDefault = Number.isFinite(Number(config?.topK)) ? Math.max(1, Math.min(10, Number(config.topK))) : 5;
  const baseUrl = normalizeText(config?.serperBaseUrl || "https://google.serper.dev", 200).replace(/\/$/, "");
  const zhipuBaseUrl = normalizeText(config?.zhipuBaseUrl || "https://open.bigmodel.cn/api/paas/v4", 200).replace(/\/$/, "");
  const zhipuEngine = normalizeText(config?.zhipuEngine || "search_std", 32) || "search_std";
  const zhipuContentSize = normalizeText(config?.zhipuContentSize || "medium", 16) || "medium";
  const zhipuRecencyFilter = normalizeText(config?.zhipuRecencyFilter || "noLimit", 32) || "noLimit";
  const zhipuSearchIntent = Boolean(config?.zhipuSearchIntent);
  const allowlist = normalizeAllowlist(config?.allowlist || []);

  return {
    getConfig() {
      return {
        enabled,
        provider,
        timeoutMs,
        topKDefault,
        allowlist,
      };
    },

    async search({ query = "", lang = "zh", topK = topKDefault, domains = [], userId = "", requestId = "" } = {}) {
      const safeQuery = normalizeText(query, 220);
      if (!enabled) {
        return {
          used: false,
          sources: [],
          query: safeQuery,
          provider,
          latency_ms: 0,
          error_code: "WEB_SEARCH_DISABLED",
        };
      }

      if (!safeQuery) {
        return {
          used: false,
          sources: [],
          query: safeQuery,
          provider,
          latency_ms: 0,
          error_code: "EMPTY_QUERY",
        };
      }

      if (!apiKey) {
        return {
          used: false,
          sources: [],
          query: safeQuery,
          provider,
          latency_ms: 0,
          error_code: "WEB_SEARCH_API_KEY_MISSING",
        };
      }

      const inputDomains = normalizeAllowlist(domains);
      const effectiveAllowlist = inputDomains.length
        ? allowlist.filter((domain) => inputDomains.includes(domain))
        : allowlist;
      const filteredAllowlist = effectiveAllowlist.length ? effectiveAllowlist : allowlist;

      if (!filteredAllowlist.length) {
        return {
          used: false,
          sources: [],
          query: safeQuery,
          provider,
          latency_ms: 0,
          error_code: "ALLOWLIST_EMPTY",
        };
      }

      if (!["serper", "zhipu"].includes(provider)) {
        return {
          used: false,
          sources: [],
          query: safeQuery,
          provider,
          latency_ms: 0,
          error_code: "PROVIDER_UNSUPPORTED",
        };
      }
      const normalizedTopK = Number.isFinite(Number(topK)) ? Math.max(1, Math.min(10, Number(topK))) : topKDefault;

      const result =
        provider === "zhipu"
          ? await searchByZhipu({
              query: safeQuery,
              topK: normalizedTopK,
              timeoutMs,
              apiKey,
              baseUrl: zhipuBaseUrl,
              allowlist: filteredAllowlist,
              domains: inputDomains,
              fetchImpl,
              zhipuEngine,
              zhipuSearchIntent,
              zhipuContentSize,
              zhipuRecencyFilter,
              userId,
              requestId,
            })
          : await searchBySerper({
              query: safeQuery,
              lang: lang === "en" ? "en" : "zh",
              topK: normalizedTopK,
              timeoutMs,
              apiKey,
              baseUrl,
              allowlist: filteredAllowlist,
              fetchImpl,
            });

      return {
        used: Boolean(result.used),
        sources: Array.isArray(result.sources) ? result.sources : [],
        query: safeQuery,
        provider,
        latency_ms: Number(result.latency_ms || 0),
        error_code: result.error_code || null,
      };
    },
  };
}
