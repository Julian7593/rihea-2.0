import { describe, expect, it } from "vitest";
import { createToolExecutor } from "../../server/services/agent/tools/toolExecutor.js";
import { createToolRegistry } from "../../server/services/agent/tools/toolRegistry.js";
import {
  defineSkill,
  defineWorkflowSkill,
  SKILL_CAPABILITY_TYPE,
  SKILL_PERMISSION_LEVEL,
  SKILL_SIDE_EFFECT_LEVEL,
} from "../../server/services/agent/skills/platform/contracts.js";
import { createSkillRegistry } from "../../server/services/agent/skills/platform/skillRegistry.js";

describe("skill platform", () => {
  it("rejects invalid manifest during registration", () => {
    const registry = createSkillRegistry();
    expect(() =>
      registry.registerSkill({
        id: "broken_skill",
        name: "broken_skill",
      })
    ).toThrow(/Invalid skill manifest/);
  });

  it("executes read skill and blocks write_execute skill without approval", async () => {
    const registry = createSkillRegistry({
      manifests: [
        defineSkill({
          id: "read_profile",
          name: "read_profile",
          version: "1.0.0",
          category: "context",
          capability_type: SKILL_CAPABILITY_TYPE.RETRIEVAL,
          permission_level: SKILL_PERMISSION_LEVEL.READ,
          side_effect_level: SKILL_SIDE_EFFECT_LEVEL.NONE,
          input_schema: { type: "object", required: [], properties: {} },
          output_schema: { type: "object", required: ["ok"], properties: { ok: { type: "boolean" } } },
          async handler() {
            return { ok: true };
          },
        }),
        defineSkill({
          id: "execute_reminder",
          name: "execute_reminder",
          version: "1.0.0",
          category: "action",
          capability_type: SKILL_CAPABILITY_TYPE.ACTION,
          permission_level: SKILL_PERMISSION_LEVEL.WRITE_EXECUTE,
          side_effect_level: SKILL_SIDE_EFFECT_LEVEL.EXTERNAL_MUTATION,
          input_schema: {
            type: "object",
            required: ["title"],
            properties: { title: { type: "string" } },
          },
          output_schema: { type: "object" },
          approval: {
            required: true,
            reason_template: "Executing real reminders requires approval.",
          },
          async handler() {
            return { created: true };
          },
        }),
      ],
    });

    const executor = createToolExecutor({ registry, maxCalls: 6 });
    const readResult = await executor.executeSkill("read_profile", {}, {});
    expect(readResult.status).toBe("success");
    expect(readResult.data.ok).toBe(true);

    const blockedResult = await executor.executeSkill("execute_reminder", { title: "晚间提醒" }, {});
    expect(blockedResult.status).toBe("blocked");
    expect(blockedResult.approval_ticket?.ticket_id).toBeTruthy();
  });

  it("executes linear workflow and aggregates draft effects", async () => {
    const registry = createSkillRegistry({
      manifests: [
        defineSkill({
          id: "analyze_signal",
          name: "analyze_signal",
          version: "1.0.0",
          category: "analysis",
          capability_type: SKILL_CAPABILITY_TYPE.ANALYSIS,
          permission_level: SKILL_PERMISSION_LEVEL.ANALYZE,
          side_effect_level: SKILL_SIDE_EFFECT_LEVEL.NONE,
          input_schema: {
            type: "object",
            required: ["query"],
            properties: { query: { type: "string" } },
          },
          output_schema: {
            type: "object",
            required: ["summary"],
            properties: { summary: { type: "string" } },
          },
          async handler(input) {
            return { summary: `analyzed:${input.query}` };
          },
        }),
        defineSkill({
          id: "create_plan_draft",
          name: "create_plan_draft",
          version: "1.0.0",
          category: "action",
          capability_type: SKILL_CAPABILITY_TYPE.ACTION,
          permission_level: SKILL_PERMISSION_LEVEL.WRITE_DRAFT,
          side_effect_level: SKILL_SIDE_EFFECT_LEVEL.DRAFT_ONLY,
          input_schema: {
            type: "object",
            required: ["summary"],
            properties: { summary: { type: "string" } },
          },
          output_schema: { type: "object" },
          async handler(input) {
            return {
              summary: input.summary,
              draft_effects: [
                {
                  type: "plan",
                  action: "create",
                  summary: `draft:${input.summary}`,
                },
              ],
            };
          },
        }),
        defineWorkflowSkill({
          id: "analysis_to_plan_workflow",
          name: "analysis_to_plan_workflow",
          version: "1.0.0",
          category: "workflow",
          permission_level: SKILL_PERMISSION_LEVEL.WRITE_DRAFT,
          side_effect_level: SKILL_SIDE_EFFECT_LEVEL.DRAFT_ONLY,
          input_schema: {
            type: "object",
            required: ["query"],
            properties: { query: { type: "string" } },
          },
          output_schema: { type: "object" },
          steps: [
            {
              id: "analysis",
              skill_id: "analyze_signal",
              step_inputs_from: {
                query: "$input.query",
              },
            },
            {
              id: "plan",
              skill_id: "create_plan_draft",
              step_inputs_from: {
                summary: "$steps.analysis.data.summary",
              },
            },
          ],
        }),
      ],
    });

    const executor = createToolExecutor({ registry, maxCalls: 6 });
    const result = await executor.executeWorkflow("analysis_to_plan_workflow", { query: "sleep" }, {});
    expect(result.status).toBe("success");
    expect(result.data.step_results.analysis.data.summary).toBe("analyzed:sleep");
    expect(Array.isArray(result.draft_effects)).toBe(true);
    expect(result.draft_effects.length).toBe(1);
  });

  it("discovers built-in skills by capability and permission", () => {
    const registry = createToolRegistry({
      knowledgeBaseService: {
        search() {
          return { total: 0, hits: [] };
        },
      },
      nutritionService: {
        async analyzeMealPhoto() {
          return {
            detectedFoods: [],
            pregnancyAdvice: [],
            needsUserConfirmation: true,
            disclaimer: "stub",
          };
        },
      },
    });

    const actionSkills = registry.discoverSkills({
      capability_type: SKILL_CAPABILITY_TYPE.ACTION,
      permission_level: SKILL_PERMISSION_LEVEL.WRITE_DRAFT,
    });
    const workflowSkills = registry.discoverSkills({
      capability_type: SKILL_CAPABILITY_TYPE.WORKFLOW,
    });

    expect(actionSkills.some((item) => item.id === "create_reminder_draft")).toBe(true);
    expect(actionSkills.some((item) => item.id === "generate_support_plan_draft")).toBe(true);
    expect(workflowSkills.some((item) => item.id === "grounded_consultation_workflow")).toBe(true);
  });
});
