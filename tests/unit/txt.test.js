import { describe, it, expect } from "vitest";
import { txt } from "../../src/utils/txt";

describe("txt utility", () => {
  it("should return Chinese text for zh language", () => {
    const enText = "Hello";
    const zhText = "你好";
    const result = txt("zh", enText, zhText);
    expect(result).toBe(zhText);
  });

  it("should return English text for en language", () => {
    const enText = "Hello";
    const zhText = "你好";
    const result = txt("en", enText, zhText);
    expect(result).toBe(enText);
  });

  it("should default to English for unknown language", () => {
    const enText = "Hello";
    const zhText = "你好";
    const result = txt("fr", enText, zhText);
    expect(result).toBe(enText);
  });

  it("should default to English for null language", () => {
    const enText = "Hello";
    const zhText = "你好";
    const result = txt(null, enText, zhText);
    expect(result).toBe(enText);
  });

  it("should default to English for undefined language", () => {
    const enText = "Hello";
    const zhText = "你好";
    const result = txt(undefined, enText, zhText);
    expect(result).toBe(enText);
  });

  it("should work with same text for both languages", () => {
    const text = "OK";
    const result = txt("zh", text, text);
    expect(result).toBe(text);
  });
});
