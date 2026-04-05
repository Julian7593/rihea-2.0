/**
 * 饮食API客户端
 * 处理饮食相关的API请求
 */

<<<<<<< HEAD
import { apiRequest, hasRemoteApi } from "./client.js";
import { apiContracts } from "./contracts.js";
import { createDietRecord, getDietRecords } from "../utils/recordStorage.js";
import { buildFoodPhotoAnalysisFallback, generateNutritionAdvice } from "../utils/nutritionCalculator.js";
=======
import { apiContracts, apiRequest, hasRemoteApi } from "./client.js";
import { createDietRecord, getDietRecords, getTodayDietRecords } from "../utils/recordStorage.js";
import { generateNutritionAdvice } from "../utils/nutritionCalculator.js";
>>>>>>> 356bd4d38d8b7f31d8a35a177e59ac40d7d6cf8a

const wait = (ms = 220) => new Promise((resolve) => setTimeout(resolve, ms));

// 延迟加载，确保数据已就绪
async function ensureDataReady() {
  await wait(100);
}

<<<<<<< HEAD
function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(new Error("识别失败，请重拍或手动添加"));
    reader.readAsDataURL(file);
  });
}

=======
>>>>>>> 356bd4d38d8b7f31d8a35a177e59ac40d7d6cf8a
/**
 * 获取今日饮食建议
 */
export async function fetchDietAdvice(profile, options = {}) {
  try {
    await ensureDataReady();

    if (hasRemoteApi) {
      return await apiRequest(apiContracts.nutrition.getAdvice, {
        ...options,
        body: {
          pregnancyWeek: profile?.pregnancyWeek,
          riskLevel: profile?.riskLevel,
        },
      });
    }

    // 本地模式：使用营养计算器
    await wait();
    const advice = generateNutritionAdvice(profile);
    return advice;
  } catch (error) {
    console.error("获取饮食建议失败：", error);
    throw error;
  }
}

/**
 * 获取饮食历史记录
 */
export async function fetchDietRecords(days = 7, options = {}) {
  try {
    await ensureDataReady();

    if (hasRemoteApi) {
      return await apiRequest(apiContracts.nutrition.getRecords, {
        ...options,
      });
    }

    // 本地模式：使用存储API
    await wait();
    const records = getDietRecords(days);
    return { records };
  } catch (error) {
    console.error("获取饮食记录失败：", error);
    throw error;
  }
}

/**
 * 创建饮食记录
 */
export async function createDietRecordApi(record, options = {}) {
  try {
    if (hasRemoteApi) {
      return await apiRequest(apiContracts.nutrition.createRecord, {
        ...options,
        body: record,
      });
    }

    // 本地模式：使用存储API
    await wait();
    const newRecord = createDietRecord(record);
    return newRecord;
  } catch (error) {
    console.error("创建饮食记录失败：", error);
    throw error;
  }
}

/**
 * 更新饮食记录
 */
export async function updateDietRecord(id, record, options = {}) {
  try {
    if (hasRemoteApi) {
      const path = apiContracts.nutrition.updateRecord.path.replace("{id}", encodeURIComponent(id));
      return await apiRequest(
        {
          ...apiContracts.nutrition.updateRecord,
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
    console.error("更新饮食记录失败：", error);
    throw error;
  }
}

/**
 * 删除饮食记录
 */
export async function deleteDietRecord(id, options = {}) {
  try {
    if (hasRemoteApi) {
      const path = apiContracts.nutrition.deleteRecord.path.replace("{id}", encodeURIComponent(id));
      return await apiRequest(
        {
          ...apiContracts.nutrition.deleteRecord,
          path,
        },
        options
      );
    }

    // 本地模式：暂不支持删除
    await wait();
    throw new Error("本地模式暂不支持删除记录");
  } catch (error) {
    console.error("删除饮食记录失败：", error);
    throw error;
  }
}
<<<<<<< HEAD

/**
 * 拍照识别餐食并生成孕期提醒
 */
export async function analyzeMealPhoto(file, context = {}, options = {}) {
  if (!(file instanceof File)) {
    throw new Error("识别失败，请重拍或手动添加");
  }

  const imageBase64 = await fileToDataUrl(file);
  const requestBody = {
    imageBase64,
    fileName: file.name,
    mimeType: file.type || "image/jpeg",
    mealType: context?.mealType,
    pregnancyWeek: context?.pregnancyWeek,
    allergies: context?.allergies || [],
    medicalContraindications: context?.medicalContraindications || { diet: [] },
    riskLevel: context?.riskLevel,
  };

  if (hasRemoteApi) {
    return apiRequest(apiContracts.nutrition.photoAnalyze, {
      ...options,
      body: requestBody,
    });
  }

  await wait();
  return buildFoodPhotoAnalysisFallback({
    fileName: file.name,
    mealType: context?.mealType,
    profile: {
      pregnancyWeek: context?.pregnancyWeek,
      allergies: context?.allergies || [],
      medicalContraindications: context?.medicalContraindications || { diet: [] },
      riskLevel: context?.riskLevel,
    },
  });
}
=======
>>>>>>> 356bd4d38d8b7f31d8a35a177e59ac40d7d6cf8a
