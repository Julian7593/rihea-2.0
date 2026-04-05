/**
 * 营养计算器和推荐引擎
 * 基于孕周、BMI、风险等级生成个性化饮食建议
 */

import {
  nutritionContent,
  PREGNANCY_TRIMESTERS,
  BMI_CATEGORIES,
  NUTRITION_STANDARDS,
} from "../data/nutritionContent.js";
import { calcPregnancyWeekByDueDate, normalizeWeekLabel } from "./pregnancy.js";

const PHOTO_ANALYSIS_DISCLAIMER =
  "拍照识别结果仅用于孕期饮食记录与科普提醒，不能替代医生或营养师建议。";

const RECOGNIZED_FOOD_ALIASES = {
  egg: ["鸡蛋", "蛋", "水煮蛋", "煎蛋", "egg", "eggs"],
  milk: ["牛奶", "奶", "milk"],
  yogurt: ["酸奶", "yogurt", "yoghurt"],
  cheese: ["奶酪", "cheese"],
  spinach: ["菠菜", "spinach"],
  broccoli: ["西兰花", "花椰菜", "broccoli"],
  carrot: ["胡萝卜", "carrot"],
  apple: ["苹果", "apple"],
  banana: ["香蕉", "banana"],
  orange: ["橙子", "orange", "orange fruit"],
  brown_rice: ["糙米", "米饭", "白米饭", "rice", "brown rice"],
  whole_wheat_bread: ["全麦面包", "面包", "吐司", "bread", "toast"],
  oatmeal: ["燕麦", "oatmeal", "porridge"],
  black_bean: ["黑豆", "豆子", "beans", "black bean"],
  lentil: ["扁豆", "lentil", "lentils"],
  walnut: ["核桃", "walnut", "walnuts"],
  almond: ["杏仁", "almond", "almonds"],
  chia_seed: ["奇亚籽", "chia", "chia seed"],
  tofu: ["豆腐", "tofu"],
  chicken_breast: ["鸡胸肉", "鸡肉", "鸡排", "chicken", "chicken breast"],
  fish_salmon: ["三文鱼", "鱼", "salmon", "fish"],
  beef_lean: ["瘦牛肉", "牛肉", "beef"],
};

const SPECIAL_RISK_RULES = [
  {
    id: "alcohol",
    type: "avoid",
    message: "识别到疑似酒精饮品，孕期建议避免饮酒。",
    keywords: ["酒", "啤酒", "红酒", "wine", "beer", "cocktail", "alcohol", "liquor"],
  },
  {
    id: "raw_fish",
    type: "avoid",
    message: "识别到疑似生食海鲜，孕期建议避免未熟海鲜和寿司类生食。",
    keywords: ["寿司", "刺身", "生鱼片", "sushi", "sashimi", "raw fish", "raw seafood"],
  },
  {
    id: "raw_egg",
    type: "avoid",
    message: "识别到疑似未熟蛋类，孕期建议避免溏心蛋或生蛋制品。",
    keywords: ["溏心蛋", "生蛋", "raw egg", "soft boiled egg", "runny egg"],
  },
  {
    id: "unpasteurized_cheese",
    type: "avoid",
    message: "识别到疑似软质奶酪，孕期请确认是否为巴氏杀菌奶酪。",
    keywords: ["布里", "卡门培尔", "蓝纹奶酪", "brie", "camembert", "blue cheese"],
  },
  {
    id: "high_mercury_fish",
    type: "avoid",
    message: "识别到疑似高汞鱼类，孕期建议避免鲨鱼、旗鱼等高汞鱼。",
    keywords: ["鲨鱼", "旗鱼", "shark", "swordfish", "king mackerel"],
  },
  {
    id: "caffeine",
    type: "caution",
    message: "识别到含咖啡因饮品，孕期建议控制总咖啡因摄入。",
    keywords: ["咖啡", "浓茶", "coffee", "espresso", "latte", "cappuccino", "black tea"],
  },
  {
    id: "high_sugar",
    type: "caution",
    message: "识别到甜饮或高糖点心，孕期建议留意糖分摄入。",
    keywords: ["蛋糕", "甜甜圈", "奶茶", "cake", "donut", "boba", "milk tea", "soda"],
  },
];

