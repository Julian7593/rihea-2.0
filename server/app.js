import { randomUUID } from "node:crypto";
import cors from "cors";
import express from "express";
import { sendError, sendSuccess } from "./lib/apiEnvelope.js";
import { createAgentRouter } from "./routes/agentRoutes.js";
import { createCbtRouter } from "./routes/cbtRoutes.js";
import { createKnowledgeRouter } from "./routes/knowledgeRoutes.js";
import { createNutritionRouter } from "./routes/nutritionRoutes.js";
import { createPartnerSyncRouter } from "./routes/partnerSyncRoutes.js";

export function createApp({
  partnerSyncService,
  cbtService,
  nutritionService = null,
  agentOrchestratorService,
  knowledgeBaseService = null,
  corsOrigin = true,
}) {
  const app = express();

  app.use(cors({ origin: corsOrigin }));
  app.use(express.json());

  app.use((req, res, next) => {
    req.requestId = randomUUID();
    res.setHeader("x-request-id", req.requestId);
    next();
  });

  app.get("/health", (req, res) => {
    sendSuccess(res, req, {
      service: "rihea-app-services",
      status: "ok",
      timestamp: new Date().toISOString(),
    });
  });

  app.use("/v1/partner-sync", createPartnerSyncRouter({ service: partnerSyncService }));
  app.use("/v1/cbt", createCbtRouter({ service: cbtService }));
  if (nutritionService) {
    app.use("/v1/nutrition", createNutritionRouter({ service: nutritionService }));
  }
  if (knowledgeBaseService) {
    app.use("/v1/knowledge", createKnowledgeRouter({ service: knowledgeBaseService }));
  }
  if (agentOrchestratorService) {
    app.use("/v1/agent", createAgentRouter({ service: agentOrchestratorService }));
  }

  app.use((req, res) => {
    const error = new Error(`Route not found: ${req.method} ${req.path}`);
    error.code = "NOT_FOUND";
    error.statusCode = 404;
    sendError(res, req, error);
  });

  app.use((error, req, res, next) => {
    sendError(res, req, error);
  });

  return app;
}
