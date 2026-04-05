import {
  SKILL_CAPABILITY_TYPE,
  SKILL_PERMISSION_LEVEL,
  SKILL_SIDE_EFFECT_LEVEL,
  sanitizeManifestForDiscovery,
  validateSkillManifestV2,
} from "./contracts.js";

function safeString(value, maxLength = 120) {
  return String(value || "").trim().slice(0, maxLength);
}

function coerceLegacyManifest(manifest = {}) {
  if (!manifest || typeof manifest !== "object") return null;
  if (manifest.id && manifest.capability_type && manifest.permission_level) return manifest;
  const name = safeString(manifest.name, 120);
  if (!name) return null;

  return {
    id: name,
    name,
    version: safeString(manifest.version, 40) || "1.0.0",
    category: safeString(manifest?.policy?.category, 80) || "general",
    capability_type: SKILL_CAPABILITY_TYPE.RETRIEVAL,
    permission_level:
      manifest?.policy?.mode === "read_only"
        ? SKILL_PERMISSION_LEVEL.READ
        : SKILL_PERMISSION_LEVEL.ANALYZE,
    side_effect_level: SKILL_SIDE_EFFECT_LEVEL.NONE,
    input_schema: manifest.input_schema || manifest.inputSchema || { type: "object", required: [], properties: {} },
    output_schema: manifest.output_schema || manifest.outputSchema || { type: "object" },
    policy: {
      timeout_ms: 8000,
      idempotent: true,
      cacheable: false,
      model_callable: true,
      read_only_hint: manifest?.policy?.mode === "read_only",
    },
    approval: {
      required: false,
      reason_template: "",
    },
    observability: {
      redact_input_paths: [],
      summarize_output: true,
    },
    handler: typeof manifest.handler === "function" ? manifest.handler : manifest.execute,
    summarizeInput: manifest.summarizeInput,
    summarizeOutput: manifest.summarizeOutput,
  };
}

function normalizePermissionSet(permissionLevel = "") {
  const order = [
    SKILL_PERMISSION_LEVEL.READ,
    SKILL_PERMISSION_LEVEL.ANALYZE,
    SKILL_PERMISSION_LEVEL.WRITE_DRAFT,
    SKILL_PERMISSION_LEVEL.WRITE_EXECUTE,
  ];
  const index = order.indexOf(permissionLevel);
  if (index === -1) return order;
  return order.slice(0, index + 1);
}

export function createSkillRegistry({ manifests = [] } = {}) {
  const manifestMap = new Map();
  const aliasMap = new Map();

  function registerSkill(rawManifest = {}) {
    const manifest = coerceLegacyManifest(rawManifest);
    if (!manifest) {
      throw new Error("Cannot register empty skill manifest.");
    }

    const validation = validateSkillManifestV2(manifest);
    if (!validation.valid) {
      throw new Error(`Invalid skill manifest "${manifest.name || manifest.id || "unknown"}": ${validation.errors.join("; ")}`);
    }

    manifestMap.set(manifest.id, manifest);
    aliasMap.set(manifest.id, manifest.id);
    aliasMap.set(manifest.name, manifest.id);
    return manifest;
  }

  manifests.forEach((manifest) => registerSkill(manifest));

  function get(idOrName) {
    const key = aliasMap.get(idOrName) || idOrName;
    return manifestMap.get(key) || null;
  }

  return {
    registerSkill,
    get,
    has(idOrName) {
      return Boolean(get(idOrName));
    },
    list() {
      return Array.from(manifestMap.values()).map((item) => item.name);
    },
    discoverSkills({
      capability_type = "",
      permission_level = "",
      category = "",
      model_callable = null,
    } = {}) {
      const allowedPermissions = permission_level ? normalizePermissionSet(permission_level) : [];
      return Array.from(manifestMap.values())
        .filter((manifest) => !capability_type || manifest.capability_type === capability_type)
        .filter((manifest) => !category || manifest.category === category)
        .filter((manifest) => !allowedPermissions.length || allowedPermissions.includes(manifest.permission_level))
        .filter((manifest) => model_callable === null || Boolean(manifest?.policy?.model_callable) === Boolean(model_callable))
        .map((manifest) => sanitizeManifestForDiscovery(manifest));
    },
    getWorkflow(idOrName) {
      const manifest = get(idOrName);
      return manifest?.capability_type === SKILL_CAPABILITY_TYPE.WORKFLOW ? manifest : null;
    },
    getAll() {
      return Array.from(manifestMap.values());
    },
  };
}