const DEFAULT_MEAL_FOOD_IDS = {
  breakfast: ["egg", "milk", "whole_wheat_bread"],
  lunch: ["brown_rice", "chicken_breast", "broccoli"],
  dinner: ["brown_rice", "tofu", "spinach"],
  snack: ["yogurt", "banana", "walnut"],
};

const NON_FOOD_HINTS = ["cat", "dog", "pet", "desk", "person", "pill", "medicine", "药盒", "人物", "桌面", "宠物"];

function normalizeFoodSearchText(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/[()（）[\]【】,.!?，。！？]/g, " ")
    .replace(/\s+/g, " ");
}

function includesFoodAlias(input, alias) {
  const normalizedInput = normalizeFoodSearchText(input);
  const normalizedAlias = normalizeFoodSearchText(alias);
  return normalizedInput.includes(normalizedAlias);
}

function uniqueBy(items, getKey) {
  const seen = new Set();
  const result = [];
  for (const item of items) {
    const key = getKey(item);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }
  return result;
}

export function findFoodIdByLabel(label) {
  const normalized = normalizeFoodSearchText(label);
  if (!normalized) return "";

  for (const [foodId, aliases] of Object.entries(RECOGNIZED_FOOD_ALIASES)) {
    if (aliases.some((alias) => includesFoodAlias(normalized, alias))) {
      return foodId;
    }
  }

  return "";
}

export function normalizeRecognizedFoods(recognizedFoods = []) {
  if (!Array.isArray(recognizedFoods)) return [];

  const normalizedFoods = recognizedFoods
    .map((item, index) => {
      const sourceLabel =
        typeof item?.sourceLabel === "string"
          ? item.sourceLabel
          : typeof item?.label === "string"
            ? item.label
            : typeof item?.name === "string"
              ? item.name
              : "";
      const foodId = item?.foodId && nutritionContent.foodDatabase[item.foodId] ? item.foodId : findFoodIdByLabel(sourceLabel);
      const food = foodId ? nutritionContent.foodDatabase[foodId] : null;
      const confidence = Number(item?.confidence);

      return {
        id: typeof item?.id === "string" ? item.id : foodId || `recognized_${index + 1}`,
        foodId: foodId || null,
        name: food?.name || sourceLabel || `识别食物${index + 1}`,
        sourceLabel: sourceLabel || food?.name || `识别食物${index + 1}`,
        confidence: Number.isFinite(confidence) ? Math.max(0, Math.min(1, confidence)) : 0.68,
        category: item?.category || food?.category || "other",
      };
    })
    .filter((item) => item.sourceLabel);

  return uniqueBy(normalizedFoods, (item) => `${item.foodId || "raw"}:${normalizeFoodSearchText(item.sourceLabel)}`);
}

export function buildMockRecognizedFoods({ fileName = "", mealType = "snack" } = {}) {
  const normalizedFileName = normalizeFoodSearchText(fileName);
  if (NON_FOOD_HINTS.some((hint) => normalizedFileName.includes(hint))) {
    return [];
  }

  const specialRiskMatches = SPECIAL_RISK_RULES
    .filter((rule) => rule.keywords.some((keyword) => includesFoodAlias(normalizedFileName, keyword)))
    .map((rule, index) => ({
      id: `risk_${rule.id}_${index + 1}`,
      foodId: null,
      name: rule.keywords[0],
      sourceLabel: rule.keywords[0],
      confidence: 0.74,
      category: "other",
    }));

  const matchedFoodIds = uniqueBy(
    Object.entries(RECOGNIZED_FOOD_ALIASES)
      .filter(([, aliases]) => aliases.some((alias) => includesFoodAlias(normalizedFileName, alias)))
      .map(([foodId]) => foodId),
    (item) => item
  );

  const foodIds = matchedFoodIds.length > 0 ? matchedFoodIds : DEFAULT_MEAL_FOOD_IDS[mealType] || DEFAULT_MEAL_FOOD_IDS.snack;

  const matchedFoods = foodIds.map((foodId, index) => {
    const food = nutritionContent.foodDatabase[foodId];
    return {
      id: `mock_${foodId}_${index + 1}`,
      foodId,
      name: food?.name || foodId,
      sourceLabel: food?.name || foodId,
      confidence: matchedFoodIds.length > 0 ? 0.84 : 0.62,
      category: food?.category || "other",
    };
  });

  return [...specialRiskMatches, ...matchedFoods];
}

