import { serverConfig } from "../config.js";
import { createWebSearchService } from "../services/agent/web-search/webSearchService.js";

function maskValue(value = "", visible = 6) {
  const safe = String(value || "");
  if (!safe) return "(empty)";
  if (safe.length <= visible) return `${safe[0]}***`;
  return `${safe.slice(0, visible)}...`;
}

async function main() {
  const query = process.argv.slice(2).join(" ").trim() || "最新孕期睡眠指南有什么更新";
  const service = createWebSearchService({
    config: serverConfig.webSearch,
  });

  const config = service.getConfig();
  console.log("[check] Web Search 配置");
  console.log(`enabled=${config.enabled}`);
  console.log(`provider=${config.provider}`);
  console.log(`timeoutMs=${config.timeoutMs}`);
  console.log(`topK=${config.topKDefault}`);
  console.log(`allowlist=${config.allowlist.join(",") || "(empty)"}`);
  console.log(`apiKey=${maskValue(serverConfig.webSearch.apiKey)}`);
  console.log(`query=${query}`);

  const result = await service.search({
    query,
    lang: "zh",
    topK: config.topKDefault,
  });

  console.log("\n[check] 搜索结果");
  console.log(`used=${Boolean(result.used)}`);
  console.log(`provider=${result.provider || "unknown"}`);
  console.log(`latency_ms=${Number(result.latency_ms || 0)}`);
  console.log(`error_code=${result.error_code || "null"}`);
  console.log(`source_count=${Array.isArray(result.sources) ? result.sources.length : 0}`);

  if (Array.isArray(result.sources) && result.sources.length > 0) {
    console.log("\n[check] 来源预览");
    result.sources.slice(0, 5).forEach((item, index) => {
      console.log(`${index + 1}. [${item.domain || "unknown"}] ${item.title || item.url}`);
      console.log(`   ${item.url}`);
    });
  }
}

main().catch((error) => {
  console.error("\n[check] Web Search 检查失败");
  console.error(`message=${error?.message || String(error)}`);
  process.exitCode = 1;
});
