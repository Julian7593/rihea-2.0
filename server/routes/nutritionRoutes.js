import { Router } from "express";
import { asyncHandler, sendSuccess } from "../lib/apiEnvelope.js";

export function createNutritionRouter({ service }) {
  const router = Router();

  router.post(
    "/photo-analyze",
    asyncHandler(async (req, res) => {
      const data = await service.analyzeMealPhoto(req.body || {});
      sendSuccess(res, req, data);
    })
  );

  return router;
}