function getRestrictionMatches(label, trimester) {
  const normalized = normalizeFoodSearchText(label);
  const restrictions = nutritionContent.dietRestrictions || { avoid: [], limit: [] };
  const scopedAvoid = restrictions.avoid.filter((item) => !trimester || item.trimesters?.includes(trimester));
  const scopedLimit = restrictions.limit.filter((item) => !trimester || item.trimesters?.includes(trimester));

  const avoidMatches = scopedAvoid.filter((restriction) =>
    [restriction.name, restriction.nameEn, ...(restriction.examples || [])].some((entry) => includesFoodAlias(normalized, entry))
  );
  const limitMatches = scopedLimit.filter((restriction) =>
    [restriction.name, restriction.nameEn, ...(restriction.examples || [])].some((entry) => includesFoodAlias(normalized, entry))
  );

  return { avoidMatches, limitMatches };
}

function getSpecialRiskMatches(label) {
  const normalized = normalizeFoodSearchText(label);
  return SPECIAL_RISK_RULES.filter((rule) => rule.keywords.some((keyword) => includesFoodAlias(normalized, keyword)));
}

function hasCategory(recognizedFoods, category) {
  return recognizedFoods.some((item) => item.category === category);
}

function hasFoodIds(recognizedFoods, foodIds = []) {
  return recognizedFoods.some((item) => foodIds.includes(item.foodId));
}

function buildNutrientHighlights(recognizedFoods) {
  const nutrientRules = [
    {
      nutrient: "protein",
      label: "蛋白质",
      matches: (food) =>
        food?.category === "protein" ||
        food?.category === "legumes" ||
        food?.category === "dairy" ||
        (food?.nutrition?.protein || 0) >= 6,
      reason: "有助于支持孕期组织生长和日常饱腹感。",
    },
    {
      nutrient: "calcium",
      label: "钙",
      matches: (food) => food?.category === "dairy" || ["tofu", "almond", "chia_seed"].includes(food?.id) || (food?.nutrition?.calcium || 0) >= 90,
      reason: "有助于支持骨骼健康与钙摄入。",
    },
    {
      nutrient: "iron",
      label: "铁",
      matches: (food) => ["spinach", "beef_lean", "black_bean", "lentil"].includes(food?.id) || (food?.nutrition?.iron || 0) >= 2,
      reason: "可帮助补充孕期常关注的铁来源。",
    },
    {
      nutrient: "folic_acid",
      label: "叶酸",
      matches: (food) => ["spinach", "broccoli", "lentil", "orange", "black_bean"].includes(food?.id) || (food?.nutrition?.folicAcid || 0) >= 60,
      reason: "对孕期日常叶酸补充方向更友好。",
    },
    {
      nutrient: "omega3",
      label: "Omega-3",
      matches: (food) => ["fish_salmon", "walnut", "chia_seed"].includes(food?.id) || (food?.nutrition?.omega3 || 0) >= 200,
      reason: "可作为 Omega-3 的友好来源。",
    },
  ];

  return nutrientRules
    .map((rule) => {
      const foods = recognizedFoods
        .filter((item) => item.foodId && nutritionContent.foodDatabase[item.foodId])
        .map((item) => ({ ...nutritionContent.foodDatabase[item.foodId], id: item.foodId }))
        .filter((food) => rule.matches(food))
        .map((food) => food.name);

      if (foods.length === 0) return null;

      return {
        nutrient: rule.nutrient,
        label: rule.label,
        foods: Array.from(new Set(foods)),
        reason: rule.reason,
      };
    })
    .filter(Boolean);
}

