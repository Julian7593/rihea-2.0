import { afterEach, describe, expect, it, vi } from "vitest";
import { createNutritionPhotoAnalyzer, createNutritionService } from "../../server/services/nutritionService.js";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("server nutrition service", () => {
  it("analyzes a meal photo and returns pregnancy advice", async () => {
    const service = createNutritionService();

    const result = await service.analyzeMealPhoto({
      imageBase64: "data:image/jpeg;base64,ZmFrZQ==",
      fileName: "milk-spinach-breakfast.jpg",
      mealType: "breakfast",
      pregnancyWeek: "24+3",
      allergies: [],
      medicalContraindications: { diet: [] },
    });

    expect(result.detectedFoods.length).toBeGreaterThan(0);
    expect(result.pregnancyAdvice.nutrientHighlights.length).toBeGreaterThan(0);
    expect(typeof result.needsUserConfirmation).toBe("boolean");
  });

  it("rejects requests without image payload", async () => {
    const service = createNutritionService();

    await expect(service.analyzeMealPhoto({ mealType: "breakfast" })).rejects.toMatchObject({
      statusCode: 400,
      code: "BAD_REQUEST",
    });
  });

  it("supports zhipu vision provider responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  detectedFoods: [
                    { sourceLabel: "牛奶", confidence: 0.93, category: "dairy" },
                    { sourceLabel: "菠菜", confidence: 0.79, category: "vegetables" },
                  ],
                }),
              },
            },
          ],
        }),
      }))
    );

    const analyzer = createNutritionPhotoAnalyzer({
      provider: "zhipu",
      zhipuApiKey: "test-key",
      zhipuBaseUrl: "https://open.bigmodel.cn/api/paas/v4",
      zhipuVisionModel: "glm-5v-turbo",
      zhipuVisionTimeoutMs: 3000,
    });
    const service = createNutritionService({ photoAnalyzer: analyzer });

    const result = await service.analyzeMealPhoto({
      imageBase64: "data:image/jpeg;base64,ZmFrZQ==",
      fileName: "milk-spinach-breakfast.jpg",
      mealType: "breakfast",
      pregnancyWeek: "24+3",
      allergies: [],
      medicalContraindications: { diet: [] },
    });

    expect(result.detectedFoods).toHaveLength(2);
    expect(result.detectedFoods[0].foodId).toBe("milk");
    expect(result.detectedFoods[1].foodId).toBe("spinach");
    expect(result.needsUserConfirmation).toBe(true);
  });
});
