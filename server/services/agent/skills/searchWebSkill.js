import {
  defineSkill,
  SKILL_CAPABILITY_TYPE,
  SKILL_PERMISSION_LEVEL,
  SKILL_SIDE_EFFECT_LEVEL,
} from "./platform/contracts.js";

export function createSearchWebSkill({ webSearchService }) {
  return defineSkill({
    id: "search_web",
    name: "search_web",
    version: "1.0.0",
    category: "web_search",
    capability_type: SKILL_CAPABILITY_TYPE.RETRIEVAL,
    permission_level: SKILL_PERMISSION_LEVEL.READ,
    side_effect_level: SKILL_SIDE_EFFECT_LEVEL.NONE,
    input_schema: {
      type: "object",
      required: ["query"],
      properties: {
        query: { type: "string" },
        lang: { type: "string" },
        topK: { type: "number" },
        domains: { type: "array" },
      },
    },
    output_schema: {
      type: "object",
    },
    summarizeInput: (input = {}) => ({
      query: String(input?.query || "").slice(0, 120),
      lang: input?.lang === "en" ? "en" : "zh",
      topK: Number.isFinite(Number(input?.topK)) ? Number(input.topK) : 5,
      domains: Array.isArray(input?.domains) ? input.domains.slice(0, 6) : [],
    }),
    summarizeOutput: (output = {}) => ({
      used: Boolean(output?.search_meta?.used),
      provider: output?.search_meta?.provider || "",
      total: Array.isArray(output?.sources) ? output.sources.length : 0,
      error: output?.search_meta?.error_code || null,
    }),
    policy: {
      timeout_ms: 6000,
      idempotent: true,
      cacheable: false,
      model_callable: true,
      read_only_hint: true,
    },
    async handler(input = {}, ctx = {}) {
      if (!webSearchService || typeof webSearchService.search !== "function") {
        return {
          sources: [],
          search_meta: {
            used: false,
            query: String(input?.query || ""),
            latency_ms: 0,
            provider: "unconfigured",
            error_code: "WEB_SEARCH_UNCONFIGURED",
          },
        };
      }

      const result = await webSearchService.search({
        query: input?.query || "",
        lang: input?.lang || ctx?.lang || "zh",
        topK: input?.topK,
        domains: Array.isArray(input?.domains) ? input.domains : [],
        userId: ctx?.userId || "",
        requestId: ctx?.requestId || "",
      });

      return {
        sources: Array.isArray(result?.sources) ? result.sources : [],
        search_meta: {
          used: Boolean(result?.used),
          query: String(result?.query || input?.query || ""),
          latency_ms: Number(result?.latency_ms || 0),
          provider: result?.provider || "unknown",
          error_code: result?.error_code || null,
        },
      };
    },
  });
}
