import { afterEach, describe, expect, it } from "vitest";
import { createApp } from "../../server/app.js";
import { createCbtService, createInitialCbtServiceState } from "../../server/services/cbtService.js";
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
  const app = createApp({ partnerSyncService, cbtService, corsOrigin: true });
  return new Promise((resolve) => {
    const server = app.listen(0, "127.0.0.1", () => {
      servers.push(server);
      const address = server.address();
      resolve(`http://127.0.0.1:${address.port}`);
    });
  });
}

describe("server express app", () => {
  it("serves health, partner overview and cbt overview endpoints", async () => {
    const baseUrl = await createTestServer();

    const healthResponse = await fetch(`${baseUrl}/health`);
    const healthPayload = await healthResponse.json();

    expect(healthResponse.status).toBe(200);
    expect(healthPayload.code).toBe("OK");
    expect(healthPayload.data.status).toBe("ok");

    const overviewResponse = await fetch(`${baseUrl}/v1/partner-sync/overview?lang=zh`);
    const overviewPayload = await overviewResponse.json();

    expect(overviewResponse.status).toBe(200);
    expect(overviewPayload.code).toBe("OK");
    expect(overviewPayload.data.status).toBe("disabled");
    expect(overviewPayload.data.owner.nickname).toBe("Yiting");

    const cbtResponse = await fetch(`${baseUrl}/v1/cbt/overview?lang=zh`);
    const cbtPayload = await cbtResponse.json();

    expect(cbtResponse.status).toBe(200);
    expect(cbtPayload.code).toBe("OK");
    expect(cbtPayload.data.phase).toBe("intake");
    expect(cbtPayload.data.careLevel.code).toBe("level1");
  });
});
