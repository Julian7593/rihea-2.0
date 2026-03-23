/**
 * 营养计算器和推荐引擎
 * 基于孕周、BMI、风险等级生成个性化饮食建议
 */

import {
  nutritionContent,
  PREGNANCY_TRIMESTERS,
  BMI_CATEGORIES,
  NUTRITION_STANDARDS,
} from "../data/nutritionContent";
import { calcPregnancyWeekByDueDate, normalizeWeekLabel } from "./pregnancy.js";

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
