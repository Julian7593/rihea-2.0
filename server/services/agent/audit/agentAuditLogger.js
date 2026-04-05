import { randomUUID } from "node:crypto";

const MAX_AUDIT_EVENTS = 3000;

export function createInitialAgentAuditState() {
  return {
    events: [],
  };
}

function parseRangeDays(range) {
  if (!range || range === "all") return null;
  const match = String(range).match(/^(\d+)\s*d$/i);
  if (!match) return 30;
  return Number(match[1]);
}

export function createAgentAuditLogger({ store, now = () => new Date() }) {
  return {
    async log(event = {}) {
      const state = await store.read();
      const events = Array.isArray(state?.events) ? state.events : [];
      const nextEvent = {
        id: `audit_${randomUUID()}`,
        timestamp: now().toISOString(),
        ...event,
      };
      events.push(nextEvent);
      const trimmed = events.length > MAX_AUDIT_EVENTS ? events.slice(events.length - MAX_AUDIT_EVENTS) : events;
      await store.write({
        ...state,
        events: trimmed,
      });
      return nextEvent;
    },

    async getEscalations({ userId, range = "30d" }) {
      const state = await store.read();
      const events = Array.isArray(state?.events) ? state.events : [];
      const rangeDays = parseRangeDays(range);
      const threshold =
        rangeDays === null
          ? null
          : new Date(now().getTime() - Number(rangeDays) * 24 * 60 * 60 * 1000).getTime();

      return events
        .filter((event) => event?.type === "ESCALATION" && event?.userId === userId)
        .filter((event) => {
          if (threshold === null) return true;
          const ts = Date.parse(event.timestamp || "");
          if (!Number.isFinite(ts)) return false;
          return ts >= threshold;
        })
        .sort((a, b) => Date.parse(b.timestamp || "") - Date.parse(a.timestamp || ""));
    },
  };
}
