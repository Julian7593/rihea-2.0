import { createApp } from "./app.js";
import { serverConfig } from "./config.js";
import { createAgentAuditLogger, createInitialAgentAuditState } from "./services/agent/audit/agentAuditLogger.js";
import { createIntentClassifier } from "./services/agent/intents/intentClassifier.js";
import { createModelGateway } from "./services/agent/llm-gateway/modelGateway.js";
import { createDeepseekAdapter } from "./services/agent/llm-gateway/adapters/deepseekAdapter.js";
import { createDoubaoAdapter } from "./services/agent/llm-gateway/adapters/doubaoAdapter.js";
import { createOpenaiAdapter } from "./services/agent/llm-gateway/adapters/openaiAdapter.js";
import { createInitialSessionMemoryState, createSessionMemoryStore } from "./services/agent/memory/sessionMemoryStore.js";
import { createInitialUserStateMemoryState, createUserStateMemoryStore } from "./services/agent/memory/userStateMemoryStore.js";
import { createAgentOrchestratorService } from "./services/agent/orchestratorService.js";
import { createFeishuClient } from "./services/agent/feishu/feishuClient.js";
import { createFeishuLiveService } from "./services/agent/feishu/feishuLiveService.js";
import { createFeishuSyncIndex } from "./services/agent/feishu/feishuSyncIndex.js";
import { createGroundedRetrievalService } from "./services/agent/grounding/groundedRetrievalService.js";
import { createRouterAgent } from "./services/agent/routerAgent.js";
import { createKnowledgeBaseService } from "./services/knowledge/knowledgeBaseService.js";
import { createNutritionPhotoAnalyzer, createNutritionService } from "./services/nutritionService.js";
import { createPromptPresetService } from "./services/agent/presets/presetCatalog.js";
import { createEmotionalSupportAgent } from "./services/agent/subAgents/emotionalSupportAgent.js";
import { createFeatureGuideAgent } from "./services/agent/subAgents/featureGuideAgent.js";
import { createWebSearchService } from "./services/agent/web-search/webSearchService.js";
import { createCbtService, createInitialCbtServiceState } from "./services/cbtService.js";
import { createPartnerSyncService, createInitialPartnerSyncState } from "./services/partnerSyncService.js";
import { createJsonFileStore } from "./store/jsonStore.js";

const partnerStore = createJsonFileStore({
  filePath: serverConfig.partnerSyncDataFilePath,
  createInitialState: () => createInitialPartnerSyncState(),
});
const cbtStore = createJsonFileStore({
  filePath: serverConfig.cbtDataFilePath,
  createInitialState: () => createInitialCbtServiceState(),
});
const agentSessionStore = createJsonFileStore({
  filePath: serverConfig.agentSessionDataFilePath,
  createInitialState: () => createInitialSessionMemoryState(),
});
const agentUserStateStore = createJsonFileStore({
  filePath: serverConfig.agentUserStateDataFilePath,
  createInitialState: () => createInitialUserStateMemoryState(),
});
const agentAuditStore = createJsonFileStore({
  filePath: serverConfig.agentAuditDataFilePath,
  createInitialState: () => createInitialAgentAuditState(),
});

