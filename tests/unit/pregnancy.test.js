import { describe, it, expect } from "vitest";
import {
  parseIsoDate,
  toIsoDate,
  isValidWeekLabel,
  normalizeWeekLabel,
  PREGNANCY_DATING_METHOD,
} from "../../src/utils/pregnancy";

describe("pregnancy utilities", () => {
  describe("parseIsoDate", () => {
    it("should parse valid YYYY-MM-DD format", () => {
      const result = parseIsoDate("2024-06-15");
      expect(result).toBeInstanceOf(Date);
      expect(result.getFullYear()).toBe(2024);
      expect(result.getMonth()).toBe(5); // June is 5 (0-indexed)
      expect(result.getDate()).toBe(15);
    });

    it("should return null for invalid format", () => {
      expect(parseIsoDate("06/15/2024")).toBeNull();
      expect(parseIsoDate("2024/06/15")).toBeNull();
      expect(parseIsoDate("2024-13-01")).toBeNull(); // invalid month
      expect(parseIsoDate("2024-01-32")).toBeNull(); // invalid day
    });

    it("should return null for invalid date like Feb 30", () => {
      expect(parseIsoDate("2024-02-30")).toBeNull();
    });

    it("should return null for non-string input", () => {
      expect(parseIsoDate(null)).toBeNull();
      expect(parseIsoDate(undefined)).toBeNull();
      expect(parseIsoDate(123)).toBeNull();
    });
  });

  describe("toIsoDate", () => {
    it("should format date to YYYY-MM-DD", () => {
      const date = new Date(2024, 5, 15);
      expect(toIsoDate(date)).toBe("2024-06-15");
    });

    it("should pad single digit month and day", () => {
      const date = new Date(2024, 0, 5); // Jan 5
      expect(toIsoDate(date)).toBe("2024-01-05");
    });

    it("should handle leap year", () => {
      const date = new Date(2024, 1, 29); // Feb 29, 2024 (leap year)
      expect(toIsoDate(date)).toBe("2024-02-29");
    });

    it("should handle last day of year", () => {
      const date = new Date(2024, 11, 31); // Dec 31
      expect(toIsoDate(date)).toBe("2024-12-31");
    });
  });

  describe("isValidWeekLabel", () => {
    it("should accept valid week labels", () => {
      expect(isValidWeekLabel("24+3")).toBe(true);
      expect(isValidWeekLabel("0+0")).toBe(true);
      expect(isValidWeekLabel("45+6")).toBe(true);
      expect(isValidWeekLabel("12+0")).toBe(true);
    });

    it("should reject invalid format", () => {
      expect(isValidWeekLabel("24")).toBe(false); // missing day part
      expect(isValidWeekLabel("24-3")).toBe(false); // wrong separator
      expect(isValidWeekLabel("24.3")).toBe(false); // wrong separator
    });

    it("should reject out of range values", () => {
      expect(isValidWeekLabel("46+0")).toBe(false); // week too high
      expect(isValidWeekLabel("-1+0")).toBe(false); // negative week
      expect(isValidWeekLabel("24+7")).toBe(false); // day too high
      expect(isValidWeekLabel("24+-1")).toBe(false); // negative day
    });

    it("should reject non-string input", () => {
      expect(isValidWeekLabel(null)).toBe(false);
      expect(isValidWeekLabel(undefined)).toBe(false);
      expect(isValidWeekLabel(24)).toBe(false);
      expect(isValidWeekLabel({ week: 24, day: 3 })).toBe(false);
    });
  });

  describe("normalizeWeekLabel", () => {
    it("should normalize valid labels", () => {
      expect(normalizeWeekLabel("24+3")).toBe("24+3");
      expect(normalizeWeekLabel(" 24+3 ")).toBe("24+3"); // trim spaces
      expect(normalizeWeekLabel("024+03")).toBe("24+3"); // remove leading zeros
    });

    it("should return empty string for invalid labels", () => {
      expect(normalizeWeekLabel("invalid")).toBe("");
      expect(normalizeWeekLabel("24")).toBe("");
      expect(normalizeWeekLabel("46+0")).toBe("");
    });
  });

  describe("PREGNANCY_DATING_METHOD", () => {
    it("should export expected constants", () => {
      expect(PREGNANCY_DATING_METHOD.DUE_DATE).toBe("dueDate");
      expect(PREGNANCY_DATING_METHOD.LMP).toBe("lmp");
      expect(PREGNANCY_DATING_METHOD.IVF).toBe("ivf");
    });
  });
});
