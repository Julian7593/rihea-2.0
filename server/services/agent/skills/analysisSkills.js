import {
  defineSkill,
  SKILL_CAPABILITY_TYPE,
  SKILL_PERMISSION_LEVEL,
  SKILL_SIDE_EFFECT_LEVEL,
} from "./platform/contracts.js";

function average(list = []) {
  if (!list.length) return null;
  const total = list.reduce((sum, item) => sum + item, 0);
  return Number((total / list.length).toFixed(2));
}

function normalizeCheckins(value = []) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => ({
      mood: Number.isFinite(Number(item?.mood)) ? Number(item.mood) : null,
      sleepHours: Number.isFinite(Number(item?.sleepHours)) ? Number(item.sleepHours) : null,
      tag: String(item?.tag || "").trim().slice(0, 40),
      date: String(item?.date || "").trim().slice(0, 40),
    }))
    .filter((item) => item.mood !== null || item.sleepHours !== null)
    .slice(-30);
}

function normalizeFoods(value = []) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => ({
      sourceLabel: String(item?.sourceLabel || item?.name || "").trim().slice(0, 80),
      confidence: Number.isFinite(Number(item?.confidence)) ? Number(item.confidence) : null,
      category: String(item?.category || "other").trim().toLowerCase().slice(0, 40) || "other",
    }))
    .filter((item) => item.sourceLabel);
}

function summarizeTrend(avgMood = null, lowMoodDays = 0) {
  if (avgMood === null) return "unknown";
  if (avgMood < 2.5 || lowMoodDays >= 3) return "declining";
  if (avgMood >= 4) return "improving";
  return "stable";
}

export function createSearchContentRecommendationsSkill({ knowledgeBaseService }) {
  return defineSkill({
    id: "search_content_recommendations",
    name: "search_content_recommendations",
    version: "1.0.0",
    category: "retrieval",
    capability_type: SKILL_CAPABILITY_TYPE.RETRIEVAL,
    permission_level: SKILL_PERMISSION_LEVEL.READ,
    side_effect_level: SKILL_SIDE_EFFECT_LEVEL.NONE,
    input_schema: {
      type: "object",
      required: ["query"],
      properties: {
        query: { type: "string" },
        topic: { type: "string" },
        tenantId: { type: "string" },
        principalIds: { type: "array", items: { type: "string" } },
        topK: { type: "number" },
        lang: { type: "string" },
      },
    },
    output_schema: { type: "object" },
    summarizeInput: (input = {}) => ({
      query: String(input?.query || "").slice(0, 120),
      topic: String(input?.topic || "").slice(0, 48),
      topK: Number.isFinite(Number(input?.topK)) ? Number(input.topK) : 4,
    }),
    summarizeOutput: (output = {}) => ({
      total: Number(output?.total || 0),
      items: Array.isArray(output?.items) ? output.items.length : 0,
    }),
    async handler(input = {}, ctx = {}) {
      if (!knowledgeBaseService || typeof knowledgeBaseService.search !== "function") {
        return {
          total: 0,
          items: [],
          unavailable: true,
        };
      }

      const result = knowledgeBaseService.search({
        query: input?.query || ctx?.message || "",
        tenantId: input?.tenantId || ctx?.clientContext?.tenantId || "rihea-default",
        principalIds: Array.isArray(input?.principalIds)
          ? input.principalIds
          : Array.isArray(ctx?.clientContext?.principalIds)
            ? ctx.clientContext.principalIds
            : [],
        tags: input?.topic ? [input.topic] : [],
        lang: input?.lang || ctx?.lang || "zh",
        topK: input?.topK || 4,
      });

      return {
        total: result.total,
        items: Array.isArray(result?.hits)
          ? result.hits.map((item) => ({
              id: item.document_id,
              title: item.title,
              source_type: item.source_type,
              summary: item.summary,
              recommendation_reason: item.tags?.[0] || item.source_type,
              score: item.score,
            }))
          : [],
      };
    },
  });
}

