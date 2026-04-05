/**
 * 运动推荐引擎
 * 基于孕周、BMI、风险等级、运动基础生成个性化运动建议
 */

import {
  fitnessContent,
  PREGNANCY_TRIMESTERS,
  EXERCISE_INTENSITY,
  FITNESS_LEVELS,
} from "../data/fitnessContent";
import { normalizeWeekLabel } from "./pregnancy.js";

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
 * 获取周计划模板
 */
export function getWeeklyPlanTemplate(pregnancyWeek) {
  const trimester = getPregnancyTrimester(pregnancyWeek);
  if (!trimester) return null;

  switch (trimester) {
    case PREGNANCY_TRIMESTERS.FIRST:
      return fitnessContent.weeklyPlans.firstTrimester;
    case PREGNANCY_TRIMESTERS.SECOND:
      return fitnessContent.weeklyPlans.secondTrimester;
    case PREGNANCY_TRIMESTERS.THIRD:
      return fitnessContent.weeklyPlans.thirdTrimester;
    default:
      return null;
  }
}

/**
 * 检查运动是否适合当前孕周
 */
export function isExerciseAllowed(exerciseId, pregnancyWeek) {
  const trimester = getPregnancyTrimester(pregnancyWeek);
  if (!trimester) return { allowed: false, reason: "无法确定孕期阶段" };

  const exercise = fitnessContent.exerciseDatabase[exerciseId];
  if (!exercise) {
    return { allowed: false, reason: "运动不存在" };
  }

  if (!exercise.pregnancySafe) {
    return { allowed: false, reason: "此运动不适合孕期" };
  }

  if (!exercise.allowedTrimesters.includes(trimester)) {
    return { allowed: false, reason: "当前孕周不适合此运动" };
  }

  return { allowed: true };
}

/**
 * 检查运动禁忌
 */
export function checkExerciseContraindications(exerciseId, medicalContraindications = {}, riskLevel = "low") {
  const exercise = fitnessContent.exerciseDatabase[exerciseId];
  if (!exercise) {
    return { contraindicated: true, reason: "运动不存在" };
  }

  // 检查绝对禁忌
  const absoluteContraindications = fitnessContent.contraindications.absolute;
  for (const contraindication of absoluteContraindications) {
    if (contraindication.examples && contraindication.examples.length > 0) {
      const exerciseName = exercise.nameEn?.toLowerCase() || exercise.name?.toLowerCase();
      for (const example of contraindication.examples) {
        if (example.toLowerCase().includes(exerciseName) || exerciseName.includes(example.toLowerCase())) {
          return {
            contraindicated: true,
            reason: contraindication.reason,
            type: "absolute",
          };
        }
      }
    }
  }

  // 检查条件禁忌
  const conditionalContraindications = fitnessContent.contraindications.conditional;
  for (const [key, condition] of Object.entries(conditionalContraindications)) {
    // 检查医疗禁忌
    if (medicalContraindications.exercise && medicalContraindications.exercise.length > 0) {
      for (const medicalContraindication of medicalContraindications.exercise) {
        if (condition.prohibited.includes(medicalContraindication)) {
          // 检查当前运动是否在禁忌列表中
          const exerciseType = exercise.type?.toLowerCase() || "";
          const exerciseName = exercise.nameEn?.toLowerCase() || exercise.name?.toLowerCase();

          if (condition.prohibited.some((prohibited) =>
            prohibited.toLowerCase().includes(exerciseType) ||
            prohibited.toLowerCase().includes(exerciseName) ||
            exerciseType.includes(prohibited.toLowerCase()) ||
            exerciseName.includes(prohibited.toLowerCase())
          )) {
            return {
              contraindicated: true,
              reason: condition.reason,
              type: "medical",
              condition: key,
            };
          }
        }
      }
    }
  }

  // 高风险用户额外限制
  if (riskLevel === "high") {
    if (exercise.intensity === EXERCISE_INTENSITY.HIGH) {
      return {
        contraindicated: true,
        reason: "高风险状态不建议高强度运动",
        type: "risk",
      };
    }
    if (exercise.intensity === EXERCISE_INTENSITY.MEDIUM && exercise.category !== "stretching") {
      return {
        contraindicated: true,
        reason: "高风险状态建议仅进行温和运动",
        type: "risk",
      };
    }
  }

  return { contraindicated: false };
}

