function sanitizeText(value, maxLength = 120) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

export function normalizePromptSlots(memoryPromptContext, { allowlist = [], maxSlots = 12 } = {}) {
  const allow = new Set(Array.isArray(allowlist) ? allowlist : []);
  const source = Array.isArray(memoryPromptContext?.slots) ? memoryPromptContext.slots : [];
  const limited = source
    .filter((slot) => {
      const key = typeof slot?.key === "string" ? slot.key : "";
      if (!key) return false;
      return allow.size === 0 || allow.has(key);
    })
    .sort((a, b) => Number(a?.priority || 999) - Number(b?.priority || 999))
    .slice(0, Math.max(1, Number(maxSlots) || 12));

  return limited.map((slot) => ({
    key: slot.key,
    value: slot.value,
    priority: Number(slot?.priority || 999),
    lastUpdatedAt: slot?.last_updated_at || null,
  }));
}

export function readPromptSlot(slots, key, fallback = null) {
  const safeSlots = Array.isArray(slots) ? slots : [];
  const match = safeSlots.find((slot) => slot?.key === key);
  if (!match) return fallback;
  const value = match.value;
  if (typeof value === "string") return sanitizeText(value, 160);
  return value ?? fallback;
}

export function summarizePromptContext(slots = []) {
  return (Array.isArray(slots) ? slots : []).map((slot) => ({
    key: slot.key,
    priority: slot.priority,
    lastUpdatedAt: slot.lastUpdatedAt,
  }));
}
