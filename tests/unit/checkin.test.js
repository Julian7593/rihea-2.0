import { describe, it, expect } from "vitest";
import {
  toDateKey,
  normalizeSleepHours,
  sleepHoursToPercent,
  normalizeEntry,
  calcCheckInStreak,
} from "../../src/utils/checkin";

describe("checkin utilities", () => {
  describe("toDateKey", () => {
    it("should format normal date correctly", () => {
      const date = new Date(2024, 5, 15); // 2024-06-15
      expect(toDateKey(date)).toBe("2024-06-15");
    });

    it("should handle single digit month and day", () => {
      const date = new Date(2024, 0, 5); // 2024-01-05
      expect(toDateKey(date)).toBe("2024-01-05");
    });

    it("should handle leap year February 29th", () => {
      const date = new Date(2024, 1, 29); // 2024-02-29
      expect(toDateKey(date)).toBe("2024-02-29");
    });

    it("should handle last day of year", () => {
      const date = new Date(2024, 11, 31); // 2024-12-31
      expect(toDateKey(date)).toBe("2024-12-31");
    });
  });

  describe("normalizeSleepHours", () => {
    it("should normalize valid sleep hours", () => {
      expect(normalizeSleepHours(7.5)).toBe(7.5);
      expect(normalizeSleepHours(8)).toBe(8.0);
    });

    it("should clamp to minimum value", () => {
      expect(normalizeSleepHours(1)).toBe(3.0);
      expect(normalizeSleepHours(2.5)).toBe(3.0);
    });

    it("should clamp to maximum value", () => {
      expect(normalizeSleepHours(15)).toBe(12.0);
      expect(normalizeSleepHours(13.5)).toBe(12.0);
    });

    it("should round to step (0.5)", () => {
      expect(normalizeSleepHours(6.7)).toBe(6.5);
      expect(normalizeSleepHours(5.2)).toBe(5.0);
    });

    it("should return clamped value for invalid values", () => {
      expect(normalizeSleepHours(null, "fallback")).toBe(3); // Number(null)=0, gets clamped to min 3
      expect(normalizeSleepHours(NaN, "fallback")).toBe(3);
      expect(normalizeSleepHours("string", "fallback")).toBe(3);
      expect(normalizeSleepHours(undefined, "fallback")).toBe(3);
    });

    it("should handle edge cases", () => {
      expect(normalizeSleepHours(3.0)).toBe(3.0); // minimum
      expect(normalizeSleepHours(12.0)).toBe(12.0); // maximum
    });
  });

  describe("sleepHoursToPercent", () => {
    it("should return 100 for 8 hours (ideal)", () => {
      expect(sleepHoursToPercent(8)).toBe(100);
    });

    it("should return 20 for 0 hours (minimum)", () => {
      expect(sleepHoursToPercent(0)).toBe(20);
    });

    it("should return 28 for 12 hours (maximum)", () => {
      expect(sleepHoursToPercent(12)).toBe(28); // |8-12|=4, 4*18=72, 100-72=28
    });

    it("should return null for invalid hours", () => {
      expect(sleepHoursToPercent(null)).toBeNull();
      expect(sleepHoursToPercent(NaN)).toBeNull();
      expect(sleepHoursToPercent("string")).toBeNull();
    });

    it("should calculate percentage correctly for intermediate values", () => {
      expect(sleepHoursToPercent(7)).toBe(82); // |8-7|=1, 1*18=18, 100-18=82
      expect(sleepHoursToPercent(6)).toBe(64); // |8-6|=2, 2*18=36, 100-36=64
    });
  });

  // Note: normalizeEntry is a private internal function, not exported from the module
  // Skipping tests for normalizeEntry to only test public APIs


  describe("calcCheckInStreak", () => {
    it("should calculate consecutive days correctly", () => {
      const today = new Date();
      const yesterday = new Date(today.getTime() - 86400000);
      const dayBefore = new Date(yesterday.getTime() - 86400000);

      const entries = [
        { date: toDateKey(today) },
        { date: toDateKey(yesterday) },
        { date: toDateKey(dayBefore) },
      ];
      expect(calcCheckInStreak(entries)).toBe(3);
    });

    it("should handle empty array", () => {
      expect(calcCheckInStreak([])).toBe(0);
    });

    it("should stop at first missing day", () => {
      const today = new Date();
      const twoDaysAgo = new Date(today.getTime() - 172800000);

      const entries = [
        { date: toDateKey(today) },
        { date: toDateKey(twoDaysAgo) }, // missing yesterday
      ];
      expect(calcCheckInStreak(entries)).toBe(1);
    });

    it("should return 0 for no matching dates", () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 30);

      const entries = [
        { date: toDateKey(oldDate) },
      ];
      expect(calcCheckInStreak(entries)).toBe(0);
    });

    it("should handle single day", () => {
      const today = new Date();
      const entries = [
        { date: toDateKey(today) },
      ];
      expect(calcCheckInStreak(entries)).toBe(1);
    });
  });
});
