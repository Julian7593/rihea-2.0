# Unified Knowledge Backend

## What Was Added

The backend now includes a unified knowledge service under `server/services/knowledge/` and new APIs under `/v1/knowledge`.

Implemented runtime shape:

`connector/snapshot -> canonical document store -> chunk projection -> hybrid retrieval api`

Canonical entities now exist in code:

- `document`
- `chunk`
- `acl_principal`
- `version_sync_state`

This repository implementation is intentionally an MVP-safe backbone:

- It unifies bundled local knowledge, Feishu synced snapshots, and manual external documents.
- It supports tenant filtering and ACL filtering now.
- It stores version/sync metadata now.
- It exposes a single retrieval API that future Notion/Confluence connectors can plug into.
- It keeps current local ranking lexical+metadata based; production vector search is expected to move to Azure AI Search / Elastic / OpenSearch.

## API

### `GET /v1/knowledge/overview`

Returns the current knowledge architecture summary, totals, connectors, and supported capabilities.

### `POST /v1/knowledge/search`

Request body:

```json
{
  "tenantId": "rihea-default",
  "query": "夜醒 慢呼吸",
  "mode": "hybrid",
  "principalIds": ["group:ops-admin"],
  "sourceTypes": ["feishu_sync", "notion"],
  "tags": ["sleep"],
  "topK": 6
}
```

Response highlights:

- `hits[].document_id`
- `hits[].chunk_id`
- `hits[].source_type`
- `hits[].source_url`
- `hits[].acl_principals`
- `hits[].version_id`
- `hits[].score_breakdown`

### `GET /v1/knowledge/documents/:documentId`

Returns the canonical document plus its projected chunks.

## Data Inputs

### Built-in sources

- `src/data/medicalContent.js`
- `src/data/medicalContent.en.js`
- `src/data/knowledgeBase.js`

### Optional runtime files

- `server/kb/feishu-knowledge.local.json`
- `server/kb/knowledge-documents.local.json`
- `server/kb/knowledge-connectors.local.json`

Tracked examples are included:

- `server/kb/knowledge-documents.example.json`
- `server/kb/knowledge-connectors.example.json`
- `server/kb/README.md`

## Connector Strategy

Recommended integration pattern for future connectors:

- Feishu: event subscription + reconciliation crawl
- Notion: page/block sync + webhooks
- Confluence: content/page sync + permission projection
- Local files: scheduled scan + content hash dedupe

All connectors should project into the same canonical fields:

- `tenant_id`
- `source_type`
- `source_id`
- `source_url`
- `title`
- `body_text` / `body_markdown`
- `section_path`
- `acl_principals`
- `version_id`
- `updated_at`
- `sync_cursor`
- `deleted_at`

## Current Limitations

- No real vector index is embedded in this repository runtime.
- `mode=semantic` currently degrades to lexical fallback and returns warnings.
- Feishu is wired through snapshot sync today; Notion and Confluence remain connector-ready, not live-synced.
- ACL logic is filtering-based and expects upstream principal projection.

## Next Suggested Steps

1. Add connector workers for Notion and Confluence.
2. Move retrieval provider behind an interface for Azure AI Search / Elastic / OpenSearch.
3. Add chunk-level provenance offsets and reranking.
4. Add ingestion audit logs, retries, dead-letter handling, and rebuild jobs.
