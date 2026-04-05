import { createApprovalService } from "../skills/platform/approvalService.js";
import {
  getHigherPermissionLevel,
  getPermissionWeight,
  SKILL_CAPABILITY_TYPE,
  SKILL_PERMISSION_LEVEL,
  WORKFLOW_APPROVAL_BOUNDARY,
  WORKFLOW_FAILURE_POLICY,
} from "../skills/platform/contracts.js";
import { validateBySchema } from "./schemaValidation.js";

function summarizeDraftEffects(effects = []) {
  if (!Array.isArray(effects) || !effects.length) return null;
  return effects.slice(0, 6).map((item) => ({
    type: String(item?.type || "").slice(0, 80),
    action: String(item?.action || "").slice(0, 80),
    summary: String(item?.summary || "").slice(0, 140),
  }));
}

function normalizeExecutionError(error) {
  if (!error) return { code: "EXECUTION_ERROR", message: "Skill execution failed." };
  if (typeof error === "string") return { code: "EXECUTION_ERROR", message: error };
  return {
    code: typeof error.code === "string" ? error.code : "EXECUTION_ERROR",
    message: typeof error.message === "string" && error.message ? error.message : "Skill execution failed.",
  };
}

function hasApproval(manifest, context = {}, workflowId = "") {
  if (manifest?.permission_level !== SKILL_PERMISSION_LEVEL.WRITE_EXECUTE && !manifest?.approval?.required) {
    return true;
  }

  const approvals = context?.approval && typeof context.approval === "object" ? context.approval : {};
  if (Array.isArray(approvals.approvedSkillIds) && approvals.approvedSkillIds.includes(manifest.id)) return true;
  if (Array.isArray(approvals.approvedWorkflowIds) && workflowId && approvals.approvedWorkflowIds.includes(workflowId)) return true;
  if (Array.isArray(approvals.approvedPermissions) && approvals.approvedPermissions.includes(manifest.permission_level)) return true;
  if (Array.isArray(approvals.approvalTickets)) {
    return approvals.approvalTickets.some(
      (item) =>
        item?.skill_id === manifest.id ||
        (workflowId && item?.workflow_id === workflowId) ||
        item?.requested_permission === manifest.permission_level
    );
  }
  return false;
}

function resolveReference(reference, { input, context, steps }) {
  if (typeof reference !== "string") return reference;
  if (!reference.startsWith("$")) return reference;

  const segments = reference.slice(1).split(".").filter(Boolean);
  if (!segments.length) return null;

  const [root, ...rest] = segments;
  let cursor = null;
  if (root === "input") cursor = input;
  if (root === "context") cursor = context;
  if (root === "steps") cursor = steps;

  for (const segment of rest) {
    if (cursor === null || cursor === undefined) return null;
    cursor = cursor[segment];
  }
  return cursor ?? null;
}

function buildStepInput(mapping = {}, environment) {
  if (!mapping || typeof mapping !== "object") return {};
  const output = {};
  for (const [key, value] of Object.entries(mapping)) {
    if (Array.isArray(value)) {
      output[key] = value.map((item) => resolveReference(item, environment));
      continue;
    }
    if (value && typeof value === "object") {
      output[key] = buildStepInput(value, environment);
      continue;
    }
    output[key] = resolveReference(value, environment);
  }
  return output;
}

