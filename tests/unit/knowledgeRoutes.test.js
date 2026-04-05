import { afterEach, describe, expect, it } from "vitest";
import { mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createApp } from "../../server/app.js";
import { createKnowledgeBaseService } from "../../server/services/knowledge/knowledgeBaseService.js";
import { createCbtService, createInitialCbtServiceState } from "../../server/services/cbtService.js";
import { createPartnerSyncService, createInitialPartnerSyncState } from "../../server/services/partnerSyncService.js";
import { createMemoryStore } from "../../server/store/jsonStore.js";

const servers = [];
const cleanupDirs = [];

async function createTempDir() {
  const dir = path.join(os.tmpdir(), `rihea-kb-routes-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  await mkdir(dir, { recursive: true });
  return dir;
}

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

  await Promise.all(
    cleanupDirs.splice(0).map((dir) =>
      rm(dir, {
        recursive: true,
        force: true,
      })
    )
  );
});

async function createTestServer() {
  const tempDir = await createTempDir();
  cleanupDirs.push(tempDir);
  const manualDocumentsFilePath = path.join(tempDir, "knowledge-documents.local.json");

  await writeFile(
    manualDocumentsFilePath,
    JSON.stringify(
      [
        {
          document_id: "doc_help_sleep",
          tenant_id: "rihea-default",
          source_type: "notion",
          source_id: "sleep_help",
          source_url: "https://example.notion.so/sleep-help",
          title: "睡眠帮助中心",
          summary: "帮助中心条目",
          body_text: "帮助中心支持夜醒、慢呼吸和记录触发点。",
          tags: ["sleep", "help-center"],
          section_path: ["help-center", "sleep"],
          acl_principals: ["public"],
        }
      ],
      null,
      2
    ),
    "utf8"
  );

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
  const knowledgeBaseService = createKnowledgeBaseService({
    config: {
      defaultTenantId: "rihea-default",
      manualDocumentsFilePath,
      sourceRegistryFilePath: path.join(tempDir, "knowledge-connectors.local.json"),
      feishuSyncFilePath: path.join(tempDir, "feishu-knowledge.local.json"),
      feishuSyncEnabled: false,
    },
    now: () => new Date("2026-04-04T08:00:00.000Z"),
  });

  const app = createApp({
    partnerSyncService,
    cbtService,
    knowledgeBaseService,
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

describe("knowledge routes", () => {
  it("serves unified knowledge overview, search and document detail", async () => {
    const baseUrl = await createTestServer();

    const overviewResponse = await fetch(`${baseUrl}/v1/knowledge/overview?tenantId=rihea-default`);
    const overviewPayload = await overviewResponse.json();
    expect(overviewResponse.status).toBe(200);
    expect(overviewPayload.data.totals.documents).toBeGreaterThan(0);

    const searchResponse = await fetch(`${baseUrl}/v1/knowledge/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tenantId: "rihea-default",
        query: "夜醒 慢呼吸",
        topK: 3,
        mode: "hybrid",
      }),
    });
    const searchPayload = await searchResponse.json();
    expect(searchResponse.status).toBe(200);
    expect(searchPayload.data.total).toBeGreaterThan(0);
    expect(searchPayload.data.hits[0]?.document_id).toBeTruthy();

    const documentResponse = await fetch(
      `${baseUrl}/v1/knowledge/documents/doc_help_sleep?tenantId=rihea-default`
    );
    const documentPayload = await documentResponse.json();
    expect(documentResponse.status).toBe(200);
    expect(documentPayload.data.document.title).toBe("睡眠帮助中心");
    expect(documentPayload.data.chunks.length).toBeGreaterThan(0);
  });
});