/**
 * 过滤适合的运动
 */
export function filterAllowedExercises(exerciseIds, pregnancyWeek, medicalContraindications, riskLevel) {
  if (!exerciseIds || !Array.isArray(exerciseIds)) return [];

  return exerciseIds.filter((exerciseId) => {
    const allowedCheck = isExerciseAllowed(exerciseId, pregnancyWeek);
    if (!allowedCheck.allowed) return false;

    const contraindicationCheck = checkExerciseContraindications(
      exerciseId,
      medicalContraindications,
      riskLevel
    );
    if (contraindicationCheck.contraindicated) return false;

    return true;
  });
}

/**
 * 获取运动基础适配方案
 */
export function getLevelAdaptation(level) {
  const adaptation = fitnessContent.levelAdaptations[level];
  if (!adaptation) {
    return fitnessContent.levelAdaptations[FITNESS_LEVELS.BEGINNER];
  }
  return adaptation;
}

/**
 * 根据运动基础调整计划
 */
export function adaptPlanForLevel(planTemplate, level, userHistory = []) {
  const adaptation = getLevelAdaptation(level);
  const adaptedPlan = JSON.parse(JSON.stringify(planTemplate)); // Deep copy

  // 根据运动基础调整时长
  if (level === FITNESS_LEVELS.BEGINNER) {
    // 初学者：减少时长
    adaptedPlan.weeklyTemplate = adaptedPlan.weeklyTemplate.map((day) => {
      return {
        ...day,
        exercises: day.exercises.map((ex) => ({
          ...ex,
          duration: Math.max(5, Math.floor(ex.duration * 0.6)), // 减少40%
        })),
      };
    });
  } else if (level === FITNESS_LEVELS.ADVANCED) {
    // 高级用户：保持或略增时长
    // 不需要特别调整，因为计划已经是标准推荐
  }

  // 根据历史记录进一步调整
  if (userHistory.length > 0) {
    const recentHistory = userHistory.slice(0, 7); // 最近7次记录
    const averageFeeling = recentHistory.reduce((sum, h) => sum + (h.feeling || 3), 0) / recentHistory.length;

    // 如果用户反馈不适，降低难度
    if (averageFeeling < 3) {
      adaptedPlan.weeklyTemplate = adaptedPlan.weeklyTemplate.map((day) => {
        return {
          ...day,
          exercises: day.exercises.map((ex) => ({
            ...ex,
            duration: Math.max(10, Math.floor(ex.duration * 0.8)), // 减少20%
          })),
        };
      });
      adaptedPlan.specialNote = "根据您的反馈，已降低运动强度。如感觉良好，可逐渐增加。";
    }
  }

  return {
    ...adaptedPlan,
    adaptationNotes: {
      level,
      description: adaptation.description,
      startingPlan: adaptation.startingPlan,
      progression: adaptation.progression,
    },
  };
}

/**
 * 生成周运动计划
 */