const partnerSyncService = createPartnerSyncService({ store: partnerStore });
const cbtService = createCbtService({ store: cbtStore });
const nutritionPhotoAnalyzer = createNutritionPhotoAnalyzer({
  provider: serverConfig.nutritionPhotoAnalysis.provider,
  apiKey: serverConfig.nutritionPhotoAnalysis.logmealApiKey,
  baseUrl: serverConfig.nutritionPhotoAnalysis.logmealBaseUrl,
  timeoutMs: serverConfig.nutritionPhotoAnalysis.timeoutMs,
  zhipuApiKey: serverConfig.nutritionPhotoAnalysis.zhipuApiKey,
  zhipuBaseUrl: serverConfig.nutritionPhotoAnalysis.zhipuBaseUrl,
  zhipuVisionModel: serverConfig.nutritionPhotoAnalysis.zhipuVisionModel,
  zhipuVisionTimeoutMs: serverConfig.nutritionPhotoAnalysis.zhipuVisionTimeoutMs,
});
const nutritionService = createNutritionService({
  photoAnalyzer: nutritionPhotoAnalyzer,
});
const agentAuditLogger = createAgentAuditLogger({ store: agentAuditStore });
const sessionMemoryStore = createSessionMemoryStore({ store: agentSessionStore });
const userStateMemoryStore = createUserStateMemoryStore({ store: agentUserStateStore });
const modelGateway = createModelGateway({
  adapters: {
    deepseek: createDeepseekAdapter({
      apiKey: serverConfig.providers.deepseek.apiKey,
      baseUrl: serverConfig.providers.deepseek.baseUrl,
    }),
    doubao: createDoubaoAdapter({
      apiKey: serverConfig.providers.doubao.apiKey,
      baseUrl: serverConfig.providers.doubao.baseUrl,
    }),
    openai: createOpenaiAdapter({
      apiKey: serverConfig.providers.openai.apiKey,
      baseUrl: serverConfig.providers.openai.baseUrl,
    }),
  },
  config: serverConfig.modelGateway,
});
const llmEvaluator = async ({ message, lang, baseClassification, modelPreference }) =>
  modelGateway.evaluateIntent({
    message,
    lang,
    baseClassification,
    modelPreference,
  });
const intentClassifier = createIntentClassifier({
  llmEvaluator,
});
const routerAgent = createRouterAgent({
  intentClassifier,
});
const feishuSyncIndex = createFeishuSyncIndex({
  filePath: serverConfig.feishuKnowledge.syncFilePath,
});
const feishuClient = createFeishuClient({
  appId: serverConfig.feishuKnowledge.appId,
  appSecret: serverConfig.feishuKnowledge.appSecret,
  baseUrl: serverConfig.feishuKnowledge.baseUrl,
});
const feishuLiveService = createFeishuLiveService({
  config: serverConfig.feishuKnowledge,
  feishuClient,
});
const knowledgeBaseService = serverConfig.knowledgeBase.enabled
  ? createKnowledgeBaseService({
      config: {
        ...serverConfig.knowledgeBase,
        feishuSyncFilePath: serverConfig.feishuKnowledge.syncFilePath,
        feishuSyncEnabled: serverConfig.feishuKnowledge.syncEnabled,
      },
    })
  : null;
const groundedRetrievalService = createGroundedRetrievalService({
  config: serverConfig.feishuKnowledge,
});
const promptPresetService = createPromptPresetService();
const emotionalSupportAgent = createEmotionalSupportAgent({
  modelGateway,
  groundedRetrievalService,
});
const featureGuideAgent = createFeatureGuideAgent({
  modelGateway,
  groundedRetrievalService,
});
const webSearchService = createWebSearchService({
  config: serverConfig.webSearch,
});
const agentOrchestratorService = createAgentOrchestratorService({
  sessionMemoryStore,
  userStateMemoryStore,
  auditLogger: agentAuditLogger,
  cbtService,
  knowledgeBaseService,
  nutritionService,
  feishuSyncIndex,
  feishuLiveService,
  webSearchService,
  promptPresetService,
  routerAgent,
  emotionalSupportAgent,
  featureGuideAgent,
});
const app = createApp({
  partnerSyncService,
  cbtService,
  nutritionService,
  agentOrchestratorService,
  knowledgeBaseService,
  corsOrigin: serverConfig.corsOrigin,
});

app.listen(serverConfig.port, serverConfig.host, () => {
  console.log(
    `[rihea-server] listening on http://${serverConfig.host}:${serverConfig.port} using ${serverConfig.partnerSyncDataFilePath}, ${serverConfig.cbtDataFilePath}, ${serverConfig.agentSessionDataFilePath}, ${serverConfig.agentUserStateDataFilePath}, ${serverConfig.agentAuditDataFilePath}`
  );
});
