import { useEffect, useState } from "react";

const resolveInitialValue = (initialValue) => (
  typeof initialValue === "function" ? initialValue() : initialValue
);

const defaultDeserialize = (value) => {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const defaultSerialize = (value) => (
  typeof value === "string" ? value : JSON.stringify(value)
);

/**
 * 自定义 Hook：同步 state 与 localStorage（支持可选序列化策略）
 * @param {string} key
 * @param {any|Function} initialValue
 * @param {{ serialize?: Function, deserialize?: Function }} options
 * @returns {[any, Function]}
 */
export function useLocalStorage(key, initialValue, options = {}) {
  const { serialize = defaultSerialize, deserialize = defaultDeserialize } = options;

  const [storedValue, setStoredValue] = useState(() => {
    const fallbackValue = resolveInitialValue(initialValue);
    if (typeof window === "undefined") return fallbackValue;

    try {
      const item = window.localStorage.getItem(key);
      if (item === null) return fallbackValue;
      const nextValue = deserialize(item, fallbackValue);
      return typeof nextValue === "undefined" ? fallbackValue : nextValue;
    } catch (error) {
      console.warn(`读取 localStorage 错误 (${key}):`, error);
      return fallbackValue;
    }
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(key, serialize(storedValue));
    } catch (error) {
      console.warn(`写入 localStorage 错误 (${key}):`, error);
    }
  }, [key, serialize, storedValue]);

  return [storedValue, setStoredValue];
}