export function createToolExecutor({ registry, maxCalls = 3, approvalService = createApprovalService() }) {
  let callCount = 0;
  const trace = [];

  async function executeSkill(name, input = {}, context = {}, options = {}) {
    const start = Date.now();
    const manifest = registry.get(name);
    const entry = {
      toolName: name,
      toolType: "skill",
      skillId: manifest?.id || name,
      skillName: manifest?.name || name,
      skillVersion: manifest?.version || null,
      workflowId: options.workflowId || null,
      capabilityType: manifest?.capability_type || null,
      permissionLevel: manifest?.permission_level || null,
      policy: manifest?.policy || null,
      inputSummary: manifest?.summarizeInput?.(input || {}) || null,
      outputSummary: null,
      durationMs: 0,
      error: null,
      status: "execution_error",
      approvalRequired: Boolean(manifest?.approval?.required),
      approvalTicketId: null,
      draftEffectsSummary: null,
    };

    if (callCount >= maxCalls) {
      entry.error = `Tool call limit exceeded (${maxCalls}).`;
      entry.durationMs = Date.now() - start;
      entry.status = "execution_error";
      trace.push(entry);
      return {
        status: "execution_error",
        data: null,
        error: { code: "TOOL_LIMIT_EXCEEDED", message: entry.error },
        audit: entry,
        approval_ticket: null,
        draft_effects: null,
      };
    }

    if (!manifest) {
      entry.error = `Unknown tool "${name}".`;
      entry.durationMs = Date.now() - start;
      entry.status = "validation_error";
      trace.push(entry);
      return {
        status: "validation_error",
        data: null,
        error: { code: "UNKNOWN_SKILL", message: entry.error },
        audit: entry,
        approval_ticket: null,
        draft_effects: null,
      };
    }

    const validation = validateBySchema(input || {}, manifest.input_schema || manifest.inputSchema);
    if (!validation.valid) {
      entry.error = `Invalid tool input: ${validation.errors.join("; ")}`;
      entry.durationMs = Date.now() - start;
      entry.status = "validation_error";
      trace.push(entry);
      return {
        status: "validation_error",
        data: null,
        error: { code: "INVALID_SKILL_INPUT", message: entry.error },
        audit: entry,
        approval_ticket: null,
        draft_effects: null,
      };
    }

    if (!hasApproval(manifest, context, options.workflowId || "")) {
      const approvalTicket = approvalService.requestApproval({
        skill_id: manifest.id,
        workflow_id: options.workflowId || "",
        requested_permission: manifest.permission_level,
        reason: manifest?.approval?.reason_template || "Skill execution requires explicit approval.",
        requested_effects: options.requestedEffects || [],
      });
      entry.durationMs = Date.now() - start;
      entry.status = "blocked";
      entry.approvalTicketId = approvalTicket.ticket_id;
      trace.push(entry);
      return {
        status: "blocked",
        data: null,
        error: {
          code: "APPROVAL_REQUIRED",
          message: manifest?.approval?.reason_template || "Skill execution requires explicit approval.",
        },
        audit: entry,
        approval_ticket: approvalTicket,
        draft_effects: null,
      };
    }

    callCount += 1;

    try {
      const raw = await manifest.execute(input || {}, context);
      const outputValidation = validateBySchema(raw, manifest.output_schema || manifest.outputSchema);
      if (!outputValidation.valid) {
        entry.error = `Invalid tool output: ${outputValidation.errors.join("; ")}`;
        entry.durationMs = Date.now() - start;
        entry.status = "validation_error";
        trace.push(entry);
        return {
          status: "validation_error",
          data: null,
          error: { code: "INVALID_SKILL_OUTPUT", message: entry.error },
          audit: entry,
          approval_ticket: null,
          draft_effects: null,
        };
      }

      const draftEffects = Array.isArray(raw?.draft_effects) ? raw.draft_effects : null;
      entry.outputSummary = manifest?.summarizeOutput?.(raw) || null;
      entry.durationMs = Date.now() - start;
      entry.status = "success";
      entry.draftEffectsSummary = summarizeDraftEffects(draftEffects);
      trace.push(entry);

      return {
        status: "success",
        data: raw,
        error: null,
        audit: entry,
        approval_ticket: null,
        draft_effects: draftEffects,
      };
    } catch (error) {
      const normalizedError = normalizeExecutionError(error);
      entry.error = normalizedError.message;
      entry.durationMs = Date.now() - start;
      entry.status = "execution_error";
      trace.push(entry);
      return {
        status: "execution_error",
        data: null,
        error: normalizedError,
        audit: entry,
        approval_ticket: null,
        draft_effects: null,
      };
    }
  }

  async function executeWorkflow(name, input = {}, context = {}) {
    const manifest = registry.getWorkflow(name);
    if (!manifest) {
      return {
        status: "validation_error",
        data: null,
        error: { code: "UNKNOWN_WORKFLOW", message: `Unknown workflow "${name}".` },
        audit: null,
        approval_ticket: null,
        draft_effects: null,
      };
    }

    const stepResults = {};
    const draftEffects = [];
    let highestPermission = manifest.permission_level;
    let approvalTicket = null;

    for (const step of manifest.steps) {
      const stepManifest = registry.get(step.skill_id);
      if (!stepManifest) {
        return {
          status: "validation_error",
          data: null,
          error: { code: "UNKNOWN_WORKFLOW_STEP", message: `Workflow step references unknown skill "${step.skill_id}".` },
          audit: null,
          approval_ticket: null,
          draft_effects: null,
        };
      }
      highestPermission = getHigherPermissionLevel(highestPermission, stepManifest.permission_level);
    }

    const workflowNeedsApproval =
      manifest.approval_boundary === WORKFLOW_APPROVAL_BOUNDARY.WORKFLOW &&
      getPermissionWeight(highestPermission) >= getPermissionWeight(SKILL_PERMISSION_LEVEL.WRITE_EXECUTE) &&
      !hasApproval({ ...manifest, permission_level: highestPermission }, context, manifest.id);

    if (workflowNeedsApproval) {
      approvalTicket = approvalService.requestApproval({
        workflow_id: manifest.id,
        requested_permission: highestPermission,
        reason: manifest?.approval?.reason_template || "Workflow execution requires explicit approval.",
        requested_effects: [],
      });
      trace.push({
        toolName: manifest.name,
        toolType: "workflow",
        skillId: manifest.id,
        skillName: manifest.name,
        skillVersion: manifest.version,
        workflowId: manifest.id,
        capabilityType: SKILL_CAPABILITY_TYPE.WORKFLOW,
        permissionLevel: highestPermission,
        policy: manifest.policy,
        inputSummary: manifest?.summarizeInput?.(input) || null,
        outputSummary: null,
        durationMs: 0,
        error: manifest?.approval?.reason_template || "Workflow execution requires explicit approval.",
        status: "blocked",
        approvalRequired: true,
        approvalTicketId: approvalTicket.ticket_id,
        draftEffectsSummary: null,
      });
      return {
        status: "blocked",
        data: null,
        error: {
          code: "APPROVAL_REQUIRED",
          message: manifest?.approval?.reason_template || "Workflow execution requires explicit approval.",
        },
        audit: null,
        approval_ticket: approvalTicket,
        draft_effects: null,
      };
    }

    for (const step of manifest.steps) {
      const stepInput = buildStepInput(step.step_inputs_from || {}, {
        input,
        context,
        steps: stepResults,
      });
      const result = await executeSkill(step.skill_id, stepInput, context, { workflowId: manifest.id });
      stepResults[step.id] = result;

      if (Array.isArray(result.draft_effects) && result.draft_effects.length) {
        draftEffects.push(...result.draft_effects);
      }

      if (result.status !== "success") {
        if (result.approval_ticket && !approvalTicket) approvalTicket = result.approval_ticket;
        if (manifest.failure_policy !== WORKFLOW_FAILURE_POLICY.CONTINUE) {
          return {
            status: result.status,
            data: {
              workflow_id: manifest.id,
              step_results: stepResults,
            },
            error: result.error,
            audit: null,
            approval_ticket: approvalTicket,
            draft_effects: draftEffects.length ? draftEffects : null,
          };
        }
      }
    }

    trace.push({
      toolName: manifest.name,
      toolType: "workflow",
      skillId: manifest.id,
      skillName: manifest.name,
      skillVersion: manifest.version,
      workflowId: manifest.id,
      capabilityType: SKILL_CAPABILITY_TYPE.WORKFLOW,
      permissionLevel: highestPermission,
      policy: manifest.policy,
      inputSummary: manifest?.summarizeInput?.(input) || null,
      outputSummary: manifest?.summarizeOutput?.({ step_results: stepResults }) || null,
      durationMs: 0,
      error: null,
      status: "success",
      approvalRequired: Boolean(approvalTicket),
      approvalTicketId: approvalTicket?.ticket_id || null,
      draftEffectsSummary: summarizeDraftEffects(draftEffects),
    });

    return {
      status: "success",
      data: {
        workflow_id: manifest.id,
        permission_level: highestPermission,
        step_results: stepResults,
      },
      error: null,
      audit: null,
      approval_ticket: approvalTicket,
      draft_effects: draftEffects.length ? draftEffects : null,
    };
  }

  async function run(name, input, context) {
    const result = await executeSkill(name, input, context);
    if (result.status === "success") {
      return { ok: true, error: null, data: result.data };
    }
    return {
      ok: false,
      error: result.error?.message || result.error?.code || "Skill execution failed.",
      data: result.data,
    };
  }

  return {
    run,
    executeSkill,
    executeWorkflow,
    requestApproval(args = {}) {
      return approvalService.requestApproval(args);
    },
    getTrace: () => [...trace],
    getCallCount: () => callCount,
  };
}
