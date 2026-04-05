import { randomUUID } from "node:crypto";

function safeString(value, maxLength = 240) {
  return String(value || "").trim().slice(0, maxLength);
}

function normalizeEffects(effects = []) {
  if (!Array.isArray(effects)) return [];
  return effects
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      return {
        type: safeString(item.type, 80),
        action: safeString(item.action, 80),
        summary: safeString(item.summary, 160),
      };
    })
    .filter(Boolean)
    .slice(0, 12);
}

export function createApprovalService({ now = () => new Date(), ttlHours = 24 } = {}) {
  const safeTtlHours = Number.isFinite(Number(ttlHours)) ? Math.max(1, Number(ttlHours)) : 24;

  return {
    requestApproval({
      skill_id = "",
      workflow_id = "",
      requested_permission = "",
      reason = "",
      requested_effects = [],
    } = {}) {
      const createdAt = now();
      const expiresAt = new Date(createdAt.getTime() + safeTtlHours * 60 * 60 * 1000);
      return {
        ticket_id: `approval_${randomUUID()}`,
        skill_id: safeString(skill_id, 120),
        workflow_id: safeString(workflow_id, 120),
        requested_permission: safeString(requested_permission, 40),
        reason: safeString(reason, 220),
        requested_effects: normalizeEffects(requested_effects),
        created_at: createdAt.toISOString(),
        expires_at: expiresAt.toISOString(),
      };
    },
  };
}
