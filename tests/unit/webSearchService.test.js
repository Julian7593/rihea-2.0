import { describe, expect, it } from "vitest";
import { createWebSearchService } from "../../server/services/agent/web-search/webSearchService.js";

function jsonResponse(payload, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    async json() {
      return payload;
    },
  };
}

describe("webSearchService", () => {
  it("does not force zhipu requests onto the first allowlisted domain by default", async () => {
    const requestBodies = [];
    const service = createWebSearchService({
      config: {
        enabled: true,
        provider: "zhipu",
        apiKey: "test-key",
        allowlist: ["nhc.gov.cn", "who.int"],
      },
      fetchImpl: async (_url, options = {}) => {
        requestBodies.push(JSON.parse(String(options.body || "{}")));
        return jsonResponse({
          search_result: [
            {
              title: "World Health Organization guidance",
              link: "https://www.who.int/example",
              content: "summary",
            },
          ],
        });
      },
    });

    const result = await service.search({
      query: "最新孕期睡眠指南",
      lang: "zh",
      topK: 5,
    });

    expect(requestBodies[0]?.search_domain_filter).toBeUndefined();
    expect(result.used).toBe(true);
    expect(result.sources[0]?.domain).toBe("www.who.int");
  });

  it("falls back to allowlisted domain retries when broad zhipu search returns no allowed sources", async () => {
    const requestBodies = [];
    const service = createWebSearchService({
      config: {
        enabled: true,
        provider: "zhipu",
        apiKey: "test-key",
        allowlist: ["nhc.gov.cn", "who.int"],
      },
      fetchImpl: async (_url, options = {}) => {
        const body = JSON.parse(String(options.body || "{}"));
        requestBodies.push(body);

        if (!body.search_domain_filter) {
          return jsonResponse({
            search_result: [
              {
                title: "Generic portal result",
                link: "https://example.com/article",
                content: "summary",
              },
            ],
          });
        }

        if (body.search_domain_filter === "nhc.gov.cn") {
          return jsonResponse({ search_result: [] });
        }

        if (body.search_domain_filter === "who.int") {
          return jsonResponse({
            search_result: [
              {
                title: "WHO pregnancy sleep update",
                link: "https://www.who.int/sleep-update",
                content: "trusted summary",
              },
            ],
          });
        }

        return jsonResponse({ search_result: [] });
      },
    });

    const result = await service.search({
      query: "最新孕期睡眠指南有什么更新",
      lang: "zh",
      topK: 5,
    });

    expect(result.used).toBe(true);
    expect(result.error_code).toBeNull();
    expect(result.sources).toHaveLength(1);
    expect(result.sources[0]?.url).toBe("https://www.who.int/sleep-update");
    expect(requestBodies.map((item) => item.search_domain_filter || null)).toEqual([
      null,
      "nhc.gov.cn",
      "who.int",
    ]);
  });
});
