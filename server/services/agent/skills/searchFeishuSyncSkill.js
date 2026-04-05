import {
  defineSkill,
  SKILL_CAPABILITY_TYPE,
  SKILL_PERMISSION_LEVEL,
  SKILL_SIDE_EFFECT_LEVEL,
} from "./platform/contracts.js";

export function createSearchFeishuSyncSkill({ feishuSyncIndex }) {
  return defineSkill({
    id: "search_feishu_sync",
    name: "search_feishu_sync",
    version: "1.0.0",
    category: "retrieval",
    capability_type: SKILL_CAPABILITY_TYPE.RETRIEVAL,
    permission_level: SKILL_PERMISSION_LEVEL.READ,
    side_effect_level: SKILL_SIDE_EFFECT_LEVEL.NONE,
    input_schema: {
      type: "object",
      required: ["query"],
      properties: {
        query: { type: "string" },
        scopeId: { type: "string" },
        tags: { type: "array" },
        topK: { type: "number" },
      },
    },
    output_schema: {
      type: "object",
    },
    summarizeInput: (input = {}) => ({
      query: String(input?.query || "").slice(0, 120),
      scopeId: String(input?.scopeId || ""),
      topK: Number.isFinite(Number(input?.topK)) ? Number(input.topK) : 4,
    }),
    summarizeOutput: (output = {}) => ({
      total: Number(output?.total || 0),
      hits: Array.isArray(output?.hits)
        ? output.hits.slice(0, 3).map((item) => ({
            id: item?.id,
            title: String(item?.title || "").slice(0, 80),
            score: item?.score,
          }))
        : [],
    }),
    policy: {
      timeout_ms: 3000,
      idempotent: true,
      cacheable: true,
      model_callable: true,
      read_only_hint: true,
    },
    async handler(input = {}) {
      if (!feishuSyncIndex || typeof feishuSyncIndex.search !== "function") {
        return {
          query: String(input?.query || ""),
          total: 0,
          hits: [],
          feishu_sync_unavailable: true,
        };
      }

      return feishuSyncIndex.search({
        query: input?.query || "",
        scopeId: input?.scopeId || "",
        tags: Array.isArray(input?.tags) ? input.tags : [],
        topK: input?.topK,
      });
    },
  });
}
