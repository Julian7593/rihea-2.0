function normalizeText(value, maxLength = 240) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function normalizeUrl(url = "") {
  return String(url || "").trim().replace(/\s+/g, "").slice(0, 600);
}

function createError(code, message, extra = {}) {
  const error = new Error(message);
  error.code = code;
  Object.assign(error, extra);
  return error;
}

async function parseJson(response) {
  const text = await response.text();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch (error) {
    throw createError("FEISHU_INVALID_JSON", "Feishu API returned non-JSON content.", {
      status: response.status,
      body: text.slice(0, 400),
      cause: error,
    });
  }
}

async function requestJson(fetchImpl, url, { method = "GET", headers = {}, body } = {}) {
  const response = await fetchImpl(url, {
    method,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await parseJson(response);
  const logId = response.headers?.get?.("x-tt-logid") || response.headers?.get?.("X-Tt-Logid") || "";

  if (!response.ok) {
    throw createError("FEISHU_HTTP_ERROR", `Feishu API request failed with status ${response.status}.`, {
      status: response.status,
      payload: json,
      requestUrl: url,
      logId,
    });
  }

  if (json?.code && json.code !== 0) {
    throw createError("FEISHU_API_ERROR", normalizeText(json?.msg || "Feishu API returned an error.", 240), {
      status: response.status,
      payload: json,
      requestUrl: url,
      logId,
    });
  }

  if (json && typeof json === "object" && Object.prototype.hasOwnProperty.call(json, "data")) {
    return json?.data || {};
  }

  return json || {};
}

function normalizeTarget(target = {}) {
  return {
    knowledgeId: normalizeText(target.knowledgeId || target.knowledge_id, 80),
    title: normalizeText(target.title, 160),
    domain: normalizeText(target.domain, 48),
    tags: Array.isArray(target.tags) ? target.tags.map((item) => normalizeText(item, 40)).filter(Boolean).slice(0, 12) : [],
    applicability: Array.isArray(target.applicability)
      ? target.applicability.map((item) => normalizeText(item, 40)).filter(Boolean).slice(0, 8)
      : [],
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
    sourceUrl: normalizeUrl(target.sourceUrl || target.source_url),
  };
}

function buildDocumentUrl(baseUrl, documentId) {
  const safeDocumentId = normalizeText(documentId, 120);
  if (!safeDocumentId) return "";
  const domain = String(baseUrl || "https://open.feishu.cn")
    .replace("https://open.", "https://")
    .replace(/\/$/, "");
  return `${domain}/docx/${encodeURIComponent(safeDocumentId)}`;
}

export function createFeishuClient({
  appId = "",
  appSecret = "",
  baseUrl = "https://open.feishu.cn",
  fetchImpl = globalThis.fetch,
  now = () => Date.now(),
} = {}) {
  if (typeof fetchImpl !== "function") {
    throw createError("FEISHU_FETCH_UNAVAILABLE", "Global fetch is unavailable in the current runtime.");
  }

  const safeBaseUrl = String(baseUrl || "https://open.feishu.cn").replace(/\/$/, "");
  const credentials = {
    appId: String(appId || "").trim(),
    appSecret: String(appSecret || "").trim(),
  };
  let tokenCache = {
    value: "",
    expiresAt: 0,
  };

  async function getTenantAccessToken({ forceRefresh = false } = {}) {
    if (!credentials.appId || !credentials.appSecret) {
      throw createError("FEISHU_CREDENTIALS_MISSING", "Feishu App ID or App Secret is missing.");
    }

    const nowMs = Number(now());
    if (!forceRefresh && tokenCache.value && tokenCache.expiresAt - 60_000 > nowMs) {
      return tokenCache.value;
    }

    const data = await requestJson(fetchImpl, `${safeBaseUrl}/open-apis/auth/v3/tenant_access_token/internal`, {
      method: "POST",
      body: {
        app_id: credentials.appId,
        app_secret: credentials.appSecret,
      },
    });

    const token = String(data?.tenant_access_token || "").trim();
    if (!token) {
      throw createError("FEISHU_TOKEN_EMPTY", "Feishu tenant access token is empty.");
    }

    const expireSeconds = Number(data?.expire || 7200);
    tokenCache = {
      value: token,
      expiresAt: nowMs + Math.max(60, expireSeconds) * 1000,
    };

    return tokenCache.value;
  }

  async function getDocumentRawContent(documentId) {
    const safeDocumentId = normalizeText(documentId, 120);
    if (!safeDocumentId) {
      throw createError("FEISHU_DOCUMENT_ID_MISSING", "Feishu document ID is required.");
    }

    const token = await getTenantAccessToken();
    const data = await requestJson(
      fetchImpl,
      `${safeBaseUrl}/open-apis/docx/v1/documents/${encodeURIComponent(safeDocumentId)}/raw_content`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return {
      documentId: safeDocumentId,
      content: normalizeText(data?.content || "", 20000),
    };
  }

  async function getWikiNode(wikiNodeToken) {
    const safeWikiNodeToken = normalizeText(wikiNodeToken, 120);
    if (!safeWikiNodeToken) {
      throw createError("FEISHU_WIKI_NODE_MISSING", "Feishu wiki node token is required.");
    }

    const token = await getTenantAccessToken();
    const data = await requestJson(
      fetchImpl,
      `${safeBaseUrl}/open-apis/wiki/v2/spaces/get_node?token=${encodeURIComponent(safeWikiNodeToken)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return {
      nodeToken: safeWikiNodeToken,
      objToken: normalizeText(data?.node?.obj_token || data?.obj_token, 120),
      objType: normalizeText(data?.node?.obj_type || data?.obj_type || "docx", 40).toLowerCase(),
      title: normalizeText(data?.node?.title || data?.title, 160),
      originUrl: normalizeUrl(data?.node?.origin_url || data?.origin_url),
      url: normalizeUrl(data?.node?.url || data?.url),
    };
  }

  async function resolveTarget(target = {}) {
    const normalizedTarget = normalizeTarget(target);
    if (!normalizedTarget.documentId && !normalizedTarget.wikiNodeToken) {
      throw createError("FEISHU_TARGET_ID_MISSING", "Feishu target requires documentId or wikiNodeToken.");
    }

    if (normalizedTarget.docType === "wiki" || (!normalizedTarget.documentId && normalizedTarget.wikiNodeToken)) {
      const node = await getWikiNode(normalizedTarget.wikiNodeToken);
      if (!node.objToken) {
        throw createError("FEISHU_WIKI_OBJ_TOKEN_MISSING", "Feishu wiki node did not resolve to an object token.");
      }
      if (node.objType && node.objType !== "docx") {
        throw createError("FEISHU_UNSUPPORTED_WIKI_TYPE", `Unsupported Feishu wiki object type: ${node.objType}`);
      }
      return {
        ...normalizedTarget,
        documentId: node.objToken,
        sourceUrl: normalizedTarget.sourceUrl || node.originUrl || node.url || buildDocumentUrl(safeBaseUrl, node.objToken),
        title: normalizedTarget.title || node.title,
      };
    }

    return {
      ...normalizedTarget,
      sourceUrl: normalizedTarget.sourceUrl || buildDocumentUrl(safeBaseUrl, normalizedTarget.documentId),
    };
  }

  async function getTargetRawContent(target = {}) {
    const resolved = await resolveTarget(target);
    const document = await getDocumentRawContent(resolved.documentId);

    return {
      ...resolved,
      content: document.content,
      sourceUrl: resolved.sourceUrl || buildDocumentUrl(safeBaseUrl, resolved.documentId),
      fetchedAt: new Date(Number(now())).toISOString(),
    };
  }

  return {
    getTenantAccessToken,
    getDocumentRawContent,
    getWikiNode,
    resolveTarget,
    getTargetRawContent,
  };
}
