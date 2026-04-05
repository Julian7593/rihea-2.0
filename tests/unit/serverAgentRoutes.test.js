import { afterEach, describe, expect, it } from "vitest";
import { createApp } from "../../server/app.js";
import { createAgentOrchestratorService } from "../../server/services/agent/orchestratorService.js";
import { createInitialAgentAuditState, createAgentAuditLogger } from "../../server/services/agent/audit/agentAuditLogger.js";
import { createInitialSessionMemoryState, createSessionMemoryStore } from "../../server/services/agent/memory/sessionMemoryStore.js";
import { createInitialUserStateMemoryState, createUserStateMemoryStore } from "../../server/services/agent/memory/userStateMemoryStore.js";
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

async function createTestServer() {
  const partnerStore = createMemoryStore(createInitialPartnerSyncState(new Date("2026-03-10T08:00:00.000Z")));
  const cbtStore = createMemoryStore(createInitialCbtServiceState(new Date("2026-03-10T08:00:00.000Z")));
  const sessionStore = createMemoryStore(createInitialSessionMemoryState());
  const userStateStore = createMemoryStore(createInitialUserStateMemoryState());
  const auditStore = createMemoryStore(createInitialAgentAuditState());

  const partnerSyncService = createPartnerSyncService({
    store: partnerStore,
    now: () => new Date("2026-03-10T08:00:00.000Z"),
  });
  const cbtService = createCbtService({
    store: cbtStore,
    now: () => new Date("2026-03-10T08:00:00.000Z"),
  });
  const sessionMemoryStore = createSessionMemoryStore({
    store: sessionStore,
    now: () => new Date("2026-03-10T08:00:00.000Z"),
  });
  const userStateMemoryStore = createUserStateMemoryStore({
    store: userStateStore,
    now: () => new Date("2026-03-10T08:00:00.000Z"),
  });
  const auditLogger = createAgentAuditLogger({
    store: auditStore,
    now: () => new Date("2026-03-10T08:00:00.000Z"),
  });
  const agentOrchestratorService = createAgentOrchestratorService({
    sessionMemoryStore,
    userStateMemoryStore,
    auditLogger,
    cbtService,
    now: () => new Date("2026-03-10T08:00:00.000Z"),
  });

  const app = createApp({
    partnerSyncService,
    cbtService,
    agentOrchestratorService,
    corsOrigin: true,
  });

  return new Promise((resolve) => {
    const server = app.listen(0, "127.0.0.1", () => {
      servers.push(server);
      const address = server.address();
      resolve(`http://127.0.0.1:${address.port}`);
    });
  });
}

describe("agent routes", () => {
  it("serves /v1/agent/chat, history and escalations with requestId", async () => {
    const baseUrl = await createTestServer();
    const chatResponse = await fetch(`${baseUrl}/v1/agent/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: "user_route_1",
        sessionId: "session_route_1",
        message: "我很焦虑，不知道怎么办。",
        lang: "zh",
        clientContext: {
          profile: { pregnancyWeek: "24+3" },
        },
      }),
    });

    const chatPayload = await chatResponse.json();
    expect(chatResponse.status).toBe(200);
    expect(chatPayload.code).toBe("OK");
    expect(typeof chatPayload.requestId).toBe("string");
    expect(chatPayload.data.answer.length).toBeGreaterThan(0);
    expect(chatPayload.data.answer_raw).toBe(chatPayload.data.answer);
    expect(chatPayload.data.reasoning_summary).toBeTruthy();
    expect(Array.isArray(chatPayload.data.sources)).toBe(true);
    expect(Array.isArray(chatPayload.data.citations)).toBe(true);
    expect(Array.isArray(chatPayload.data.usedSources)).toBe(true);
    expect("kbFreshness" in chatPayload.data).toBe(true);
    expect("confidence" in chatPayload.data).toBe(true);
    expect(chatPayload.data.search_meta).toBeTruthy();
    expect(typeof chatPayload.data.classification?.primary_intent).toBe("string");
    expect(typeof chatPayload.data.routing?.route).toBe("string");

    const presetsResponse = await fetch(`${baseUrl}/v1/agent/presets?lang=zh`);
    const presetsPayload = await presetsResponse.json();
    expect(presetsResponse.status).toBe(200);
    expect(Array.isArray(presetsPayload.data.items)).toBe(true);

    const historyResponse = await fetch(
      `${baseUrl}/v1/agent/sessions/session_route_1/history?userId=user_route_1`
    );
    const historyPayload = await historyResponse.json();
    expect(historyResponse.status).toBe(200);
    expect(historyPayload.data.rounds.length).toBeGreaterThan(0);

    const riskResponse = await fetch(`${baseUrl}/v1/agent/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: "user_route_1",
        sessionId: "session_route_1",
        message: "我不想活了。",
        lang: "zh",
      }),
    });
    expect(riskResponse.status).toBe(200);

    const escalationsResponse = await fetch(`${baseUrl}/v1/agent/escalations?userId=user_route_1&range=30d`);
    const escalationsPayload = await escalationsResponse.json();
    expect(escalationsResponse.status).toBe(200);
    expect(Array.isArray(escalationsPayload.data.items)).toBe(true);
    expect(escalationsPayload.data.items.length).toBeGreaterThan(0);
  });
});
