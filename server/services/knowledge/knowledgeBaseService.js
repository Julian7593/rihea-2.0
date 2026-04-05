import {
  buildCanonicalKnowledgeGraph,
  buildConnectorCatalog,
  createBuiltinKnowledgeDocuments,
  createFeishuKnowledgeDocuments,
  createManualKnowledgeDocuments,
  hasAclAccess,
  loadJsonArrayFile,
  normalizeSearchFilters,
  scoreKnowledgeChunk,
} from "./knowledgeModels.js";

function summarizeSources(documents = []) {
  return documents.reduce((acc, item) => {
    const key = item?.source_type || "unknown";
    const current = acc[key] || { source_type: key, documents: 0, chunks: 0, connectors: new Set() };
    current.documents += 1;
    current.connectors.add(item?.connector_id || "");
    acc[key] = current;
    return acc;
  }, {});
}

function countChunksBySource(chunks = []) {
  return chunks.reduce((acc, item) => {
    const key = item?.source_type || "unknown";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function buildFacets(hits = []) {
  const sourceTypes = {};
  const tags = {};

  for (const hit of hits) {
    sourceTypes[hit.source_type] = (sourceTypes[hit.source_type] || 0) + 1;
    for (const tag of Array.isArray(hit.tags) ? hit.tags : []) {
      tags[tag] = (tags[tag] || 0) + 1;
    }
  }

  return {
    source_types: Object.entries(sourceTypes)
      .map(([value, count]) => ({ value, count }))
      .sort((left, right) => right.count - left.count),
    tags: Object.entries(tags)
      .map(([value, count]) => ({ value, count }))
      .sort((left, right) => right.count - left.count)
      .slice(0, 12),
  };
}

function buildCapabilities() {
  return {
    retrieval_modes: ["hybrid", "keyword", "semantic"],
    hybrid_search: true,
    lexical_search: true,
    vector_search: false,
    acl_filtering: true,
    multitenancy: true,
    version_tracking: true,
    sync_projection: true,
    citation_granularity: "chunk",
    notes: [
      "Current repository implementation uses lexical+metadata hybrid ranking.",
      "True vector search should be delegated to Azure AI Search / Elastic / OpenSearch in production.",
    ],
  };
}

export function createKnowledgeBaseService({
  config = {},
  now = () => new Date(),
} = {}) {
  function loadCatalog() {
    const sourceRegistry = loadJsonArrayFile(config.sourceRegistryFilePath);
    const documents = [
      ...createBuiltinKnowledgeDocuments({
        defaultTenantId: config.defaultTenantId,
        now,
      }),
      ...createFeishuKnowledgeDocuments({
        filePath: config.feishuSyncFilePath,
        defaultTenantId: config.defaultTenantId,
      }),
      ...createManualKnowledgeDocuments({
        filePath: config.manualDocumentsFilePath,
        defaultTenantId: config.defaultTenantId,
      }),
    ];

    const graph = buildCanonicalKnowledgeGraph(documents);
    const connectors = buildConnectorCatalog({
      sourceRegistry,
      feishuSyncEnabled: Boolean(config.feishuSyncEnabled),
    });

    return {
      ...graph,
      connectors,
    };
  }

  function search(input = {}) {
    const filters = normalizeSearchFilters({
      ...input,
      tenantId: input?.tenantId || input?.tenant_id || config.defaultTenantId,
    });
    const catalog = loadCatalog();
    const tokens = filters.query
      ? filters.query.toLowerCase().match(/[\u4e00-\u9fa5]{1,}|[a-z0-9_]+/gi) || []
      : [];

    const preferredSourceTypes = filters.source_types;
    const hits = catalog.chunks
      .filter((item) => item.tenant_id === filters.tenant_id)
      .filter((item) => !filters.language || item.language === filters.language || item.language === "zh")
      .filter((item) => !filters.source_types.length || filters.source_types.includes(item.source_type))
      .filter((item) => !filters.tags.length || filters.tags.some((tag) => item.tags.includes(tag)))
      .filter((item) =>
        hasAclAccess({
          aclPrincipals: item.acl_principals,
          principalIds: filters.principal_ids,
        })
      )
      .map((item) => {
        const score = scoreKnowledgeChunk(item, {
          query: filters.query,
          tokens,
          preferredSourceTypes,
        });
        return {
          ...item,
          score: score.total,
          score_breakdown: score.breakdown,
        };
      })
      .filter((item) => item.score > 0 || !filters.query)
      .sort((left, right) => right.score - left.score)
      .slice(0, filters.top_k)
      .map((item) => ({
        chunk_id: item.chunk_id,
        document_id: item.document_id,
        tenant_id: item.tenant_id,
        source_type: item.source_type,
        source_id: item.source_id,
        source_url: item.source_url,
        title: item.title,
        snippet: item.content.slice(0, 260),
        summary: item.summary,
        section_path: item.section_path,
        tags: item.tags,
        acl_principals: item.acl_principals,
        updated_at: item.updated_at,
        version_id: item.version_id,
        connector_type: item.connector_type,
        connector_id: item.connector_id,
        score: item.score,
        score_breakdown: item.score_breakdown,
      }));

    const warnings = [];
    if (filters.mode === "semantic") {
      warnings.push("semantic_mode_requested_but_vector_provider_not_configured");
    }
    if (filters.mode === "hybrid") {
      warnings.push("hybrid_mode_uses_lexical_plus_metadata_ranking_in_local_runtime");
    }

    return {
      query: filters.query,
      mode: filters.mode,
      tenant_id: filters.tenant_id,
      principal_ids: filters.principal_ids,
      total: hits.length,
      hits,
      facets: buildFacets(hits),
      capabilities: buildCapabilities(),
      warnings,
    };
  }

  return {
    getOverview({ tenantId = config.defaultTenantId } = {}) {
      const catalog = loadCatalog();
      const sourceSummary = summarizeSources(catalog.documents);
      const chunkCountBySource = countChunksBySource(catalog.chunks);

      return {
        tenant_id: tenantId || config.defaultTenantId,
        generated_at: now().toISOString(),
        architecture: {
          pattern: "connector -> canonical document store -> chunk pipeline -> hybrid retrieval -> api",
          canonical_entities: ["document", "chunk", "acl_principal", "version_sync_state"],
          retrieval_backend_strategy: "search-engine-centric",
        },
        totals: {
          documents: catalog.documents.length,
          chunks: catalog.chunks.length,
          connectors: catalog.connectors.length,
        },
        sources: Object.values(sourceSummary).map((item) => ({
          source_type: item.source_type,
          documents: item.documents,
          chunks: chunkCountBySource[item.source_type] || 0,
          connectors: Array.from(item.connectors).filter(Boolean),
        })),
        connectors: catalog.connectors,
        capabilities: buildCapabilities(),
      };
    },

    search,

    getDocument({ documentId, tenantId = config.defaultTenantId, principalIds = [] } = {}) {
      const catalog = loadCatalog();
      const document = catalog.documents.find((item) => item.document_id === documentId && item.tenant_id === tenantId);

      if (!document) {
        const error = new Error(`Knowledge document not found: ${documentId}`);
        error.code = "KNOWLEDGE_DOCUMENT_NOT_FOUND";
        error.statusCode = 404;
        throw error;
      }

      if (
        !hasAclAccess({
          aclPrincipals: document.acl_principals,
          principalIds,
        })
      ) {
        const error = new Error(`Access denied for knowledge document: ${documentId}`);
        error.code = "KNOWLEDGE_ACCESS_DENIED";
        error.statusCode = 403;
        throw error;
      }

      return {
        document,
        chunks: catalog.chunks.filter((item) => item.document_id === documentId && item.tenant_id === tenantId),
      };
    },
  };
}
