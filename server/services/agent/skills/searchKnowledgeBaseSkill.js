import {
  defineSkill,
  SKILL_CAPABILITY_TYPE,
  SKILL_PERMISSION_LEVEL,
  SKILL_SIDE_EFFECT_LEVEL,
} from "./platform/contracts.js";

export function createSearchKnowledgeBaseSkill({ knowledgeBaseService }) {
  return defineSkill({
    id: "search_knowledge_base",
    name: "search_knowledge_base",
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
        tenantId: { type: "string" },
        principalIds: { type: "array" },
        sourceTypes: { type: "array" },
        tags: { type: "array" },
        lang: { type: "string" },
        topK: { type: "number" },
        mode: { type: "string" },
      },
    },
    output_schema: {
      type: "object",
    },
    summarizeInput: (input = {}) => ({
      query: String(input?.query || "").slice(0, 120),
      tenantId: String(input?.tenantId || ""),
      topK: Number.isFinite(Number(input?.topK)) ? Number(input.topK) : 6,
      mode: String(input?.mode || "hybrid"),
    }),
    summarizeOutput: (output = {}) => ({
      total: Number(output?.total || 0),
      hits: Array.isArray(output?.hits)
        ? output.hits.slice(0, 3).map((item) => ({
            document_id: item?.document_id,
            title: String(item?.title || "").slice(0, 80),
            score: item?.score,
            source_type: item?.source_type,
          }))
        : [],
    }),
    policy: {
      timeout_ms: 5000,
      idempotent: true,
      cacheable: true,
      model_callable: true,
      read_only_hint: true,
    },
    async handler(input = {}) {
      if (!knowledgeBaseService || typeof knowledgeBaseService.search !== "function") {
        return {
          query: String(input?.query || ""),
          total: 0,
          hits: [],
          knowledge_base_unavailable: true,
        };
      }

      return knowledgeBaseService.search({
        query: input?.query || "",
        tenantId: input?.tenantId || "",
        principalIds: Array.isArray(input?.principalIds) ? input.principalIds : [],
        sourceTypes: Array.isArray(input?.sourceTypes) ? input.sourceTypes : [],
        tags: Array.isArray(input?.tags) ? input.tags : [],
        lang: input?.lang || "",
        topK: input?.topK,
        mode: input?.mode || "hybrid",
      });
    },
  });
}