export function buildPregnancyFoodPhotoAdvice({ recognizedFoods = [], profile = {} } = {}) {
  const normalizedFoods = normalizeRecognizedFoods(recognizedFoods);
  const trimester = getPregnancyTrimester(profile?.pregnancyWeek);
  const allergies = Array.isArray(profile?.allergies) ? profile.allergies : [];
  const medicalDietContraindications =
    Array.isArray(profile?.medicalContraindications?.diet) ? profile.medicalContraindications.diet : [];

  const safe = [];
  const caution = [];
  const avoid = [];

  for (const item of normalizedFoods) {
    const { avoidMatches, limitMatches } = getRestrictionMatches(item.sourceLabel, trimester);
    const specialRiskMatches = getSpecialRiskMatches(item.sourceLabel);

    avoidMatches.forEach((match) => avoid.push(`${item.name}：${match.reason}`));
    limitMatches.forEach((match) => caution.push(`${item.name}：${match.reason}`));
    specialRiskMatches.forEach((match) => {
      if (match.type === "avoid") avoid.push(match.message);
      else caution.push(match.message);
    });

    if (item.foodId && isFoodAllergic(item.foodId, allergies)) {
      avoid.push(`${item.name} 与你的过敏信息可能冲突，建议先确认后再食用。`);
    }

    if (
      medicalDietContraindications.some((entry) => includesFoodAlias(item.sourceLabel, entry) || includesFoodAlias(item.name, entry))
    ) {
      caution.push(`${item.name} 与当前饮食禁忌信息可能冲突，请先按医生要求确认。`);
    }
  }

  const nutrientHighlights = buildNutrientHighlights(normalizedFoods);

  if (nutrientHighlights.length > 0) {
    nutrientHighlights.slice(0, 2).forEach((highlight) => {
      safe.push(`${highlight.foods.join("、")} 可帮助补充${highlight.label}。`);
    });
  }

  const actions = [];
  if (avoid.length > 0) {
    actions.push("这餐里有需要避免的项目，建议先替换为熟食、低风险食材后再记录。");
  }
  if (!hasCategory(normalizedFoods, "protein") && !hasCategory(normalizedFoods, "dairy") && !hasCategory(normalizedFoods, "legumes")) {
    actions.push("这餐蛋白质来源偏少，可补充鸡蛋、豆腐、酸奶或熟肉类。");
  }
  if (!hasCategory(normalizedFoods, "vegetables")) {
    actions.push("可搭配一份深绿叶菜，帮助补充叶酸和膳食纤维。");
  }
  if (!hasCategory(normalizedFoods, "dairy") && !hasFoodIds(normalizedFoods, ["tofu", "almond", "chia_seed"])) {
    actions.push("若今天奶制品或豆制品较少，可在加餐补一份牛奶、酸奶或豆腐。");
  }

  return {
    safe: uniqueBy(safe, (item) => item).slice(0, 3),
    caution: uniqueBy(caution, (item) => item).slice(0, 3),
    avoid: uniqueBy(avoid, (item) => item).slice(0, 3),
    nutrientHighlights,
    actions: uniqueBy(actions, (item) => item).slice(0, 3),
    disclaimer: PHOTO_ANALYSIS_DISCLAIMER,
  };
}

export function estimateRecognizedFoodNutrition(recognizedFoods = []) {
  const foods = normalizeRecognizedFoods(recognizedFoods)
    .filter((item) => item.foodId)
    .map((item) => ({
      foodId: item.foodId,
      count: 1,
    }));

  return calculateMealNutrition(foods);
}

export function buildFoodPhotoAnalysisFallback({ fileName = "", mealType = "snack", profile = {} } = {}) {
  const detectedFoods = buildMockRecognizedFoods({ fileName, mealType });
  const pregnancyAdvice = buildPregnancyFoodPhotoAdvice({
    recognizedFoods: detectedFoods,
    profile,
  });

  return {
    detectedFoods,
    pregnancyAdvice,
    needsUserConfirmation: true,
    disclaimer: PHOTO_ANALYSIS_DISCLAIMER,
  };
}

