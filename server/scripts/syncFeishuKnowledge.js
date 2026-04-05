import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { serverConfig } from "../config.js";
import { createFeishuClient } from "../services/agent/feishu/feishuClient.js";

const SAMPLE_TARGETS = [
  {
    knowledgeId: "PROD-001",
    title: "AI 助手简介与回答边界",
    domain: "product",
    applicability: ["pregnancy"],
    severity: "normal",
    docType: "docx",
    documentId: "doccnxxxxxxxxxxxxxxxxxxxxxx",
    scopeId: "product_intro",
    status: "active",
    version: 1,
    vectorId: "",
    owner: "owner@example.com",
    tags: ["ai简介", "回答边界", "产品能力"],
    sourceUrl: "https://your-domain.feishu.cn/docx/doccnxxxxxxxxxxxxxxxxxxxxxx",
  },
  {
    knowledgeId: "SLP-001",
    title: "孕期睡眠支持知识卡",
    domain: "sleep",
    applicability: ["pregnancy"],
    severity: "normal",
    docType: "docx",
    documentId: "doccn_sleep_example_xxxxxxxx",
    scopeId: "pregnancy_sleep",
    status: "active",
    version: 1,
    vectorId: "",
    owner: "owner@example.com",
    tags: ["睡眠", "夜醒", "孕期"],
    sourceUrl: "https://your-domain.feishu.cn/docx/doccn_sleep_example_xxxxxxxx",
  },
];

function normalizeText(value, maxLength = 320) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function normalizeTags(value) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => normalizeText(item, 32)).filter(Boolean).slice(0, 10);
}

function normalizeApplicability(value) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => normalizeText(item, 32)).filter(Boolean).slice(0, 8);
}

function buildSummary(content = "") {
  const clean = normalizeText(content, 2000);
  if (!clean) return "";
  return clean.length > 140 ? `${clean.slice(0, 140)}...` : clean;
}

async function ensureJsonFile(filePath, initialValue) {
  await mkdir(path.dirname(filePath), { recursive: true });

  try {
    await readFile(filePath, "utf8");
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
    await writeFile(filePath, `${JSON.stringify(initialValue, null, 2)}\n`, "utf8");
  }
}

async function readJsonFile(filePath, fallback) {
  try {
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function normalizeTarget(target = {}) {
  return {
    knowledgeId: normalizeText(target.knowledgeId || target.knowledge_id, 80),
    documentId: normalizeText(target.documentId || target.document_id, 120),
    wikiNodeToken: normalizeText(target.wikiNodeToken || target.wiki_node_token, 120),
    title: normalizeText(target.title, 120),
    domain: normalizeText(target.domain, 48),
    applicability: normalizeApplicability(target.applicability),
    severity: normalizeText(target.severity || "normal", 32) || "normal",
    docType: normalizeText(target.docType || target.doc_type || "docx", 24) || "docx",
    scopeId: normalizeText(target.scopeId || target.scope_id, 64),
    status: normalizeText(target.status || "active", 32) || "active",
    version: Number.isFinite(Number(target.version)) ? Number(target.version) : 1,
    expiresAt: normalizeText(target.expiresAt || target.expires_at, 40),
    owner: normalizeText(target.owner, 80),
    vectorId: normalizeText(target.vectorId || target.vector_id, 120),
    tags: normalizeTags(target.tags),
    sourceUrl: normalizeText(target.sourceUrl || target.source_url, 320),
  };
}

async function main() {
  const config = serverConfig.feishuKnowledge;
  const targetsFilePath = config.targetsFilePath;
  const syncFilePath = config.syncFilePath;

  await ensureJsonFile(targetsFilePath, SAMPLE_TARGETS);

  if (!config.appId || !config.appSecret) {
    throw new Error("Missing FEISHU_APP_ID or FEISHU_APP_SECRET in .env");
  }

  const rawTargets = await readJsonFile(targetsFilePath, []);
  const targets = rawTargets.map(normalizeTarget).filter((item) => item.documentId || item.wikiNodeToken);

  if (!targets.length || targets.some((item) => item.documentId.startsWith("doccnxxxxxxxx") || item.documentId.startsWith("doccn_sleep_example"))) {
    throw new Error(
      `Please edit ${targetsFilePath} and replace the sample documentId/wikiNodeToken with your real Feishu targets before running sync.`
    );
  }

  const client = createFeishuClient({
    appId: config.appId,
    appSecret: config.appSecret,
    baseUrl: config.baseUrl,
  });

  const syncedAt = new Date().toISOString();
  const results = [];
  const errors = [];

  for (const target of targets) {
    try {
      const doc = await client.getTargetRawContent(target);
      results.push({
        id: target.knowledgeId || `feishu_${target.scopeId || doc.documentId || target.documentId || target.wikiNodeToken}`,
        title: target.title || doc.title || `Feishu ${doc.documentId || target.documentId || target.wikiNodeToken}`,
        summary: buildSummary(doc.content),
        content: normalizeText(doc.content, 4000),
        tags: target.tags,
        scopeId: target.scopeId || doc.scopeId || doc.documentId || target.documentId || target.wikiNodeToken,
        sourceUrl: doc.sourceUrl || target.sourceUrl,
        updatedAt: doc.fetchedAt || syncedAt,
        accessScope: "configured_pages",
        documentId: doc.documentId || target.documentId,
        domain: target.domain || "product",
        applicability: target.applicability,
        severity: target.severity || "normal",
        status: target.status || "active",
        version: target.version || 1,
        vectorId: target.vectorId || "",
        owner: target.owner || "",
        expiresAt: target.expiresAt || "",
        docType: target.docType || "docx",
        wikiNodeToken: target.wikiNodeToken || "",
      });
    } catch (error) {
      errors.push({
        documentId: target.documentId || target.wikiNodeToken,
        title: target.title,
        code: error?.code || "FEISHU_SYNC_ERROR",
        message: error?.message || "Unknown sync error",
      });
    }
  }

  if (!results.length) {
    throw new Error(`Feishu sync failed for all targets: ${JSON.stringify(errors, null, 2)}`);
  }

  await ensureJsonFile(syncFilePath, []);
  await writeFile(syncFilePath, `${JSON.stringify(results, null, 2)}\n`, "utf8");

  console.log(`[feishu-sync] synced ${results.length} document(s) to ${syncFilePath}`);
  if (errors.length > 0) {
    console.warn(`[feishu-sync] ${errors.length} document(s) failed:`);
    console.warn(JSON.stringify(errors, null, 2));
  }
}

main().catch((error) => {
  console.error("[feishu-sync] failed:", error?.message || error);
  process.exitCode = 1;
});
