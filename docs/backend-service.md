# Backend Service

## Commands

- Start once:

```bash
npm run server
```

- Start with watch mode:

```bash
npm run server:dev
```

## Default Address

- API base URL: `http://localhost:8787`

Frontend local env example:

```bash
VITE_API_BASE_URL=http://localhost:8787
```

## Runtime Storage

The service stores local demo state in:

```text
server/data/partner-sync-state.local.json
```

This file is ignored by git and will be created automatically on first run.

<<<<<<< HEAD
Unified knowledge runtime files:

```text
server/kb/knowledge-documents.local.json
server/kb/knowledge-connectors.local.json
server/kb/feishu-knowledge.local.json
```

=======
>>>>>>> 356bd4d38d8b7f31d8a35a177e59ac40d7d6cf8a
## Implemented Routes

- `GET /health`
- `GET /v1/partner-sync/overview`
- `GET /v1/partner-sync/home-card`
- `POST /v1/partner-sync/invite`
- `POST /v1/partner-sync/bind`
- `PATCH /v1/partner-sync/settings`
- `PATCH /v1/partner-sync/tasks`
- `POST /v1/partner-sync/unbind`
<<<<<<< HEAD
- `GET /v1/knowledge/overview`
- `POST /v1/knowledge/search`
- `GET /v1/knowledge/documents/:documentId`
=======
>>>>>>> 356bd4d38d8b7f31d8a35a177e59ac40d7d6cf8a
