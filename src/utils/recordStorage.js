/**
 * 记录存储管理
 * 管理饮食和运动记录的本地存储
 */

const DIET_RECORDS_KEY = "rihea_diet_records_v1";
const EXERCISE_RECORDS_KEY = "rihea_exercise_records_v1";
const FEELING_RECORDS_KEY = "rihea_feeling_records_v1";

/**
 * 读取本地存储
 */
function readStorage(key) {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * 写入本地存储
 */
function writeStorage(key, data) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error("Failed to write to localStorage:", error);
  }
}

/**
 * 获取今日日期
 */
function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * 创建饮食记录
 */
export function createDietRecord(record) {
  const records = readStorage(DIET_RECORDS_KEY);

  const newRecord = {
    id: `diet-${Date.now()}`,
    ...record,
    createdAt: new Date().toISOString(),
  };

  // 添加到数组开头（最新的在前）
  const updatedRecords = [newRecord, ...records];

  writeStorage(DIET_RECORDS_KEY, updatedRecords);

  return newRecord;
}

/**
 * 获取饮食记录
 */
export function getDietRecords(days = 7) {
  const records = readStorage(DIET_RECORDS_KEY);

  const threshold = new Date();
  threshold.setDate(threshold.getDate() - days);
  const thresholdTime = threshold.getTime();

  return records.filter((record) => {
    const recordTime = new Date(record.createdAt).getTime();
    return Number.isFinite(recordTime) && recordTime >= thresholdTime;
  });
}

/**
 * 获取今日饮食记录
 */
export function getTodayDietRecords() {
  const today = getTodayDate();
  const records = getDietRecords(1);

  return records.filter((record) => {
    return record.createdAt?.startsWith(today);
  });
}

/**
 * 创建运动记录
 */
export function createExerciseRecord(record) {
  const records = readStorage(EXERCISE_RECORDS_KEY);

  const newRecord = {
    id: `exercise-${Date.now()}`,
    ...record,
    createdAt: new Date().toISOString(),
  };

  // 添加到数组开头（最新的在前）
  const updatedRecords = [newRecord, ...records];

  writeStorage(EXERCISE_RECORDS_KEY, updatedRecords);

  return newRecord;
}

/**
 * 获取运动记录
 */
export function getExerciseRecords(days = 7) {
  const records = readStorage(EXERCISE_RECORDS_KEY);

  const threshold = new Date();
  threshold.setDate(threshold.getDate() - days);
  const thresholdTime = threshold.getTime();

  return records.filter((record) => {
    const recordTime = new Date(record.createdAt).getTime();
    return Number.isFinite(recordTime) && recordTime >= thresholdTime;
  });
}

/**
 * 获取今日运动记录
 */
export function getTodayExerciseRecords() {
  const today = getTodayDate();
  const records = getExerciseRecords(1);

  return records.filter((record) => {
    return record.createdAt?.startsWith(today);
  });
}

/**
 * 计算本周运动统计
 */
export function calculateWeeklyExerciseStats() {
  const records = getExerciseRecords(7);

  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay() + 1); // 周一
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  // 过滤本周记录
  const weeklyRecords = records.filter((record) => {
    const recordDate = new Date(record.createdAt);
    return recordDate >= startOfWeek && recordDate <= endOfWeek;
  });

  return {
    count: weeklyRecords.length,
    duration: weeklyRecords.reduce((sum, r) => sum + (r.duration || 0), 0),
    calories: weeklyRecords.reduce((sum, r) => sum + (r.calories || 0), 0),
    records: weeklyRecords,
  };
}

/**
 * 创建身体感受记录
 */
export function createFeelingRecord(record) {
  const records = readStorage(FEELING_RECORDS_KEY);

  const newRecord = {
    id: `feeling-${Date.now()}`,
    ...record,
    date: record.date || getTodayDate(),
    createdAt: new Date().toISOString(),
  };

  // 添加到数组开头（最新的在前）
  const updatedRecords = [newRecord, ...records];

  writeStorage(FEELING_RECORDS_KEY, updatedRecords);

  return newRecord;
}

/**
 * 获取身体感受记录
 */
export function getFeelingRecords(days = 7) {
  const records = readStorage(FEELING_RECORDS_KEY);

  const threshold = new Date();
  threshold.setDate(threshold.getDate() - days);
  const thresholdTime = threshold.getTime();

  return records.filter((record) => {
    const recordTime = new Date(record.createdAt).getTime();
    return Number.isFinite(recordTime) && recordTime >= thresholdTime;
  });
}

/**
 * 获取今日身体感受
 */
export function getTodayFeeling() {
  const today = getTodayDate();
  const records = getFeelingRecords(1);

  const todayRecord = records.find((record) => {
    return record.date === today;
  });

  return todayRecord || null;
}

/**
 * 计算营养完成情况
 */
export function calculateNutritionCompleteness() {
  const dietRecords = getTodayDietRecords();

  if (dietRecords.length === 0) {
    return {
      calories: { target: 2000, actual: 0, percent: 0 },
      protein: { target: 70, actual: 0, percent: 0 },
      calcium: { target: 1200, actual: 0, percent: 0 },
    };
  }

  const total = dietRecords.reduce(
    (acc, record) => {
      const nutrition = record.nutrition || {};
      return {
        calories: acc.calories + (nutrition.calories || 0),
        protein: acc.protein + (nutrition.protein || 0),
        calcium: acc.calcium + (nutrition.calcium || 0),
      };
    },
    { calories: 0, protein: 0, calcium: 0 }
  );

  return {
    calories: {
      target: 2000,
      actual: total.calories,
      percent: Math.min(100, Math.round((total.calories / 2000) * 100)),
    },
    protein: {
      target: 70,
      actual: Math.round(total.protein),
      percent: Math.min(100, Math.round((total.protein / 70) * 100)),
    },
    calcium: {
      target: 1200,
      actual: Math.round(total.calcium),
      percent: Math.min(100, Math.round((total.calcium / 1200) * 100)),
    },
  };
}

/**
 * 获取今日总览
 */
export function getTodaySummary() {
  const dietRecords = getTodayDietRecords();
  const exerciseRecords = getTodayExerciseRecords();
  const feeling = getTodayFeeling();
  const nutrition = calculateNutritionCompleteness();
  const weeklyStats = calculateWeeklyExerciseStats();

  return {
    date: getTodayDate(),
    diet: {
      mealsLogged: dietRecords.length,
      nutrition,
    },
    exercise: {
      tasksCompleted: exerciseRecords.length,
      totalDuration: exerciseRecords.reduce((sum, r) => sum + (r.duration || 0), 0),
      totalCalories: exerciseRecords.reduce((sum, r) => sum + (r.calories || 0), 0),
    },
    feeling,
    weeklyExercise: weeklyStats,
  };
}

/**
 * 删除记录（用于测试）
 */
export function clearAllRecords() {
  writeStorage(DIET_RECORDS_KEY, []);
  writeStorage(EXERCISE_RECORDS_KEY, []);
  writeStorage(FEELING_RECORDS_KEY, []);
}