export function createAnalyzeEmotionalTrendsSkill() {
  return defineSkill({
    id: "analyze_emotional_trends",
    name: "analyze_emotional_trends",
    version: "1.0.0",
    category: "analysis",
    capability_type: SKILL_CAPABILITY_TYPE.ANALYSIS,
    permission_level: SKILL_PERMISSION_LEVEL.ANALYZE,
    side_effect_level: SKILL_SIDE_EFFECT_LEVEL.NONE,
    input_schema: {
      type: "object",
      required: [],
      properties: {
        checkIns: { type: "array" },
        windowDays: { type: "number" },
      },
    },
    output_schema: { type: "object" },
    async handler(input = {}, ctx = {}) {
      const checkIns = normalizeCheckins(input?.checkIns || ctx?.clientContext?.checkIns || []);
      const moods = checkIns.map((item) => item.mood).filter((item) => item !== null);
      const avgMood = average(moods);
      const lowMoodDays = moods.filter((item) => item <= 2).length;
      const sleepValues = checkIns.map((item) => item.sleepHours).filter((item) => item !== null);
      const avgSleep = average(sleepValues);

      return {
        trend: summarizeTrend(avgMood, lowMoodDays),
        average_mood: avgMood,
        low_mood_days: lowMoodDays,
        average_sleep_hours: avgSleep,
        summary:
          avgMood === null
            ? "Not enough check-in data yet."
            : `Average mood ${avgMood}, low mood days ${lowMoodDays}, average sleep ${avgSleep ?? "unknown"} hours.`,
      };
    },
  });
}

export function createExplainRiskLevelSkill() {
  return defineSkill({
    id: "explain_risk_level",
    name: "explain_risk_level",
    version: "1.0.0",
    category: "analysis",
    capability_type: SKILL_CAPABILITY_TYPE.ANALYSIS,
    permission_level: SKILL_PERMISSION_LEVEL.ANALYZE,
    side_effect_level: SKILL_SIDE_EFFECT_LEVEL.NONE,
    input_schema: {
      type: "object",
      required: ["riskLevel"],
      properties: {
        riskLevel: { type: "string", enum: ["R0", "R1", "R2", "R3"] },
        reasons: { type: "array", items: { type: "string" } },
      },
    },
    output_schema: { type: "object" },
    async handler(input = {}) {
      const reasons = Array.isArray(input?.reasons) ? input.reasons.slice(0, 6) : [];
      const mapping = {
        R0: { urgency: "low", explanation: "No urgent signal detected." },
        R1: { urgency: "watch", explanation: "Mild emotional strain detected; supportive follow-up is helpful." },
        R2: { urgency: "high", explanation: "High-risk concern detected; in-person assessment should be prioritized soon." },
        R3: { urgency: "critical", explanation: "Urgent risk detected; immediate safety support is recommended." },
      };
      return {
        risk_level: input.riskLevel,
        urgency: mapping[input.riskLevel]?.urgency || "unknown",
        explanation: mapping[input.riskLevel]?.explanation || "Risk level unavailable.",
        reasons,
      };
    },
  });
}

export function createAnalyzeNutritionStructureSkill() {
  return defineSkill({
    id: "analyze_nutrition_structure",
    name: "analyze_nutrition_structure",
    version: "1.0.0",
    category: "analysis",
    capability_type: SKILL_CAPABILITY_TYPE.ANALYSIS,
    permission_level: SKILL_PERMISSION_LEVEL.ANALYZE,
    side_effect_level: SKILL_SIDE_EFFECT_LEVEL.NONE,
    input_schema: {
      type: "object",
      required: [],
      properties: {
        detectedFoods: { type: "array" },
      },
    },
    output_schema: { type: "object" },
    async handler(input = {}) {
      const foods = normalizeFoods(input?.detectedFoods || []);
      const categories = foods.reduce((acc, item) => {
        acc[item.category] = (acc[item.category] || 0) + 1;
        return acc;
      }, {});
      const hasProtein = Boolean(categories.protein || categories.legumes || categories.dairy);
      const hasVegetables = Boolean(categories.vegetables);
      const hasCarbs = Boolean(categories.carbs);

      return {
        detected_count: foods.length,
        category_breakdown: categories,
        balance: hasProtein && hasVegetables && hasCarbs ? "balanced" : "needs_adjustment",
        summary:
          foods.length === 0
            ? "No reliable food structure detected."
            : `Detected ${foods.length} foods; protein=${hasProtein}, vegetables=${hasVegetables}, carbs=${hasCarbs}.`,
      };
    },
  });
}

