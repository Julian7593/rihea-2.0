import { Router } from "express";
import { asyncHandler, sendSuccess } from "../lib/apiEnvelope.js";

function normalizeArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value.trim()) {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

export function createKnowledgeRouter({ service }) {
  const router = Router();

  router.get(
    "/overview",
    asyncHandler(async (req, res) => {
      const data = await service.getOverview({
        tenantId: req.query.tenantId,
      });
      sendSuccess(res, req, data);
    })
  );

  router.post(
    "/search",
    asyncHandler(async (req, res) => {
      const data = await service.search({
        query: req.body?.query,
        mode: req.body?.mode,
        tenantId: req.body?.tenantId,
        principalIds: normalizeArray(req.body?.principalIds),
        sourceTypes: normalizeArray(req.body?.sourceTypes),
        tags: normalizeArray(req.body?.tags),
        lang: req.body?.lang,
        topK: req.body?.topK,
      });
      sendSuccess(res, req, data);
    })
  );

  router.get(
    "/documents/:documentId",
    asyncHandler(async (req, res) => {
      const data = await service.getDocument({
        documentId: req.params.documentId,
        tenantId: req.query.tenantId,
        principalIds: normalizeArray(req.query.principalIds),
      });
      sendSuccess(res, req, data);
    })
  );

  return router;
}
