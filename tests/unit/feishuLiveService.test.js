import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createFeishuLiveService } from "../../server/services/agent/feishu/feishuLiveService.js";

const tempDirs = [];

afterEach(async () => {
  await Promise.all(
    tempDirs.splice(0).map((dirPath) =>
      rm(dirPath, {
        recursive: true,
        force: true,
      })
    )
  );
});

async function createTargetsFile(entries) {
  const dirPath = await mkdtemp(path.join(os.tmpdir(), "rihea-feishu-live-"));
  tempDirs.push(dirPath);
  const filePath = path.join(dirPath, "targets.json");
  await writeFile(filePath, `${JSON.stringify(entries, null, 2)}\n`, "utf8");
  return filePath;
}

describe("feishu live service", () => {
  it("searches configured active targets through the Feishu client", async () => {
    const targetsFilePath = await createTargetsFile([
      {
        knowledgeId: "SLP-001",
        title: "孕期睡眠支持知识卡",
        domain: "sleep",
        applicability: ["pregnancy"],
        severity: "normal",
        docType: "docx",
        documentId: "doc_sleep_001",
        scopeId: "pregnancy_sleep",
        status: "active",
        version: 1,
        vectorId: "",
        owner: "owner@example.com",
        tags: ["睡眠", "夜醒"],
        sourceUrl: "https://tenant.feishu.cn/docx/doc_sleep_001",
      },
    ]);

    const service = createFeishuLiveService({
      config: {
        liveEnabled: true,
        targetsFilePath,
        syncIntervalMinutes: 60,
      },
      feishuClient: {
        async getTargetRawContent(target) {
          return {
            documentId: target.documentId,
            title: target.title,
            content: "孕期夜醒时，先做慢呼吸，再记录触发因素和当晚的一个小调整。",
            sourceUrl: target.sourceUrl,
            fetchedAt: "2026-04-05T10:00:00.000Z",
          };
        },
      },
      now: () => Date.parse("2026-04-05T10:00:00.000Z"),
    });

    const result = await service.search({
      query: "孕期夜醒怎么缓解",
      scopeId: "pregnancy_sleep",
      topK: 4,
    });

    expect(result.used).toBe(true);
    expect(result.error_code).toBeNull();
    expect(Array.isArray(result.hits)).toBe(true);
    expect(result.hits[0]?.source_type).toBe("feishu_live");
    expect(result.hits[0]?.document_id).toBe("doc_sleep_001");
  });

  it("returns empty when live lookup is disabled", async () => {
    const service = createFeishuLiveService({
      config: {
        liveEnabled: false,
      },
    });

    const result = await service.search({
      query: "孕期情绪支持",
    });

    expect(result.used).toBe(false);
    expect(result.error_code).toBe("FEISHU_LIVE_DISABLED");
  });
});
