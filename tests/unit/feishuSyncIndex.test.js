import { afterEach, describe, expect, it } from "vitest";
import { mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createFeishuSyncIndex } from "../../server/services/agent/feishu/feishuSyncIndex.js";

async function createTempDir() {
  const dir = path.join(os.tmpdir(), `rihea-feishu-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
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

describe("feishu sync index", () => {
  it("loads synced entries from local file when available", async () => {
    const tempDir = await createTempDir();
    cleanupDirs.push(tempDir);
    const filePath = path.join(tempDir, "feishu-knowledge.local.json");
    await writeFile(
      filePath,
      JSON.stringify(
        [
          {
            id: "feishu_test_doc",
            title: "孕期睡眠知识",
            summary: "测试摘要",
            content: "这里是孕期夜醒的详细说明。",
            tags: ["睡眠", "夜醒"],
            scopeId: "pregnancy_sleep",
            sourceUrl: "https://example.feishu.cn/docx/test",
            updatedAt: "2026-04-04T08:00:00.000Z",
            accessScope: "configured_pages",
            documentId: "doc_test_001",
          },
        ],
        null,
        2
      ),
      "utf8"
    );

    const index = createFeishuSyncIndex({ filePath });
    const result = index.search({
      query: "夜醒",
      scopeId: "pregnancy_sleep",
    });

    expect(result.total).toBe(1);
    expect(result.hits[0]?.id).toBe("feishu_test_doc");
    expect(result.hits[0]?.source_type).toBe("feishu_sync");
    expect(result.hits[0]?.document_id).toBe("doc_test_001");
  });
});