export function createAnalyzeSleepPatternSkill() {
  return defineSkill({
    id: "analyze_sleep_pattern",
    name: "analyze_sleep_pattern",
    version: "1.0.0",
    category: "analysis",
    capability_type: SKILL_CAPABILITY_TYPE.ANALYSIS,
    permission_level: SKILL_PERMISSION_LEVEL.ANALYZE,
    side_effect_level: SKILL_SIDE_EFFECT_LEVEL.NONE,
    input_schema: {
      type: "object",
      required: [],
      properties: {
        checkIns: { type: "array" },
      },
    },
    output_schema: { type: "object" },
    async handler(input = {}, ctx = {}) {
      const checkIns = normalizeCheckins(input?.checkIns || ctx?.clientContext?.checkIns || []);
      const sleepValues = checkIns.map((item) => item.sleepHours).filter((item) => item !== null);
      const avgSleep = average(sleepValues);
      const shortSleepDays = sleepValues.filter((item) => item < 6).length;

      return {
        average_sleep_hours: avgSleep,
        short_sleep_days: shortSleepDays,
        pattern:
          avgSleep === null ? "unknown" : avgSleep < 6 || shortSleepDays >= 3 ? "sleep_risk" : "stable_sleep",
        summary:
          avgSleep === null
            ? "Not enough sleep data."
            : `Average sleep ${avgSleep} hours with ${shortSleepDays} short-sleep day(s).`,
      };
    },
  });
}

export function createAnalyzeMealPhotoSkill({ nutritionService }) {
  return defineSkill({
    id: "analyze_meal_photo",
    name: "analyze_meal_photo",
    version: "1.0.0",
    category: "analysis",
    capability_type: SKILL_CAPABILITY_TYPE.ANALYSIS,
    permission_level: SKILL_PERMISSION_LEVEL.ANALYZE,
    side_effect_level: SKILL_SIDE_EFFECT_LEVEL.NONE,
    input_schema: {
      type: "object",
      required: ["imageBase64"],
      properties: {
        imageBase64: { type: "string", minLength: 1 },
        mealType: { type: "string" },
        fileName: { type: "string" },
        pregnancyWeek: { type: "string" },
      },
    },
    output_schema: { type: "object" },
    summarizeInput: () => ({
      hasImage: true,
    }),
    summarizeOutput: (output = {}) => ({
      detectedFoods: Array.isArray(output?.detectedFoods) ? output.detectedFoods.length : 0,
      needsUserConfirmation: Boolean(output?.needsUserConfirmation),
    }),
    async handler(input = {}, ctx = {}) {
      if (!nutritionService || typeof nutritionService.analyzeMealPhoto !== "function") {
        return {
          detectedFoods: [],
          pregnancyAdvice: [],
          needsUserConfirmation: true,
          disclaimer: "Nutrition analysis unavailable.",
        };
      }

      return nutritionService.analyzeMealPhoto({
        imageBase64: input.imageBase64,
        mealType: input.mealType,
        fileName: input.fileName,
        pregnancyWeek: input.pregnancyWeek || ctx?.clientContext?.profile?.pregnancyWeek || "",
        allergies: Array.isArray(ctx?.clientContext?.profile?.allergies) ? ctx.clientContext.profile.allergies : [],
        medicalContraindications: ctx?.clientContext?.profile?.medicalContraindications || {},
        riskLevel: ctx?.clientContext?.profile?.riskLevel || "low",
      });
    },
  });
}
