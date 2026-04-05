import { afterEach, describe, expect, it } from "vitest";
import { createApp } from "../../server/app.js";
import { createCbtService, createInitialCbtServiceState } from "../../server/services/cbtService.js";
import { createNutritionService } from "../../server/services/nutritionService.js";
import { createPartnerSyncService, createInitialPartnerSyncState } from "../../server/services/partnerSyncService.js";
import { createMemoryStore } from "../../server/store/jsonStore.js";

const servers = [];

afterEach(async () => {
  await Promise.all(
    servers.splice(0).map(
      (server) =>
        new Promise((resolve, reject) => {
          server.close((error) => {
            if (error) reject(error);
            else resolve();
          });
        })
    )
  );
});

function createTestServer() {
  const partnerStore = createMemoryStore(createInitialPartnerSyncState(new Date("2026-03-10T08:00:00.000Z")));
  const cbtStore = createMemoryStore(createInitialCbtServiceState(new Date("2026-03-10T08:00:00.000Z")));
  const partnerSyncService = createPartnerSyncService({
    store: partnerStore,
    now: () => new Date("2026-03-10T08:00:00.000Z"),
  });
  const cbtService = createCbtService({
    store: cbtStore,
    now: () => new Date("2026-03-10T08:00:00.000Z"),
  });
  const nutritionService = createNutritionService();
  const app = createApp({ partnerSyncService, cbtService, nutritionService, corsOrigin: true });

  return new Promise((resolve) => {
    const server = app.listen(0, "127.0.0.1", () => {
      servers.push(server);
      const address = server.address();
      resolve(`http://127.0.0.1:${address.port}`);
    });
  });
}

describe("nutrition routes", () => {
  it("serves photo analysis endpoint", async () => {
    const baseUrl = await createTestServer();

    const response = await fetch(`${baseUrl}/v1/nutrition/photo-analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        imageBase64: "data:image/jpeg;base64,ZmFrZQ==",
        fileName: "sushi.jpg",
        mealType: "dinner",
        pregnancyWeek: "25+0",
        allergies: [],
        medicalContraindications: { diet: [] },
      }),
    });

    const payload = await response.json();
    expect(response.status).toBe(200);
    expect(payload.data.detectedFoods.length).toBeGreaterThan(0);
    expect(payload.data.pregnancyAdvice.avoid.length).toBeGreaterThan(0);
  });
});

