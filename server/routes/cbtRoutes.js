import { Router } from "express";
import { asyncHandler, sendSuccess } from "../lib/apiEnvelope.js";

const normalizeLang = (value) => (value === "en" ? "en" : "zh");

export function createCbtRouter({ service }) {
  const router = Router();

  router.get(
    "/overview",
    asyncHandler(async (req, res) => {
      const data = await service.getOverview({ lang: normalizeLang(req.query.lang) });
      sendSuccess(res, req, data);
    })
  );

  router.post(
    "/intake",
    asyncHandler(async (req, res) => {
      const data = await service.submitIntake(req.body || {}, { lang: normalizeLang(req.query.lang) });
      sendSuccess(res, req, data, { status: 201 });
    })
  );

  router.post(
    "/reassessment",
    asyncHandler(async (req, res) => {
      const data = await service.submitReassessment(req.body || {}, { lang: normalizeLang(req.query.lang) });
      sendSuccess(res, req, data);
    })
  );

  router.get(
    "/modules/:week",
    asyncHandler(async (req, res) => {
      const data = await service.getModule(req.params.week, { lang: normalizeLang(req.query.lang) });
      sendSuccess(res, req, data);
    })
  );

  router.post(
    "/homework",
    asyncHandler(async (req, res) => {
      const data = await service.createHomework(req.body || {}, { lang: normalizeLang(req.query.lang) });
      sendSuccess(res, req, data, { status: 201 });
    })
  );

  router.patch(
    "/homework/:id",
    asyncHandler(async (req, res) => {
      const data = await service.updateHomework(req.params.id, req.body || {});
      sendSuccess(res, req, data);
    })
  );

  router.get(
    "/care-team",
    asyncHandler(async (req, res) => {
      const data = await service.getCareTeam({ lang: normalizeLang(req.query.lang) });
      sendSuccess(res, req, data);
    })
  );

  router.post(
    "/care-team/referral",
    asyncHandler(async (req, res) => {
      const data = await service.createReferral(req.body || {}, { lang: normalizeLang(req.query.lang) });
      sendSuccess(res, req, data, { status: 201 });
    })
  );

  router.get(
    "/partner-tasks",
    asyncHandler(async (req, res) => {
      const data = await service.getPartnerTasks({ lang: normalizeLang(req.query.lang) });
      sendSuccess(res, req, data);
    })
  );

  return router;
}