export function generateWeeklyExercisePlan(profile, exerciseHistory = []) {
  if (!profile) return null;

  const {
    pregnancyWeek,
    riskLevel,
    exerciseHistory: exerciseHistoryProfile,
    medicalContraindications = {},
  } = profile;

  // 获取基础周计划模板
  const basePlan = getWeeklyPlanTemplate(pregnancyWeek);
  if (!basePlan) return null;

  // 获取运动基础
  const level = exerciseHistoryProfile?.level || FITNESS_LEVELS.BEGINNER;

  // 根据运动基础调整计划
  let adaptedPlan = adaptPlanForLevel(basePlan, level, exerciseHistory);

  // 根据风险等级调整
  if (riskLevel === "high") {
    adaptedPlan = {
      ...adaptedPlan,
      target: "每周2-3次温和运动，总时长<60分钟",
      safetyAlerts: [
        "高风险状态，所有运动需在医生指导下进行",
        "仅推荐温和运动（散步、简单拉伸）",
        "监测胎动和身体信号",
        "如有任何不适立即停止",
        ...adaptedPlan.safetyAlerts,
      ],
    };

    // 过滤出低强度运动
    adaptedPlan.weeklyTemplate = adaptedPlan.weeklyTemplate.map((day) => {
      return {
        ...day,
        exercises: day.exercises.filter((ex) => {
          const exercise = fitnessContent.exerciseDatabase[ex.exerciseId];
          return exercise && exercise.intensity === EXERCISE_INTENSITY.LOW;
        }),
      };
    });
  } else if (riskLevel === "medium") {
    adaptedPlan.safetyAlerts = [
      "中等风险状态，建议降低运动强度",
      "运动时注意休息频率",
      "如有不适立即停止",
      ...adaptedPlan.safetyAlerts,
    ];
  }

  // 过滤掉被禁忌的运动
  adaptedPlan.weeklyTemplate = adaptedPlan.weeklyTemplate.map((day) => {
    return {
      ...day,
      exercises: day.exercises.filter((ex) => {
        return !checkExerciseContraindications(ex.exerciseId, medicalContraindications, riskLevel).contraindicated;
      }),
    };
  });

  // 填充运动详细信息
  adaptedPlan.weeklyTemplate = adaptedPlan.weeklyTemplate.map((day) => {
    return {
      ...day,
      exercises: day.exercises.map((ex) => {
        const exercise = fitnessContent.exerciseDatabase[ex.exerciseId];
        return {
          ...ex,
          exercise: {
            id: exercise.id,
            name: exercise.name,
            nameEn: exercise.nameEn,
            type: exercise.type,
            category: exercise.category,
            intensity: exercise.intensity,
            caloriesPerMinute: exercise.caloriesPerMinute,
            instructions: exercise.instructions,
            precautions: exercise.precautions,
            equipment: exercise.equipment,
          },
          estimatedCalories: Math.round(ex.duration * exercise.caloriesPerMinute),
        };
      }),
    };
  });

  return adaptedPlan;
}

/**
 * 生成每日运动建议（用于首页展示）
 */
export function generateDailyExerciseAdvice(profile, dayOfWeek) {
  if (!profile) return null;

  const weeklyPlan = generateWeeklyExercisePlan(profile);
  if (!weeklyPlan) return null;

  const dayNames = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];
  const dayIndex = dayNames.indexOf(dayOfWeek);
  const dayPlan = weeklyPlan.weeklyTemplate[dayIndex] || weeklyPlan.weeklyTemplate[0];

  const todayTasks = dayPlan.exercises.map((ex) => ({
    id: ex.exerciseId,
    type: ex.exercise.category,
    name: ex.exercise.name,
    nameEn: ex.exercise.nameEn,
    duration: ex.duration,
    intensity: ex.exercise.intensity,
    instructions: ex.exercise.instructions,
    precautions: ex.exercise.precautions,
    estimatedCalories: ex.estimatedCalories,
    equipment: ex.exercise.equipment,
  }));

  return {
    date: new Date().toISOString().slice(0, 10),
    pregnancyWeek: profile.pregnancyWeek,
    dayOfWeek,
    target: weeklyPlan.target,
    todayTasks,
    safetyAlerts: weeklyPlan.safetyAlerts.slice(0, 2), // 只显示前2个提醒
    totalDuration: todayTasks.reduce((sum, t) => sum + t.duration, 0),
    totalCalories: todayTasks.reduce((sum, t) => sum + t.estimatedCalories, 0),
  };
}

/**
 * 计算每周运动完成情况
 */
