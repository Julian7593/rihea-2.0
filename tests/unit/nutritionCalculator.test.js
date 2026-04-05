import { describe, expect, it } from "vitest";
import {
  buildFoodPhotoAnalysisFallback,
  buildPregnancyFoodPhotoAdvice,
  estimateRecognizedFoodNutrition,
  normalizeRecognizedFoods,
} from "../../src/utils/nutritionCalculator.js";

describe("nutrition calculator photo analysis helpers", () => {
  it("normalizes recognized foods into internal food ids", () => {
    const result = normalizeRecognizedFoods([
      { sourceLabel: "牛奶", confidence: 0.91 },
      { sourceLabel: "菠菜", confidence: 0.83 },
    ]);

    expect(result).toHaveLength(2);
    expect(result[0].foodId).toBe("milk");
    expect(result[1].foodId).toBe("spinach");
  });

  it("builds pregnancy-friendly advice from recognized foods", () => {
    const advice = buildPregnancyFoodPhotoAdvice({
      recognizedFoods: [
        { sourceLabel: "牛奶", confidence: 0.9 },
        { sourceLabel: "菠菜", confidence: 0.88 },
      ],
      profile: {
        pregnancyWeek: "24+3",
        allergies: [],
        medicalContraindications: { diet: [] },
      },
    });

    expect(advice.safe.length).toBeGreaterThan(0);
    expect(advice.nutrientHighlights.some((item) => item.nutrient === "calcium")).toBe(true);
    expect(advice.nutrientHighlights.some((item) => item.nutrient === "folic_acid")).toBe(true);
  });

  it("flags obvious pregnancy risk foods", () => {
    const advice = buildPregnancyFoodPhotoAdvice({
      recognizedFoods: [
        { sourceLabel: "寿司", confidence: 0.82 },
        { sourceLabel: "红酒", confidence: 0.8 },
      ],
      profile: {
        pregnancyWeek: "18+2",
        allergies: [],
        medicalContraindications: { diet: [] },
      },
    });

    expect(advice.avoid.join(" ")).toContain("孕期");
  });

  it("estimates nutrition from mapped recognized foods", () => {
    const nutrition = estimateRecognizedFoodNutrition([
      { sourceLabel: "鸡蛋", confidence: 0.95 },
      { sourceLabel: "牛奶", confidence: 0.92 },
    ]);

    expect(nutrition.calories).toBeGreaterThan(150);
    expect(nutrition.protein).toBeGreaterThan(10);
    expect(nutrition.calcium).toBeGreaterThan(250);
  });

  it("creates a usable local fallback analysis", () => {
    const result = buildFoodPhotoAnalysisFallback({
      fileName: "breakfast-milk-egg.jpg",
      mealType: "breakfast",
      profile: {
        pregnancyWeek: "20+1",
      },
    });

    expect(result.detectedFoods.length).toBeGreaterThan(0);
    expect(result.needsUserConfirmation).toBe(true);
    expect(result.disclaimer).toContain("不能替代");
  });
});

