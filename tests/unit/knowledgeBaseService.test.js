import { afterEach, describe, expect, it } from "vitest";
import { mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createKnowledgeBaseService } from "../../server/services/knowledge/knowledgeBaseService.js";

async function createTempDir() {
  const dir = path.join(os.tmpdir(), `rihea-kb-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  await mkdir(dir, { recursive: true });
  return dir;
}

const cleanupDirs = [];

afterEach(async () => {
  await Promise.all(
    cleanupDirs.splice(0).map((dir) =>
      rm(dir, {
        recursive: true,
        force: true,
      })
    )
  );
});

describe("knowledge base service", () => {
  it("builds overview and searches unified documents with tenant and acl filters", async () => {
    const tempDir = await createTempDir();
    cleanupDirs.push(tempDir);

    const manualDocumentsFilePath = path.join(tempDir, "knowledge-documents.local.json");
    await writeFile(
      manualDocumentsFilePath,
      JSON.stringify(
        [
          {
            document_id: "doc_public_sleep",
            tenant_id: "rihea-default",
            source_type: "notion",
            source_id: "sleep_playbook",
            source_url: "https://example.notion.so/sleep-playbook",
            title: "孕期睡眠帮助中心",
            summary: "夜醒和焦虑时的帮助中心文章",
            body_text: "夜醒时先做三轮慢呼吸，再记录今晚最影响睡眠的一个触发点。",
            tags: ["sleep", "faq"],
            section_path: ["help-center", "sleep"],
            acl_principals: ["public"],
          },
          {
            document_id: "doc_private_acl",
            tenant_id: "tenant-enterprise-a",
            source_type: "confluence",
            source_id: "acl_playbook",
            source_url: "https://company.atlassian.net/wiki/acl-playbook",
            title: "ACL 同步手册",
            summary: "企业内部 ACL 同步文档",
            body_text: "检索前必须先按 tenant_id 和 acl_principals 做过滤。",
            tags: ["acl", "enterprise"],
            section_path: ["ops", "acl"],
            acl_principals: ["tenant:tenant-enterprise-a", "group:ops-admin"],
          },
        ],
        null,
        2
      ),
      "utf8"
    );

    const service = createKnowledgeBaseService({
      config: {
        defaultTenantId: "rihea-default",
        manualDocumentsFilePath,
        sourceRegistryFilePath: path.join(tempDir, "knowledge-connectors.local.json"),
        feishuSyncFilePath: path.join(tempDir, "feishu-knowledge.local.json"),
        feishuSyncEnabled: false,
      },
      now: () => new Date("2026-04-04T08:00:00.000Z"),
    });

    const overview = service.getOverview();
    expect(overview.architecture.canonical_entities).toContain("document");
    expect(overview.totals.documents).toBeGreaterThan(0);
    expect(overview.connectors.some((item) => item.connector_type === "notion")).toBe(true);

    const publicSearch = service.search({
      query: "夜醒 慢呼吸",
      tenantId: "rihea-default",
      principalIds: [],
      mode: "hybrid",
    });
    expect(publicSearch.total).toBeGreaterThan(0);
    expect(publicSearch.hits[0]?.source_type).toBeTruthy();
    expect(publicSearch.capabilities.acl_filtering).toBe(true);

    const deniedSearch = service.search({
      query: "ACL 过滤",
      tenantId: "tenant-enterprise-a",
      principalIds: [],
    });
    expect(deniedSearch.total).toBe(0);

    const allowedSearch = service.search({
      query: "ACL 过滤",
      tenantId: "tenant-enterprise-a",
      principalIds: ["group:ops-admin"],
    });
    expect(allowedSearch.total).toBeGreaterThan(0);

    const allowedDoc = service.getDocument({
      documentId: "doc_private_acl",
      tenantId: "tenant-enterprise-a",
      principalIds: ["group:ops-admin"],
    });
    expect(allowedDoc.document.document_id).toBe("doc_private_acl");
    expect(allowedDoc.chunks.length).toBeGreaterThan(0);
  });
});
