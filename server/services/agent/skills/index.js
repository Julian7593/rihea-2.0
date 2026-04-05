import { createSearchLocalKbSkill } from "./searchLocalKbSkill.js";
import { createSearchFeishuSyncSkill } from "./searchFeishuSyncSkill.js";
import { createSearchFeishuLiveSkill } from "./searchFeishuLiveSkill.js";
import { createSearchWebSkill } from "./searchWebSkill.js";
import { createSearchKnowledgeBaseSkill } from "./searchKnowledgeBaseSkill.js";
import {
  createAnalyzeEmotionalTrendsSkill,
  createAnalyzeMealPhotoSkill,
  createAnalyzeNutritionStructureSkill,
  createAnalyzeSleepPatternSkill,
  createExplainRiskLevelSkill,
  createSearchContentRecommendationsSkill,
} from "./analysisSkills.js";
import {
  createRecordUserStateDraftSkill,
  createReferralDraftSkill,
  createReminderDraftSkill,
  createSupportPlanDraftSkill,
} from "./actionSkills.js";
import { getWorkflowSkillManifests } from "./workflowSkills.js";

export function getBuiltInSkillManifests({
  kbIndex,
  feishuSyncIndex,
  feishuLiveService,
  webSearchService,
  knowledgeBaseService,
  nutritionService,
} = {}) {
  return [
    createSearchKnowledgeBaseSkill({ knowledgeBaseService }),
    createSearchLocalKbSkill({ kbIndex }),
    createSearchFeishuSyncSkill({ feishuSyncIndex }),
    createSearchFeishuLiveSkill({ feishuLiveService }),
    createSearchWebSkill({ webSearchService }),
    createSearchContentRecommendationsSkill({ knowledgeBaseService }),
    createAnalyzeEmotionalTrendsSkill(),
    createExplainRiskLevelSkill(),
    createAnalyzeNutritionStructureSkill(),
    createAnalyzeSleepPatternSkill(),
    createAnalyzeMealPhotoSkill({ nutritionService }),
    createReminderDraftSkill(),
    createSupportPlanDraftSkill(),
    createReferralDraftSkill(),
    createRecordUserStateDraftSkill(),
    ...getWorkflowSkillManifests(),
  ];
}
