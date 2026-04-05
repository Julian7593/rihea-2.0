import { readFile } from "node:fs/promises";
import { serverConfig } from "../config.js";
import { createFeishuClient } from "../services/agent/feishu/feishuClient.js";

function normalizeText(value, maxLength = 160) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

async function loadTargets(filePath) {
  const raw = await readFile(filePath, "utf8");
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed : [];
}

function pickTarget(targets, requestedId = "") {
  const safeRequestedId = String(requestedId || "").trim().toLowerCase();
  if (safeRequestedId) {
    return (
      targets.find((item) => String(item.knowledgeId || "").trim().toLowerCase() === safeRequestedId) ||
      targets.find((item) => String(item.title || "").trim().toLowerCase().includes(safeRequestedId))
    );
  }

  return targets.find((item) => item.status === "active" && (item.documentId || item.wikiNodeToken)) || targets[0];
}

function printStep(title, detail) {
  console.log(`\n[check] ${title}`);
  if (detail) console.log(detail);
}

async function main() {
  const config = serverConfig.feishuKnowledge;
  const requestedId = process.argv[2] || "";

  printStep("配置检查", [
    `FEISHU_BASE_URL=${config.baseUrl}`,
    `FEISHU_KB_SYNC_ENABLED=${String(config.syncEnabled)}`,
    `FEISHU_KB_LIVE_ENABLED=${String(config.liveEnabled)}`,
    `targetsFile=${config.targetsFilePath}`,
    `syncFile=${config.syncFilePath}`,
  ].join("\n"));

  if (!config.appId || !config.appSecret) {
    throw new Error("缺少 FEISHU_APP_ID 或 FEISHU_APP_SECRET，请先在 .env 中填写。");
  }

  const targets = await loadTargets(config.targetsFilePath);
  if (!targets.length) {
    throw new Error(`目标文件为空：${config.targetsFilePath}`);
  }

  const target = pickTarget(targets, requestedId);
  if (!target) {
    throw new Error(`未找到可测试的目标条目。你可以传 knowledgeId，例如：npm run check:feishu-kb -- PROD-001`);
  }

  printStep(
    "目标文档",
    [
      `knowledgeId=${target.knowledgeId || ""}`,
      `title=${target.title || ""}`,
      `docType=${target.docType || "docx"}`,
      `documentId=${target.documentId || ""}`,
      `wikiNodeToken=${target.wikiNodeToken || ""}`,
      `sourceUrl=${target.sourceUrl || ""}`,
    ].join("\n")
  );

  const client = createFeishuClient({
    appId: config.appId,
    appSecret: config.appSecret,
    baseUrl: config.baseUrl,
  });

  const token = await client.getTenantAccessToken();
  printStep("Token 检查通过", `tenant_access_token 已获取，前 12 位：${token.slice(0, 12)}...`);

  const resolved = await client.resolveTarget(target);
  printStep(
    "目标解析通过",
    [
      `resolvedDocumentId=${resolved.documentId || ""}`,
      `resolvedTitle=${resolved.title || ""}`,
      `resolvedSourceUrl=${resolved.sourceUrl || ""}`,
    ].join("\n")
  );

  const raw = await client.getTargetRawContent(target);
  const preview = normalizeText(raw.content || "", 200);
  printStep(
    "文档读取通过",
    [
      `documentId=${raw.documentId || ""}`,
      `fetchedAt=${raw.fetchedAt || ""}`,
      `contentPreview=${preview || "[空内容]"}`,
    ].join("\n")
  );

  console.log("\n[check] 飞书访问检查成功。下一步可以直接运行：npm run sync:feishu-kb");
}

main().catch((error) => {
  console.error("\n[check] 飞书访问检查失败");
  console.error(`code=${error?.code || "UNKNOWN_ERROR"}`);
  console.error(`message=${error?.message || error}`);
  if (error?.status) {
    console.error(`status=${error.status}`);
  }
  if (error?.requestUrl) {
    console.error(`requestUrl=${error.requestUrl}`);
  }
  if (error?.logId) {
    console.error(`x-tt-logid=${error.logId}`);
  }
  if (error?.payload) {
    try {
      console.error(`payload=${JSON.stringify(error.payload)}`);
    } catch {
      console.error("payload=[unserializable]");
    }
  }
  process.exitCode = 1;
});
