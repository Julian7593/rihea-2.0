export const SKILL_CAPABILITY_TYPE = {
  RETRIEVAL: "retrieval",
  ANALYSIS: "analysis",
  ACTION: "action",
  WORKFLOW: "workflow",
};

export const SKILL_PERMISSION_LEVEL = {
  READ: "read",
  ANALYZE: "analyze",
  WRITE_DRAFT: "write_draft",
  WRITE_EXECUTE: "write_execute",
};

export const SKILL_SIDE_EFFECT_LEVEL = {
  NONE: "none",
  DRAFT_ONLY: "draft_only",
  EXTERNAL_MUTATION: "external_mutation",
};

export const WORKFLOW_FAILURE_POLICY = {
  ABORT: "abort",
  CONTINUE: "continue",
};

export const WORKFLOW_APPROVAL_BOUNDARY = {
  WORKFLOW: "workflow",
  STEP: "step",
};

const PERMISSION_WEIGHT = {
  [SKILL_PERMISSION_LEVEL.READ]: 1,
  [SKILL_PERMISSION_LEVEL.ANALYZE]: 2,
  [SKILL_PERMISSION_LEVEL.WRITE_DRAFT]: 3,
  [SKILL_PERMISSION_LEVEL.WRITE_EXECUTE]: 4,
};

const CAPABILITY_VALUES = Object.values(SKILL_CAPABILITY_TYPE);
const PERMISSION_VALUES = Object.values(SKILL_PERMISSION_LEVEL);
const SIDE_EFFECT_VALUES = Object.values(SKILL_SIDE_EFFECT_LEVEL);

function safeString(value, maxLength = 120) {
  return String(value || "").trim().slice(0, maxLength);
}

function ensureObject(value, fallback = {}) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : fallback;
}

function normalizePolicy(policy = {}) {
  const safe = ensureObject(policy);
  return {
    timeout_ms: Number.isFinite(Number(safe.timeout_ms ?? safe.timeoutMs))
      ? Math.max(100, Number(safe.timeout_ms ?? safe.timeoutMs))
      : 8000,
    idempotent: safe.idempotent !== false,
    cacheable: safe.cacheable === true,
    model_callable: safe.model_callable !== false,
    read_only_hint: safe.read_only_hint === true,
  };
}

function normalizeApproval(approval = {}, permissionLevel = SKILL_PERMISSION_LEVEL.READ) {
  const safe = ensureObject(approval);
  const required =
    typeof safe.required === "boolean"
      ? safe.required
      : permissionLevel === SKILL_PERMISSION_LEVEL.WRITE_EXECUTE;
  return {
    required,
    reason_template:
      safeString(safe.reason_template ?? safe.reasonTemplate, 220) ||
      (required ? "This skill requires elevated approval before execution." : ""),
  };
}

function normalizeObservability(observability = {}) {
  const safe = ensureObject(observability);
  const redact_input_paths = Array.isArray(safe.redact_input_paths ?? safe.redactInputPaths)
    ? (safe.redact_input_paths ?? safe.redactInputPaths).map((item) => safeString(item, 80)).filter(Boolean).slice(0, 20)
    : [];
  return {
    redact_input_paths,
    summarize_output: safe.summarize_output !== false,
  };
}

export function getPermissionWeight(level) {
  return PERMISSION_WEIGHT[level] || 0;
}

export function getHigherPermissionLevel(left, right) {
  return getPermissionWeight(left) >= getPermissionWeight(right) ? left : right;
}

export function isWorkflowManifest(manifest = {}) {
  return manifest?.capability_type === SKILL_CAPABILITY_TYPE.WORKFLOW;
}

export function sanitizeManifestForDiscovery(manifest = {}) {
  const {
    handler,
    execute,
    inputSchema,
    outputSchema,
    input_schema,
    output_schema,
    ...rest
  } = manifest;

  return {
    ...rest,
    input_schema: input_schema || inputSchema || { type: "object" },
    output_schema: output_schema || outputSchema || { type: "object" },
  };
}

