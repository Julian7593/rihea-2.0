/**
 * 运动API客户端
 * 处理运动相关的API请求
 */

import { apiContracts, apiRequest, hasRemoteApi } from "./client.js";
import {
  createExerciseRecord,
  getExerciseRecords,
  getTodayExerciseRecords,
  calculateWeeklyStats,
} from "../utils/recordStorage";
import { getTodayExerciseQuickView, generateWeeklyExercisePlan } from "../utils/fitnessRecommender.js";

const wait = (ms = 220) => new Promise((resolve) => setTimeout(resolve, ms));

// 延迟加载，确保数据已就绪
async function ensureDataReady() {
  await wait(100);
}

/**
 * 获取今日运动建议
 */
export async function fetchExerciseAdvice(profile, options = {}) {
  try {
    await ensureDataReady();

    if (hasRemoteApi) {
      const dayNames = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
      const today = dayNames[new Date().getDay()];

      return await apiRequest(apiContracts.fitness.getAdvice, {
        ...options,
        body: {
          pregnancyWeek: profile?.pregnancyWeek,
          dayOfWeek: today,
          riskLevel: profile?.riskLevel,
          exerciseLevel: profile?.exerciseHistory?.level,
        },
      });
    }

    // 本地模式：使用运动推荐器
    await wait();
    const advice = getTodayExerciseQuickView(profile);
    return advice;
  } catch (error) {
    console.error("获取运动建议失败：", error);
    throw error;
  }
}

/**
 * 获取周运动计划
 */
export async function fetchWeeklyExercisePlan(profile, options = {}) {
  try {
    await ensureDataReady();

    if (hasRemoteApi) {
      return await apiRequest(apiContracts.fitness.getWeeklyPlan, {
        ...options,
        body: {
          pregnancyWeek: profile?.pregnancyWeek,
          riskLevel: profile?.riskLevel,
          exerciseLevel: profile?.exerciseHistory?.level,
          medicalContraindications: profile?.medicalContraindications,
        },
      });
    }

    // 本地模式：使用运动推荐器
    await wait();
    const plan = generateWeeklyExercisePlan(profile);
    return plan;
  } catch (error) {
    console.error("获取周运动计划失败：", error);
    throw error;
  }
}

/**
 * 获取运动历史记录
 */
export async function fetchExerciseRecords(days = 7, options = {}) {
  try {
    await ensureDataReady();

    if (hasRemoteApi) {
      return await apiRequest(apiContracts.fitness.getRecords, {
        ...options,
      });
    }

    // 本地模式：使用存储API
    await wait();
    const records = getExerciseRecords(days);
    return { records };
  } catch (error) {
    console.error("获取运动记录失败：", error);
    throw error;
  }
}

/**
 * 创建运动记录
 */
export async function createExerciseRecordApi(record, options = {}) {
  try {
    if (hasRemoteApi) {
      return await apiRequest(apiContracts.fitness.createRecord, {
        ...options,
        body: record,
      });
    }

    // 本地模式：使用存储API
    await wait();
    const newRecord = createExerciseRecord(record);
    return newRecord;
  } catch (error) {
    console.error("创建运动记录失败：", error);
    throw error;
  }
}

/**
 * 更新运动记录
 */
export async function updateExerciseRecord(id, record, options = {}) {
  try {
    if (hasRemoteApi) {
      const path = apiContracts.fitness.updateRecord.path.replace("{id}", encodeURIComponent(id));
      return await apiRequest(
        {
          ...apiContracts.fitness.updateRecord,
          path,
        },
        {
          ...options,
          body: record,
        }
      );
    }

    // 本地模式：暂不支持更新
    await wait();
    throw new Error("本地模式暂不支持更新记录");
  } catch (error) {
    console.error("更新运动记录失败：", error);
    throw error;
  }
}

/**
 * 删除运动记录
 */
export async function deleteExerciseRecord(id, options = {}) {
  try {
    if (hasRemoteApi) {
      const path = apiContracts.fitness.deleteRecord.path.replace("{id}", encodeURIComponent(id));
      return await apiRequest(
        {
          ...apiContracts.fitness.deleteRecord,
          path,
        },
        options
      );
    }

    // 本地模式：暂不支持删除
    await wait();
    throw new Error("本地模式暂不支持删除记录");
  } catch (error) {
    console.error("删除运动记录失败：", error);
    throw error;
  }
}

/**
 * 获取周运动统计
 */
export async function fetchWeeklyStats(options = {}) {
  try {
    await ensureDataReady();

    if (hasRemoteApi) {
      return await apiRequest(apiContracts.fitness.getWeeklyStats, options);
    }

    // 本地模式：使用存储API
    await wait();
    const stats = calculateWeeklyStats();
    return stats;
  } catch (error) {
    console.error("获取周统计失败：", error);
    throw error;
  }
}
