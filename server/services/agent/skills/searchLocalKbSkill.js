import {
  defineSkill,
  SKILL_CAPABILITY_TYPE,
  SKILL_PERMISSION_LEVEL,
  SKILL_SIDE_EFFECT_LEVEL,
} from "./platform/contracts.js";

export function createSearchLocalKbSkill({ kbIndex }) {
  return defineSkill({
    id: "search_local_kb",
    name: "search_local_kb",
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
        pregnancyWeek: { type: "string" },
        tags: { type: "array" },
        category: { type: "string" },
        topK: { type: "number" },
      },
    },
    output_schema: {
      type: "object",
    },
    summarizeInput: (input = {}) => ({
      query: String(input?.query || "").slice(0, 80),
      pregnancyWeek: String(input?.pregnancyWeek || ""),
      topK: Number.isFinite(Number(input?.topK)) ? Number(input.topK) : 3,
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
    async handler(input = {}, ctx = {}) {
      if (!kbIndex || typeof kbIndex.search !== "function") {
        return {
          query: String(input?.query || ""),
          total: 0,
          hits: [],
          kb_unavailable: true,
        };
      }

      return kbIndex.search({
        query: input?.query || "",
        pregnancyWeek: input?.pregnancyWeek || "",
        tags: Array.isArray(input?.tags) ? input.tags : [],
        category: input?.category || "",
        topK: input?.topK,
        lang: ctx?.lang || "zh",
      });
    },
  });
}
