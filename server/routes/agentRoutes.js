import { Router } from "express";
import { asyncHandler, sendSuccess } from "../lib/apiEnvelope.js";

const normalizeLang = (value) => (value === "en" ? "en" : "zh");

export function createAgentRouter({ service }) {
  const router = Router();

  router.post(
    "/chat",
    asyncHandler(async (req, res) => {
      const data = await service.chat(
        {
          userId: req.body?.userId,
          sessionId: req.body?.sessionId,
          message: req.body?.message,
          lang: normalizeLang(req.body?.lang),
          presetQuestionId: req.body?.presetQuestionId,
          sourcePreference: req.body?.sourcePreference,
          feishuScopeId: req.body?.feishuScopeId,
          clientContext: req.body?.clientContext || {},
        },
        { requestId: req.requestId }
      );
      sendSuccess(res, req, data);
    })
  );

  router.get(
    "/presets",
    asyncHandler(async (req, res) => {
      const data = await service.getPromptPresets({
        lang: normalizeLang(req.query.lang),
        category: req.query.category,
      });
      sendSuccess(res, req, data);
    })
  );

  router.get(
    "/sessions/:sessionId/history",
    asyncHandler(async (req, res) => {
      const data = await service.getSessionHistory({
        sessionId: req.params.sessionId,
        userId: req.query.userId,
      });
      sendSuccess(res, req, data);
    })
  );

  router.get(
    "/escalations",
    asyncHandler(async (req, res) => {
      const data = await service.getEscalations({
        userId: req.query.userId,
        range: req.query.range,
      });
      sendSuccess(res, req, data);
    })
  );

  return router;
}
