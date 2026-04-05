import {
  defineSkill,
  SKILL_CAPABILITY_TYPE,
  SKILL_PERMISSION_LEVEL,
  SKILL_SIDE_EFFECT_LEVEL,
} from "./platform/contracts.js";

export function createSearchFeishuLiveSkill({ feishuLiveService }) {
  return defineSkill({
    id: "search_feishu_live",
    name: "search_feishu_live",
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
      used: Boolean(output?.used),
      total: Array.isArray(output?.hits) ? output.hits.length : 0,
      error: output?.error_code || null,
    }),
    policy: {
      timeout_ms: 5000,
      idempotent: true,
      cacheable: false,
      model_callable: true,
      read_only_hint: true,
    },
    async handler(input = {}, ctx = {}) {
      if (!feishuLiveService || typeof feishuLiveService.search !== "function") {
        return {
          used: false,
          hits: [],
          error_code: "FEISHU_LIVE_UNCONFIGURED",
        };
      }

      return feishuLiveService.search({
        query: input?.query || "",
        scopeId: input?.scopeId || "",
        topK: input?.topK,
        clientContext: ctx?.clientContext || {},
      });
    },
  });
}
