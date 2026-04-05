import { createContextTools } from "./contextTools.js";
import { createRiskTools } from "./riskTools.js";
import { createLocalKbIndex } from "../kb/kbIndex.js";
import { getBuiltInSkillManifests } from "../skills/index.js";
import { createSkillRegistry } from "../skills/platform/skillRegistry.js";

export function createToolRegistry({
  cbtService,
  auditLogger,
  kbIndex = createLocalKbIndex(),
  knowledgeBaseService = null,
  nutritionService = null,
  feishuSyncIndex = null,
  feishuLiveService = null,
  webSearchService = null,
  skillManifests = [],
}) {
  const contextTools = Object.values(createContextTools());
  const riskTools = Object.values(createRiskTools({ cbtService, auditLogger }));
  const builtInSkills = getBuiltInSkillManifests({
    kbIndex,
    feishuSyncIndex,
    feishuLiveService,
    webSearchService,
    knowledgeBaseService,
    nutritionService,
  });
  const registry = createSkillRegistry({
    manifests: [...contextTools, ...riskTools, ...builtInSkills, ...(Array.isArray(skillManifests) ? skillManifests : [])],
  });

  return {
    get(name) {
      return registry.get(name);
    },
    has(name) {
      return registry.has(name);
    },
    list() {
      return registry.list();
    },
    discoverSkills(filters = {}) {
      return registry.discoverSkills(filters);
    },
    registerSkill(manifest) {
      return registry.registerSkill(manifest);
    },
    getWorkflow(name) {
      return registry.getWorkflow(name);
    },
    getAll() {
      return registry.getAll();
    },
  };
}