export function calculateWeeklyProgress(exerciseRecords, plan) {
  if (!exerciseRecords || !Array.isArray(exerciseRecords)) {
    return {
      completed: 0,
      total: 0,
      duration: 0,
      calories: 0,
      tasks: [],
    };
  }

  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay() + 1); // 周一
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  // 过滤本周记录
  const weeklyRecords = exerciseRecords.filter((record) => {
    const recordDate = new Date(record.timestamp);
    return recordDate >= startOfWeek && recordDate <= endOfWeek;
  });

  // 计算完成情况
  const totalTasks = plan.weeklyTemplate.reduce((sum, day) => sum + day.exercises.length, 0);
  const completedTasks = weeklyRecords.length;
  const duration = weeklyRecords.reduce((sum, r) => sum + (r.duration || 0), 0);
  const calories = weeklyRecords.reduce((sum, r) => sum + (r.calories || 0), 0);

  return {
    completed: completedTasks,
    total: totalTasks,
    percent: totalTasks > 0 ? Number((completedTasks / totalTasks * 100).toFixed(0)) : 0,
    duration,
    calories,
    tasks: weeklyRecords,
  };
}

/**
 * 生成运动建议总结（用于首页卡片）
 */
export function generateExerciseSummary(profile, exerciseHistory = []) {
  if (!profile) return null;

  const dayNames = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  const today = dayNames[new Date().getDay()];

  const advice = generateDailyExerciseAdvice(profile, today);
  const weeklyPlan = generateWeeklyExercisePlan(profile, exerciseHistory);

  if (!advice) return null;

  const progress = calculateWeeklyProgress(exerciseHistory, weeklyPlan);

  return {
    date: advice.date,
    pregnancyWeek: advice.pregnancyWeek,
    todayTasks: advice.todayTasks,
    target: advice.target,
    safetyAlerts: advice.safetyAlerts,
    weeklyProgress: {
      completed: progress.completed,
      total: progress.total,
      percent: progress.percent,
      duration: progress.duration,
      calories: progress.calories,
    },
  };
}

/**
 * 检查运动感受，决定是否需要调整
 */
export function shouldAdjustIntensity(userFeedback, historyLength) {
  if (!userFeedback || historyLength < 3) {
    return { shouldAdjust: false, reason: "数据不足" };
  }

  const { feeling, discomfortLevel, discomfortSymptoms } = userFeedback;

  // 感受评分低于3分，或不适等级大于2
  if (feeling <= 3 || discomfortLevel >= 3) {
    return {
      shouldAdjust: true,
      direction: "down",
      reason: "用户反馈不适或感受不佳",
    };
  }

  // 有严重不适症状
  if (discomfortSymptoms && discomfortSymptoms.length > 0) {
    const severeSymptoms = ["出血", "腹痛", "头晕", "胸痛", "呼吸困难"];
    for (const symptom of discomfortSymptoms) {
      if (severeSymptoms.some((s) => symptom.includes(s))) {
        return {
          shouldAdjust: true,
          direction: "down",
          reason: "出现严重症状",
          severity: "high",
        };
      }
    }
  }

  // 连续多次感觉良好，可以略微增加
  if (feeling >= 4 && discomfortLevel === 0) {
    return {
      shouldAdjust: true,
      direction: "up",
      reason: "用户反馈良好",
    };
  }

  return { shouldAdjust: false, reason: "保持当前强度" };
}

/**
 * 获取今日运动建议（简化版，用于首页快速展示）
 */
export function getTodayExerciseQuickView(profile) {
  if (!profile) return null;

  const summary = generateExerciseSummary(profile);
  if (!summary) return null;

  const mainTask = summary.todayTasks[0];

  return {
    date: summary.date,
    pregnancyWeek: summary.pregnancyWeek,
    mainTask: mainTask ? {
      name: mainTask.name,
      duration: mainTask.duration,
      intensity: mainTask.intensity,
    } : null,
    totalTasksToday: summary.todayTasks.length,
    weeklyProgress: summary.weeklyProgress,
  };
}
