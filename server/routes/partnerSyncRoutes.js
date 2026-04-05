import { Router } from "express";
import { asyncHandler, sendSuccess } from "../lib/apiEnvelope.js";

const normalizeLang = (value) => (value === "en" ? "en" : "zh");

export function createPartnerSyncRouter({ service }) {
  const router = Router();

  router.get(
    "/overview",
    asyncHandler(async (req, res) => {
      const data = await service.getOverview({ lang: normalizeLang(req.query.lang) });
      sendSuccess(res, req, data);
    })
  );

  router.get(
    "/home-card",
    asyncHandler(async (req, res) => {
      const data = await service.getHomeCard({ lang: normalizeLang(req.query.lang) });
      sendSuccess(res, req, data);
    })
  );

  router.post(
    "/invite",
    asyncHandler(async (req, res) => {
      const data = await service.createInvite();
      sendSuccess(res, req, data, { status: 201 });
    })
  );

  router.post(
    "/bind",
    asyncHandler(async (req, res) => {
      const data = await service.bindPartner(req.body || {});
      sendSuccess(res, req, data);
    })
  );

  router.patch(
    "/settings",
    asyncHandler(async (req, res) => {
      const data = await service.updateSettings(req.body || {});
      sendSuccess(res, req, data);
    })
  );

  router.patch(
    "/tasks",
    asyncHandler(async (req, res) => {
      const data = await service.updateTaskState(req.body?.taskId, req.body?.done, {
        lang: normalizeLang(req.query.lang),
      });
      sendSuccess(res, req, data);
    })
  );

  router.post(
    "/unbind",
    asyncHandler(async (req, res) => {
      const data = await service.unbind();
      sendSuccess(res, req, data);
    })
  );

  return router;
}
