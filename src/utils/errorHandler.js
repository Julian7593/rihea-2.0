import { txt } from "./txt.js";

/**
 * 用户友好的错误消息映射
 */
const ERROR_MESSAGES = {
  // 网络错误
  network: {
    zh: "网络连接失败，请检查网络后重试",
    en: "Network failed, please check connection and try again"
  },
  timeout: {
    zh: "请求超时，请稍后重试",
    en: "Request timeout, please try again later"
  },
  // 数据错误
  invalid_data: {
    zh: "数据格式错误，请刷新页面",
    en: "Invalid data format, please refresh"
  },
  storage_full: {
    zh: "存储空间不足，请清理数据",
    en: "Storage full, please clear some data"
  },
  // 权限错误
  permission_denied: {
    zh: "没有权限执行此操作",
    en: "Permission denied"
  },
  // 默认错误
  default: {
    zh: "操作失败，请稍后重试",
    en: "Operation failed, please try again later"
  }
};

/**
 * 获取用户友好的错误信息
 * @param {Error} error - 错误对象
 * @param {string} lang - 语言代码（zh/en）
 * @returns {string} 用户友好的错误信息
 */
export function getUserFriendlyError(error, lang = "zh") {
  // API 错误
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }

  // 网络错误
  if (error?.code === "ERR_NETWORK" || !navigator.onLine) {
    return ERROR_MESSAGES.network[lang] || ERROR_MESSAGES.network.zh;
  }

  // 超时错误
  if (error?.code === "ERR_TIMEOUT") {
    return ERROR_MESSAGES.timeout[lang] || ERROR_MESSAGES.timeout.zh;
  }

  // 存储空间不足
  if (error?.code === "STORAGE_FULL") {
    return ERROR_MESSAGES.storage_full[lang] || ERROR_MESSAGES.storage_full.zh;
  }

  // 权限错误
  if (error?.code === "PERMISSION_DENIED") {
    return ERROR_MESSAGES.permission_denied[lang] || ERROR_MESSAGES.permission_denied.zh;
  }

  // 数据格式错误
  if (error?.code === "INVALID_DATA") {
    return ERROR_MESSAGES.invalid_data[lang] || ERROR_MESSAGES.invalid_data.zh;
  }

  // 默认错误
  return error?.message || ERROR_MESSAGES.default[lang] || ERROR_MESSAGES.default.zh;
}

/**
 * 显示错误信息到用户（配合 Toast 使用）
 * @param {Error} error - 错误对象
 * @param {Object} toast - Toast 实例
 * @param {string} lang - 语言代码
 */
export function showErrorToUser(error, toast, lang = "zh") {
  const message = getUserFriendlyError(error, lang);
  toast.error(message);
  console.error("Error occurred:", error);
}

export { ERROR_MESSAGES };
