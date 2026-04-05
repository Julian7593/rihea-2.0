import { readFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { MEDICAL_ARTICLES_ZH } from "../../../src/data/medicalContent.js";
import { MEDICAL_ARTICLES_EN } from "../../../src/data/medicalContent.en.js";
import { knowledgeBase } from "../../../src/data/knowledgeBase.js";

const DEFAULT_PUBLIC_PRINCIPAL = "public";
const DEFAULT_TENANT_ID = "rihea-default";
const DEFAULT_CHUNK_SIZE = 360;

function normalizeText(value, maxLength = 2000) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function normalizeLongText(value, maxLength = 20000) {
  return String(value || "").replace(/\r/g, "").trim().slice(0, maxLength);
}

function normalizeArray(value, maxLength = 12, itemLength = 64) {
  if (!Array.isArray(value)) return [];
  return Array.from(
    new Set(
      value
        .map((item) => normalizeText(item, itemLength))
        .filter(Boolean)
    )
  ).slice(0, maxLength);
}

function toArray(value) {
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object") return Object.values(value);
  return [];
}

function safeIsoDate(value, fallback = "") {
  const safe = normalizeText(value, 48);
  if (!safe) return fallback;
  const date = new Date(safe);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toISOString();
}

function sha1(value) {
  return createHash("sha1").update(String(value || "")).digest("hex");
}

function createStableId(parts = []) {
  return parts.map((item) => normalizeText(item, 80)).filter(Boolean).join("__");
}

function splitIntoChunks(text, chunkSize = DEFAULT_CHUNK_SIZE) {
  const safe = normalizeLongText(text, 40000);
  if (!safe) return [];

  const paragraphs = safe
    .split(/\n{2,}/)
    .map((item) => item.trim())
    .filter(Boolean);

  if (!paragraphs.length) return [safe.slice(0, chunkSize)];

  const chunks = [];
  let buffer = "";

  for (const paragraph of paragraphs) {
    const next = buffer ? `${buffer}\n\n${paragraph}` : paragraph;
    if (next.length <= chunkSize) {
      buffer = next;
      continue;
    }

    if (buffer) chunks.push(buffer);
    if (paragraph.length <= chunkSize) {
      buffer = paragraph;
      continue;
    }

    let remaining = paragraph;
    while (remaining.length > chunkSize) {
      chunks.push(remaining.slice(0, chunkSize));
      remaining = remaining.slice(chunkSize).trim();
    }
    buffer = remaining;
  }

  if (buffer) chunks.push(buffer);
  return chunks.slice(0, 64);
}

function normalizeAclPrincipals(value) {
  const items = normalizeArray(value, 32, 120);
  return items.length ? items : [DEFAULT_PUBLIC_PRINCIPAL];
}

export function loadJsonArrayFile(filePath) {
  if (!filePath || !existsSync(filePath)) return [];

  try {
    const raw = readFileSync(filePath, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function createBuiltinKnowledgeDocuments({ defaultTenantId = DEFAULT_TENANT_ID, now = () => new Date() } = {}) {
  const syncedAt = now().toISOString();
  const sources = [
    ...toArray(MEDICAL_ARTICLES_ZH).map((item) => ({ ...item, language: "zh", sourceType: "local_kb" })),
    ...toArray(MEDICAL_ARTICLES_EN).map((item) => ({ ...item, language: "en", sourceType: "local_kb" })),
    ...toArray(knowledgeBase).map((item) => ({ ...item, language: "zh", sourceType: "local_kb" })),
  ];

  return sources
    .map((item, index) => {
      const title = normalizeText(item?.title, 160);
      const bodyText = normalizeLongText(item?.content || item?.summary, 12000);
      if (!title || !bodyText) return null;

      const sourceId = normalizeText(item?.id, 80) || `local_${index + 1}`;
      const tags = normalizeArray(item?.tags, 12, 48);
      const category = normalizeText(item?.category, 48) || "general";
      const documentId = createStableId(["local_kb", sourceId]);
      const versionId = sha1(`${title}:${bodyText}`).slice(0, 12);

      return {
        document_id: documentId,
        tenant_id: defaultTenantId,
        source_type: "local_kb",
        source_id: sourceId,
        source_url: `https://rihea.local/help/${encodeURIComponent(sourceId)}`,
        title,
        summary: normalizeText(item?.summary || bodyText, 240),
        body_text: bodyText,
        body_markdown: "",
        language: item?.language === "en" ? "en" : "zh",
        tags: Array.from(new Set([category, ...tags])).slice(0, 12),
        section_path: [category],
        acl_principals: [DEFAULT_PUBLIC_PRINCIPAL],
        version_id: versionId,
        updated_at: safeIsoDate(item?.updatedAt, syncedAt),
        sync_cursor: versionId,
        deleted_at: "",
        connector_type: "builtin_bundle",
        connector_id: "builtin_local_kb",
        sync_mode: "bundle",
        metadata: {
          week_range: Array.isArray(item?.weekRange) ? item.weekRange.slice(0, 2) : [],
          source_name: item?.sourceType || "rihea_local_bundle",
        },
      };
    })
    .filter(Boolean);
}

export function createFeishuKnowledgeDocuments({
  filePath = "",
  defaultTenantId = DEFAULT_TENANT_ID,
} = {}) {
  return loadJsonArrayFile(filePath)
    .map((item, index) => {
      const title = normalizeText(item?.title, 160);
      const bodyText = normalizeLongText(item?.content || item?.summary, 12000);
      if (!title || !bodyText) return null;

      const sourceId = normalizeText(item?.documentId || item?.document_id, 120) || `feishu_${index + 1}`;
      const summary = normalizeText(item?.summary || bodyText, 240);
      const documentId = createStableId(["feishu_sync", sourceId]);
      const versionId = sha1(`${title}:${bodyText}:${item?.updatedAt || item?.updated_at || ""}`).slice(0, 12);

      return {
        document_id: documentId,
        tenant_id: normalizeText(item?.tenantId || item?.tenant_id, 80) || defaultTenantId,
        source_type: "feishu_sync",
        source_id: sourceId,
        source_url: normalizeText(item?.sourceUrl || item?.source_url, 600),
        title,
        summary,
        body_text: bodyText,
        body_markdown: "",
        language: normalizeText(item?.language, 8) || "zh",
        tags: normalizeArray(item?.tags, 12, 48),
        section_path: normalizeArray([item?.scopeId || item?.scope_id], 6, 64),
        acl_principals: normalizeAclPrincipals(item?.acl_principals || item?.aclPrincipals),
        version_id: versionId,
        updated_at: safeIsoDate(item?.updatedAt || item?.updated_at),
        sync_cursor: normalizeText(item?.documentId || item?.document_id || versionId, 120),
        deleted_at: safeIsoDate(item?.deletedAt || item?.deleted_at),
        connector_type: "feishu",
        connector_id: "feishu_sync_snapshot",
        sync_mode: "scheduled_pull",
        metadata: {
          scope_id: normalizeText(item?.scopeId || item?.scope_id, 64),
          access_scope: normalizeText(item?.accessScope || item?.access_scope, 64),
        },
      };
    })
    .filter(Boolean);
}

export function createManualKnowledgeDocuments({
  filePath = "",
  defaultTenantId = DEFAULT_TENANT_ID,
} = {}) {
  return loadJsonArrayFile(filePath)
    .map((item, index) => {
      const title = normalizeText(item?.title, 160);
      const bodyText = normalizeLongText(item?.body_text || item?.body_markdown || item?.content, 16000);
      if (!title || !bodyText) return null;

      const sourceType = normalizeText(item?.source_type, 48) || "manual";
      const sourceId = normalizeText(item?.source_id, 120) || `${sourceType}_${index + 1}`;
      const documentId = normalizeText(item?.document_id, 120) || createStableId([sourceType, sourceId]);
      const updatedAt = safeIsoDate(item?.updated_at) || new Date().toISOString();
      const versionId =
        normalizeText(item?.version_id, 64) || sha1(`${title}:${bodyText}:${updatedAt}`).slice(0, 12);

      return {
        document_id: documentId,
        tenant_id: normalizeText(item?.tenant_id, 80) || defaultTenantId,
        source_type: sourceType,
        source_id: sourceId,
        source_url: normalizeText(item?.source_url, 600),
        title,
        summary: normalizeText(item?.summary || bodyText, 240),
        body_text: bodyText,
        body_markdown: normalizeLongText(item?.body_markdown, 16000),
        language: normalizeText(item?.language, 8) || "zh",
        tags: normalizeArray(item?.tags, 16, 48),
        section_path: normalizeArray(item?.section_path, 8, 64),
        acl_principals: normalizeAclPrincipals(item?.acl_principals),
        version_id: versionId,
        updated_at: updatedAt,
        sync_cursor: normalizeText(item?.sync_cursor, 120) || versionId,
        deleted_at: safeIsoDate(item?.deleted_at),
        connector_type: normalizeText(item?.connector_type, 48) || sourceType,
        connector_id: normalizeText(item?.connector_id, 80) || `${sourceType}_manual`,
        sync_mode: normalizeText(item?.sync_mode, 48) || "manual_push",
        metadata: item?.metadata && typeof item.metadata === "object" ? item.metadata : {},
      };
    })
    .filter(Boolean);
}

export function buildCanonicalKnowledgeGraph(documents = []) {
  const normalizedDocuments = [];
  const chunks = [];

  for (const item of Array.isArray(documents) ? documents : []) {
    if (!item?.document_id || item?.deleted_at) continue;

    const safeDocument = {
      ...item,
      title: normalizeText(item.title, 160),
      summary: normalizeText(item.summary, 240),
      body_text: normalizeLongText(item.body_text, 20000),
      body_markdown: normalizeLongText(item.body_markdown, 20000),
      source_url: normalizeText(item.source_url, 600),
      tags: normalizeArray(item.tags, 16, 48),
      section_path: normalizeArray(item.section_path, 8, 64),
      acl_principals: normalizeAclPrincipals(item.acl_principals),
      updated_at: safeIsoDate(item.updated_at),
      tenant_id: normalizeText(item.tenant_id, 80) || DEFAULT_TENANT_ID,
      metadata: item.metadata && typeof item.metadata === "object" ? item.metadata : {},
    };

    normalizedDocuments.push(safeDocument);

    const sections = splitIntoChunks(safeDocument.body_text || safeDocument.summary || safeDocument.title);
    sections.forEach((content, index) => {
      const chunkId = `${safeDocument.document_id}::chunk_${index + 1}`;
      chunks.push({
        chunk_id: chunkId,
        document_id: safeDocument.document_id,
        tenant_id: safeDocument.tenant_id,
        source_type: safeDocument.source_type,
        source_id: safeDocument.source_id,
        source_url: safeDocument.source_url,
        title: safeDocument.title,
        summary: safeDocument.summary,
        content: normalizeLongText(content, 4000),
        language: safeDocument.language,
        tags: safeDocument.tags,
        section_path: safeDocument.section_path,
        acl_principals: safeDocument.acl_principals,
        version_id: safeDocument.version_id,
        updated_at: safeDocument.updated_at,
        connector_type: safeDocument.connector_type,
        connector_id: safeDocument.connector_id,
        sync_mode: safeDocument.sync_mode,
        chunk_index: index,
        searchable_text: `${safeDocument.title} ${safeDocument.summary} ${content} ${safeDocument.tags.join(" ")} ${safeDocument.section_path.join(" ")}`.toLowerCase(),
      });
    });
  }

  return {
    documents: normalizedDocuments,
    chunks,
  };
}

export function hasAclAccess({ aclPrincipals = [], principalIds = [] } = {}) {
  const normalizedAcl = normalizeAclPrincipals(aclPrincipals).map((item) => item.toLowerCase());
  if (normalizedAcl.includes(DEFAULT_PUBLIC_PRINCIPAL)) return true;
  const principals = normalizeArray(principalIds, 48, 120).map((item) => item.toLowerCase());
  return principals.some((item) => normalizedAcl.includes(item));
}

export function scoreKnowledgeChunk(chunk, { query = "", tokens = [], preferredSourceTypes = [] } = {}) {
  const searchable = String(chunk?.searchable_text || "").toLowerCase();
  if (!searchable) return { total: 0, breakdown: { keyword: 0, freshness: 0, source: 0, structure: 0 } };

  const safeQuery = normalizeText(query, 240).toLowerCase();
  let keyword = 0;

  for (const token of tokens) {
    if (String(chunk?.title || "").toLowerCase().includes(token)) keyword += 4;
    else if (chunk?.section_path?.some?.((item) => String(item).toLowerCase().includes(token))) keyword += 2.5;
    else if (String(chunk?.summary || "").toLowerCase().includes(token)) keyword += 2;
    else if (searchable.includes(token)) keyword += 1;

    if (chunk?.tags?.some?.((item) => String(item).toLowerCase().includes(token))) keyword += 1.2;
  }

  if (safeQuery && searchable.includes(safeQuery)) keyword += 3;

  const updatedAt = chunk?.updated_at ? new Date(chunk.updated_at) : null;
  const ageDays =
    updatedAt && !Number.isNaN(updatedAt.getTime())
      ? Math.max(0, (Date.now() - updatedAt.getTime()) / (1000 * 60 * 60 * 24))
      : null;
  const freshness = ageDays === null ? 0.15 : Number((Math.max(0, 1 - ageDays / 120) * 0.9).toFixed(2));

  const source = preferredSourceTypes.includes(chunk?.source_type)
    ? 0.75
    : chunk?.source_type === "feishu_sync"
      ? 0.45
      : chunk?.source_type === "local_kb"
        ? 0.35
        : 0.25;

  const structure = chunk?.chunk_index === 0 ? 0.25 : 0.05;
  const total = Number((keyword + freshness + source + structure).toFixed(2));

  return {
    total,
    breakdown: {
      keyword: Number(keyword.toFixed(2)),
      freshness,
      source,
      structure,
    },
  };
}

export function buildConnectorCatalog({ sourceRegistry = [], feishuSyncEnabled = false } = {}) {
  const defaults = [
    {
      connector_id: "builtin_local_kb",
      connector_type: "local_kb",
      status: "ready",
      sync_mode: "bundle",
      ownership: "application_repo",
      notes: "Bundled product knowledge and medical articles.",
    },
    {
      connector_id: "feishu_sync_snapshot",
      connector_type: "feishu",
      status: feishuSyncEnabled ? "configured" : "planned",
      sync_mode: "scheduled_pull",
      ownership: "backend_connector",
      notes: "Supports scheduled snapshots today; event subscription + reconciliation is the target mode.",
    },
    {
      connector_id: "notion_api",
      connector_type: "notion",
      status: "planned",
      sync_mode: "webhook_plus_reconcile",
      ownership: "backend_connector",
      notes: "Recommended page/block sync model with chunk-level provenance.",
    },
    {
      connector_id: "confluence_api",
      connector_type: "confluence",
      status: "planned",
      sync_mode: "webhook_plus_reconcile",
      ownership: "backend_connector",
      notes: "Recommended page/content permission sync with ACL projection.",
    },
    {
      connector_id: "local_files",
      connector_type: "local_files",
      status: "planned",
      sync_mode: "scheduled_pull",
      ownership: "backend_connector",
      notes: "For markdown, pdf extract, and help-center exports.",
    },
  ];

  const merged = new Map(defaults.map((item) => [item.connector_id, item]));
  for (const item of Array.isArray(sourceRegistry) ? sourceRegistry : []) {
    const connectorId = normalizeText(item?.connector_id, 80);
    if (!connectorId) continue;
    merged.set(connectorId, {
      ...(merged.get(connectorId) || {}),
      ...item,
      connector_id: connectorId,
      connector_type: normalizeText(item?.connector_type, 48) || merged.get(connectorId)?.connector_type || "custom",
      status: normalizeText(item?.status, 32) || merged.get(connectorId)?.status || "planned",
      sync_mode: normalizeText(item?.sync_mode, 48) || merged.get(connectorId)?.sync_mode || "manual_push",
      ownership: normalizeText(item?.ownership, 48) || merged.get(connectorId)?.ownership || "backend_connector",
      notes: normalizeText(item?.notes, 240) || merged.get(connectorId)?.notes || "",
    });
  }

  return Array.from(merged.values());
}

export function normalizeSearchMode(value) {
  const safe = normalizeText(value, 24).toLowerCase();
  if (safe === "keyword" || safe === "semantic") return safe;
  return "hybrid";
}

export function normalizeSearchFilters(input = {}) {
  return {
    query: normalizeText(input?.query, 240),
    mode: normalizeSearchMode(input?.mode),
    tenant_id: normalizeText(input?.tenantId || input?.tenant_id, 80) || DEFAULT_TENANT_ID,
    principal_ids: normalizeArray(input?.principalIds || input?.principal_ids, 48, 120),
    source_types: normalizeArray(input?.sourceTypes || input?.source_types, 12, 48),
    tags: normalizeArray(input?.tags, 12, 48),
    language: normalizeText(input?.lang || input?.language, 8),
    top_k: Number.isFinite(Number(input?.topK || input?.top_k))
      ? Math.max(1, Math.min(20, Number(input?.topK || input?.top_k)))
      : 6,
  };
}
