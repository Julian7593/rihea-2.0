/**
 * 表单验证规则
 */
export const VALIDATION_RULES = {
  /**
   * 必填项验证
   * @param {any} value - 待验证的值
   * @returns {{valid: boolean, message?: string}} 验证结果
   */
  required: (value) => {
    if (!value || value.trim() === "") {
      return { valid: false, message: "此项为必填项" };
    }
    return { valid: true };
  },

  /**
   * 邮箱格式验证
   * @param {string} value - 待验证的邮箱地址
   * @returns {{valid: boolean, message?: string}} 验证结果
   */
  email: (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return { valid: false, message: "请输入有效的邮箱地址" };
    }
    return { valid: true };
  },

  /**
   * 最小长度验证
   * @param {number} min - 最小长度
   * @returns {(value) => {{valid: boolean, message?: string}} 验证函数
   */
  minLength: (min) => (value) => {
    if (value.length < min) {
      return { valid: false, message: `至少需要 ${min} 个字符` };
    }
    return { valid: true };
  },

  /**
   * 最大长度验证
   * @param {number} max - 最大长度
   * @returns {(value) => {{valid: boolean, message?: string}} 验证函数
   */
  maxLength: (max) => (value) => {
    if (value.length > max) {
      return { valid: false, message: `最多 ${max} 个字符` };
    }
    return { valid: true };
  },

  /**
   * 数字范围验证
   * @param {number} min - 最小值
   * @param {number} max - 最大值
   * @returns {(value) => {{valid: boolean, message?: string}} 验证函数
   */
  range: (min, max) => (value) => {
    const num = Number(value);
    if (isNaN(num)) {
      return { valid: false, message: "请输入有效的数字" };
    }
    if (num < min || num > max) {
      return { valid: false, message: `请输入 ${min}-${max} 之间的数值` };
    }
    return { valid: true };
  }
};

/**
 * 验证表单字段
 * @param {any} value - 待验证的值
 * @param {Function[]} rules - 验证规则数组
 * @returns {{valid: boolean, message?: string}} 验证结果
 */
export function validateField(value, rules) {
  for (const rule of rules) {
    const result = rule(value);
    if (!result.valid) {
      return result;
    }
  }
  return { valid: true };
}

/**
 * 批量验证多个字段
 * @param {Object} fields - 字段对象 { fieldName: value }
 * @param {Object} ruleSet - 规则对象 { fieldName: [rules] }
 * @returns {{[fieldName]: {valid: boolean, message?: string}}} 验证结果对象
 */
export function validateFields(fields, ruleSet) {
  const results = {};
  let hasErrors = false;

  for (const [fieldName, rules] of Object.entries(ruleSet)) {
    const value = fields[fieldName];
    const result = validateField(value, rules);
    results[fieldName] = result;
    if (!result.valid) {
      hasErrors = true;
    }
  }

  return { results, hasErrors };
}