export function getFoodPhotoAnalysisDisclaimer() {
  return PHOTO_ANALYSIS_DISCLAIMER;
}

/**
 * 计算BMI
 */
export function calculateBMI(heightCm, weightKg) {
  if (!heightCm || !weightKg || heightCm <= 0 || weightKg <= 0) {
    return null;
  }
  const heightM = heightCm / 100;
  return Number((weightKg / (heightM * heightM)).toFixed(1));
}

/**
 * 获取BMI分类
 */
export function getBMICategory(bmi) {
  if (!bmi || !Number.isFinite(bmi)) return null;

  for (const [key, category] of Object.entries(BMI_CATEGORIES)) {
    if (bmi >= category.min && bmi <= category.max) {
      return { key, ...category };
    }
  }
  return null;
}

/**
 * 获取孕期阶段
 */
export function getPregnancyTrimester(pregnancyWeek) {
  const week = normalizeWeekLabel(pregnancyWeek);
  if (!week) return null;

  const weekNum = parseInt(week.split("+")[0], 10);
  if (weekNum >= 1 && weekNum <= 12) return PREGNANCY_TRIMESTERS.FIRST;
  if (weekNum >= 13 && weekNum <= 27) return PREGNANCY_TRIMESTERS.SECOND;
  if (weekNum >= 28 && weekNum <= 40) return PREGNANCY_TRIMESTERS.THIRD;
  return null;
}

/**
 * 计算孕前BMI（如果提供了孕前体重）
 */
export function calculatePrePregnancyBMI(heightCm, prePregnancyWeight) {
  return calculateBMI(heightCm, prePregnancyWeight);
}

/**
 * 计算当前增重
 */
export function calculateWeightGain(currentWeight, prePregnancyWeight) {
  if (!currentWeight || !prePregnancyWeight) return null;
  return Number((currentWeight - prePregnancyWeight).toFixed(1));
}

/**
 * 计算增重进度
 */
export function calculateWeightGainProgress(currentWeight, prePregnancyWeight, targetWeightGain) {
  if (!currentWeight || !prePregnancyWeight || !targetWeightGain) return null;

  const currentGain = calculateWeightGain(currentWeight, prePregnancyWeight);
  const progress = (currentGain / targetWeightGain) * 100;

  return {
    currentGain,
    targetWeightGain,
    progress: Math.min(100, Math.max(0, Number(progress.toFixed(1)))),
    status: currentGain > targetWeightGain * 1.2 ? "over" : currentGain < targetWeightGain * 0.8 ? "under" : "normal",
  };
}

/**
 * 获取营养目标
 */
export function getNutritionGoals(pregnancyWeek, bmiCategory) {
  const trimester = getPregnancyTrimester(pregnancyWeek);
  if (!trimester) return null;

  const goals = {
    calories: { ...NUTRITION_STANDARDS.calories[trimester] },
    protein: { ...NUTRITION_STANDARDS.protein[trimester] },
    calcium: { ...NUTRITION_STANDARDS.calcium },
    iron: { ...NUTRITION_STANDARDS.iron },
    folicAcid: { ...NUTRITION_STANDARDS.folicAcid },
    vitaminD: { ...NUTRITION_STANDARDS.vitaminD },
    omega3: { ...NUTRITION_STANDARDS.omega3 },
    fiber: { ...NUTRITION_STANDARDS.fiber },
  };

  // 根据BMI调整热量目标
  if (bmiCategory) {
    const { weightGainRange } = bmiCategory;
    if (weightGainRange) {
      const [minGain, maxGain] = weightGainRange;
      const avgGain = (minGain + maxGain) / 2;

      // 偏瘦：增加热量
      if (bmiCategory.key === "UNDERWEIGHT") {
        goals.calories.base += 200;
      }
      // 超重：减少热量
      else if (bmiCategory.key === "OVERWEIGHT") {
        goals.calories.base -= 100;
      }
      // 肥胖：进一步减少热量
      else if (bmiCategory.key === "OBESITY") {
        goals.calories.base -= 200;
      }
    }
  }

  return goals;
}