export function validateSkillManifestV2(manifest = {}) {
  const errors = [];
  const id = safeString(manifest.id, 120);
  const name = safeString(manifest.name, 120);
  const version = safeString(manifest.version, 40);
  const category = safeString(manifest.category, 80);
  const capabilityType = safeString(manifest.capability_type, 32);
  const permissionLevel = safeString(manifest.permission_level, 32);
  const sideEffectLevel = safeString(manifest.side_effect_level, 32);

  if (!id) errors.push('Manifest field "id" is required.');
  if (!name) errors.push('Manifest field "name" is required.');
  if (!version) errors.push('Manifest field "version" is required.');
  if (!category) errors.push('Manifest field "category" is required.');
  if (!CAPABILITY_VALUES.includes(capabilityType)) {
    errors.push(`Manifest field "capability_type" must be one of: ${CAPABILITY_VALUES.join(", ")}.`);
  }
  if (!PERMISSION_VALUES.includes(permissionLevel)) {
    errors.push(`Manifest field "permission_level" must be one of: ${PERMISSION_VALUES.join(", ")}.`);
  }
  if (!SIDE_EFFECT_VALUES.includes(sideEffectLevel)) {
    errors.push(`Manifest field "side_effect_level" must be one of: ${SIDE_EFFECT_VALUES.join(", ")}.`);
  }

  const inputSchema = manifest.input_schema || manifest.inputSchema;
  const outputSchema = manifest.output_schema || manifest.outputSchema;
  if (!inputSchema || typeof inputSchema !== "object") {
    errors.push('Manifest field "input_schema" is required.');
  }
  if (!outputSchema || typeof outputSchema !== "object") {
    errors.push('Manifest field "output_schema" is required.');
  }

  if (capabilityType === SKILL_CAPABILITY_TYPE.WORKFLOW) {
    const steps = Array.isArray(manifest.steps) ? manifest.steps : [];
    if (!steps.length) {
      errors.push('Workflow manifest must declare non-empty "steps".');
    }
    for (const [index, step] of steps.entries()) {
      if (!safeString(step?.id, 80)) {
        errors.push(`Workflow step[${index}] missing "id".`);
      }
      if (!safeString(step?.skill_id ?? step?.skillId, 120)) {
        errors.push(`Workflow step[${index}] missing "skill_id".`);
      }
    }
  } else if (typeof manifest.handler !== "function" && typeof manifest.execute !== "function") {
    errors.push('Non-workflow manifest must provide "handler" or "execute".');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function defineSkill(definition = {}) {
  const id = safeString(definition.id || definition.name, 120);
  const name = safeString(definition.name || definition.id, 120) || id;
  const permissionLevel = safeString(definition.permission_level, 32) || SKILL_PERMISSION_LEVEL.READ;
  const manifest = {
    id,
    name,
    version: safeString(definition.version, 40) || "1.0.0",
    category: safeString(definition.category, 80) || "general",
    capability_type: safeString(definition.capability_type, 32) || SKILL_CAPABILITY_TYPE.RETRIEVAL,
    permission_level: permissionLevel,
    side_effect_level: safeString(definition.side_effect_level, 32) || SKILL_SIDE_EFFECT_LEVEL.NONE,
    input_schema: definition.input_schema || definition.inputSchema || { type: "object", required: [], properties: {} },
    output_schema: definition.output_schema || definition.outputSchema || { type: "object" },
    policy: normalizePolicy(definition.policy),
    approval: normalizeApproval(definition.approval, permissionLevel),
    observability: normalizeObservability(definition.observability),
    handler: typeof definition.handler === "function" ? definition.handler : definition.execute,
    summarizeInput: typeof definition.summarizeInput === "function" ? definition.summarizeInput : definition.summarize_input,
    summarizeOutput: typeof definition.summarizeOutput === "function" ? definition.summarizeOutput : definition.summarize_output,
  };

  return {
    ...manifest,
    inputSchema: manifest.input_schema,
    outputSchema: manifest.output_schema,
    execute: manifest.handler,
  };
}

export function defineWorkflowSkill(definition = {}) {
  const permissionLevel = safeString(definition.permission_level, 32) || SKILL_PERMISSION_LEVEL.ANALYZE;
  const manifest = {
    id: safeString(definition.id || definition.name, 120),
    name: safeString(definition.name || definition.id, 120),
    version: safeString(definition.version, 40) || "1.0.0",
    category: safeString(definition.category, 80) || "workflow",
    capability_type: SKILL_CAPABILITY_TYPE.WORKFLOW,
    permission_level: permissionLevel,
    side_effect_level: safeString(definition.side_effect_level, 32) || SKILL_SIDE_EFFECT_LEVEL.NONE,
    input_schema: definition.input_schema || definition.inputSchema || { type: "object", required: [], properties: {} },
    output_schema: definition.output_schema || definition.outputSchema || { type: "object" },
    policy: normalizePolicy(definition.policy),
    approval: normalizeApproval(definition.approval, permissionLevel),
    observability: normalizeObservability(definition.observability),
    steps: Array.isArray(definition.steps) ? definition.steps : [],
    failure_policy: safeString(definition.failure_policy, 32) || WORKFLOW_FAILURE_POLICY.ABORT,
    approval_boundary:
      safeString(definition.approval_boundary, 32) || WORKFLOW_APPROVAL_BOUNDARY.WORKFLOW,
    summarizeInput: typeof definition.summarizeInput === "function" ? definition.summarizeInput : definition.summarize_input,
    summarizeOutput: typeof definition.summarizeOutput === "function" ? definition.summarizeOutput : definition.summarize_output,
  };

  return {
    ...manifest,
    inputSchema: manifest.input_schema,
    outputSchema: manifest.output_schema,
  };
}