/**
 * 检查食物是否过敏
 */
export function isFoodAllergic(foodId, allergies) {
  if (!allergies || !Array.isArray(allergies) || allergies.length === 0) {
    return false;
  }

  const food = nutritionContent.foodDatabase[foodId];
  if (!food) return false;

  // 检查食物本身的过敏原
  if (food.allergens && food.allergens.length > 0) {
    for (const allergen of food.allergens) {
      if (allergies.includes(allergen)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * 检查食物是否在禁忌列表中
 */
export function isFoodRestricted(foodId, restrictions) {
  if (!restrictions) return false;

  const { avoid = [], limit = [] } = restrictions;

  // 检查完全禁忌
  if (avoid.length > 0) {
    for (const restriction of avoid) {
      if (restriction.examples && restriction.examples.length > 0) {
        for (const example of restriction.examples) {
          const food = nutritionContent.foodDatabase[foodId];
          if (food && food.name === example) {
            return { type: "avoid", reason: restriction.reason };
          }
        }
      }
    }
  }

  return null;
}

/**
 * 过滤掉过敏和禁忌的食物
 */
export function filterSafeFoods(foodIds, allergies, restrictions) {
  if (!foodIds || !Array.isArray(foodIds)) return [];

  return foodIds.filter((foodId) => {
    return !isFoodAllergic(foodId, allergies) && !isFoodRestricted(foodId, restrictions);
  });
}

/**
 * 计算餐次的营养
 */
export function calculateMealNutrition(foodItems) {
  if (!foodItems || !Array.isArray(foodItems)) {
    return {
      calories: 0,
      protein: 0,
      fat: 0,
      carbs: 0,
      calcium: 0,
      iron: 0,
      folicAcid: 0,
      fiber: 0,
    };
  }

  const nutrition = {
    calories: 0,
    protein: 0,
    fat: 0,
    carbs: 0,
    calcium: 0,
    iron: 0,
    folicAcid: 0,
    fiber: 0,
  };

  for (const item of foodItems) {
    const { foodId, amount, count = 1 } = item;
    const food = nutritionContent.foodDatabase[foodId];
    if (!food) continue;

    const multiplier = count || 1;

    // 计算营养
    if (food.nutrition) {
      const n = food.nutrition;
      nutrition.calories += (food.calories?.value || 0) * multiplier;
      nutrition.protein += (n.protein || 0) * multiplier;
      nutrition.fat += (n.fat || 0) * multiplier;
      nutrition.carbs += (n.carbs || 0) * multiplier;
      nutrition.calcium += (n.calcium || 0) * multiplier;
      nutrition.iron += (n.iron || 0) * multiplier;
      nutrition.folicAcid += (n.folicAcid || 0) * multiplier;
      nutrition.fiber += (n.fiber || 0) * multiplier;
    }
  }

  // 四舍五入
  return {
    calories: Number(nutrition.calories.toFixed(0)),
    protein: Number(nutrition.protein.toFixed(1)),
    fat: Number(nutrition.fat.toFixed(1)),
    carbs: Number(nutrition.carbs.toFixed(1)),
    calcium: Number(nutrition.calcium.toFixed(0)),
    iron: Number(nutrition.iron.toFixed(1)),
    folicAcid: Number(nutrition.folicAcid.toFixed(0)),
    fiber: Number(nutrition.fiber.toFixed(1)),
  };
}

/**
 * 计算每日营养摄入
 */
export function calculateDailyNutrition(meals) {
  if (!meals || !Array.isArray(meals)) {
    return {
      total: calculateMealNutrition([]),
      byMeal: {},
    };
  }

  const total = {
    calories: 0,
    protein: 0,
    fat: 0,
    carbs: 0,
    calcium: 0,
    iron: 0,
    folicAcid: 0,
    fiber: 0,
  };

  const byMeal = {};

  for (const meal of meals) {
    const { mealType, foods } = meal;
    const mealNutrition = calculateMealNutrition(foods);

    // 添加到总计
    total.calories += mealNutrition.calories;
    total.protein += mealNutrition.protein;
    total.fat += mealNutrition.fat;
    total.carbs += mealNutrition.carbs;
    total.calcium += mealNutrition.calcium;
    total.iron += mealNutrition.iron;
    total.folicAcid += mealNutrition.folicAcid;
    total.fiber += mealNutrition.fiber;

    // 按餐次记录
    byMeal[mealType] = mealNutrition;
  }

  return {
    total: {
      calories: Number(total.calories.toFixed(0)),
      protein: Number(total.protein.toFixed(1)),
      fat: Number(total.fat.toFixed(1)),
      carbs: Number(total.carbs.toFixed(1)),
      calcium: Number(total.calcium.toFixed(0)),
      iron: Number(total.iron.toFixed(1)),
      folicAcid: Number(total.folicAcid.toFixed(0)),
      fiber: Number(total.fiber.toFixed(1)),
    },
    byMeal,
  };
}

/**
 * 计算营养完成度
 */
export function calculateNutritionCompleteness(actualNutrition, goals) {
  if (!actualNutrition || !goals) return null;

  const completeness = {
    calories: {
      target: goals.calories.base,
      actual: actualNutrition.calories,
      percent: Number((actualNutrition.calories / goals.calories.base * 100).toFixed(0)),
    },
    protein: {
      target: goals.protein.min,
      actual: actualNutrition.protein,
      percent: Number((actualNutrition.protein / goals.protein.min * 100).toFixed(0)),
    },
    calcium: {
      target: goals.calcium.min,
      actual: actualNutrition.calcium,
      percent: Number((actualNutrition.calcium / goals.calcium.min * 100).toFixed(0)),
    },
    iron: {
      target: goals.iron.min,
      actual: actualNutrition.iron,
      percent: Number((actualNutrition.iron / goals.iron.min * 100).toFixed(0)),
    },
    folicAcid: {
      target: goals.folicAcid.min,
      actual: actualNutrition.folicAcid,
      percent: Number((actualNutrition.folicAcid / goals.folicAcid.min * 100).toFixed(0)),
    },
  };

  // 计算平均完成度
  const avgPercent = Number(
    (
      (completeness.calories.percent +
        completeness.protein.percent +
        completeness.calcium.percent +
        completeness.iron.percent +
        completeness.folicAcid.percent) / 5
    ).toFixed(0)
  );

  return {
    ...completeness,
    average: avgPercent,
  };
}

/**
 * 获取推荐的餐次组合
 */
export function getMealSuggestions(mealType, pregnancyWeek, allergies, restrictions, symptoms = []) {
  const trimester = getPregnancyTrimester(pregnancyWeek);
  if (!trimester) return [];

  const mealSuggestions = nutritionContent.mealSuggestions[mealType] || [];

  // 过滤符合孕周的建议
  const weekNum = parseInt(pregnancyWeek.split("+")[0], 10) || 1;

  let filtered = mealSuggestions.filter((suggestion) => {
    return weekNum >= suggestion.weekRange[0] && weekNum <= suggestion.weekRange[1];
  });

  // 过滤过敏和禁忌食物
  filtered = filtered.map((suggestion) => {
    const safeFoods = filterSafeFoods(
      suggestion.foods.map((f) => f.foodId),
      allergies,
      restrictions
    );

    return {
      ...suggestion,
      foods: suggestion.foods.filter((f) => safeFoods.includes(f.foodId)),
    };
  });

  // 根据症状调整
  if (symptoms && symptoms.length > 0) {
    filtered = filtered.map((suggestion) => {
      const symptomRelief = nutritionContent.symptomRelief;
      let adjustedFoods = suggestion.foods;

      for (const symptom of symptoms) {
        const relief = symptomRelief[symptom];
        if (relief) {
          // 优先推荐缓解症状的食物
          const recommendedFoodIds = relief.recommendedFoods.map((f) => f.foodId);
          adjustedFoods = adjustedFoods.map((f) => {
            if (recommendedFoodIds.includes(f.foodId)) {
              return { ...f, recommendedForSymptom: symptom };
            }
            return f;
          });
        }
      }

      return {
        ...suggestion,
        foods: adjustedFoods,
        symptomTips: symptoms.map((s) => symptomRelief[s]?.recommendations?.slice(0, 2)).flat(),
      };
    });
  }

  return filtered;
}

/**
 * 生成每日饮食建议
 */
export function generateDailyDietPlan(profile, symptoms = []) {
  if (!profile) return null;

  const {
    height,
    prePregnancyWeight,
    currentWeight,
    targetWeightGain,
    allergies = [],
    pregnancyWeek,
    riskLevel,
  } = profile;

  // 计算BMI
  const currentBMI = calculateBMI(height, currentWeight);
  const bmiCategory = getBMICategory(currentBMI);

  // 获取营养目标
  const nutritionGoals = getNutritionGoals(pregnancyWeek, bmiCategory);

  // 获取饮食禁忌
  const restrictions = nutritionContent.dietRestrictions;

  // 生成餐次建议
  const breakfast = getMealSuggestions("breakfast", pregnancyWeek, allergies, restrictions, symptoms);
  const lunch = getMealSuggestions("lunch", pregnancyWeek, allergies, restrictions, symptoms);
  const dinner = getMealSuggestions("dinner", pregnancyWeek, allergies, restrictions, symptoms);
  const snack = getMealSuggestions("snack", pregnancyWeek, allergies, restrictions, symptoms);

  // 根据风险等级调整
  let riskNotes = [];
  if (riskLevel === "high") {
    riskNotes = ["高风险状态，建议咨询营养师", "遵循医生的特殊饮食要求"];
  } else if (riskLevel === "medium") {
    riskNotes = ["注意控制糖分和盐分摄入", "如有特殊要求请咨询医生"];
  }

  return {
    date: new Date().toISOString().slice(0, 10),
    pregnancyWeek,
    trimester: getPregnancyTrimester(pregnancyWeek),
    bmi: currentBMI,
    bmiCategory: bmiCategory?.label,
    nutritionGoals,
    meals: {
      breakfast: breakfast.slice(0, 2), // 每餐最多推荐2个选项
      lunch: lunch.slice(0, 2),
      dinner: dinner.slice(0, 2),
      snack: snack.slice(0, 2),
    },
    restrictions: {
      avoid: restrictions.avoid.filter((r) =>
        r.trimesters.includes(getPregnancyTrimester(pregnancyWeek))
      ),
      limit: restrictions.limit.filter((r) =>
        r.trimesters.includes(getPregnancyTrimester(pregnancyWeek))
      ),
    },
    tips: [
      "保证每日5-6餐，少量多餐",
      "多喝水，每日至少8杯",
      "饮食多样化，确保营养均衡",
      ...riskNotes,
    ],
  };
}

/**
 * 生成营养建议（用于首页展示）
 */
export function generateNutritionAdvice(profile) {
  if (!profile) return null;

  const plan = generateDailyDietPlan(profile);

  if (!plan) return null;

  const todaySummary = {
    date: plan.date,
    pregnancyWeek: plan.pregnancyWeek,
    meals: {
      breakfast: plan.meals.breakfast[0] || null,
      lunch: plan.meals.lunch[0] || null,
      dinner: plan.meals.dinner[0] || null,
      snack: plan.meals.snack[0] || null,
    },
    nutritionGoals: {
      calories: plan.nutritionGoals?.calories?.base || 2000,
      protein: plan.nutritionGoals?.protein?.min || 70,
      calcium: plan.nutritionGoals?.calcium?.min || 1000,
    },
    tips: plan.tips.slice(0, 3),
  };

  return todaySummary;
}
