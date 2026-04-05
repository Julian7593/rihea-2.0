import { randomUUID } from "node:crypto";
import { SESSION_MAX_ROUNDS } from "../constants.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_PRIMARY_DISTRESS = {
  label: "unclear_distress",
  confidence: 0,
  needsClarification: true,
  updatedAt: null,
};
const SHORT_TERM_MAX_RECENT_TURNS = 12;

function sanitizeText(value, maxLength = 120) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function normalizeIntentList(value) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item) => typeof item === "string" && item.trim())
    .slice(0, 4);
}

function normalizeRuleIds(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => sanitizeText(item, 64))
    .filter(Boolean)
    .slice(0, 8);
}

function mapIntentToDistressLabel(intentPrimary) {
  if (intentPrimary === "high_risk_expressions") return "high_risk_expression";
  if (intentPrimary === "sleep_advice") return "sleep_disturbance";
  if (intentPrimary === "dietary_advice") return "diet_concern";
  if (intentPrimary === "exercise_advice") return "exercise_concern";
  if (intentPrimary === "app_feature_explanation") return "feature_help_request";
  if (intentPrimary === "content_recommendation") return "content_support_need";
  if (intentPrimary === "daily_companionship") return "companionship_need";
  if (intentPrimary === "emotional_support") return "emotional_distress";
  return "unclear_distress";
}

function normalizePrimaryDistressCandidate(candidate = {}, intentPrimary = "unrecognized_ambiguous", fallbackConfidence = 0) {
  const rawConfidence = Number(candidate?.confidence);
  const safeConfidence = Number.isFinite(rawConfidence)
    ? Math.max(0, Math.min(1, rawConfidence))
    : Math.max(0, Math.min(1, Number(fallbackConfidence) || 0));
  const label =
    typeof candidate?.label === "string" && candidate.label.trim()
      ? sanitizeText(candidate.label, 80)
      : mapIntentToDistressLabel(intentPrimary);
  return {
    label,
    confidence: Number(safeConfidence.toFixed(2)),
  };
}

function buildTurnSummary({ turnId, timestamp, userMessage, assistantMessage, metadata = {} }) {
  const classification = metadata?.classification || {};
  const intentPrimary =
    typeof classification?.primary_intent === "string" && classification.primary_intent
      ? classification.primary_intent
      : "unrecognized_ambiguous";
  const intentSecondary = normalizeIntentList(classification?.secondary_intents);
  const riskLevel = typeof metadata?.riskLevel === "string" ? metadata.riskLevel : "R0";
  const toolTrace = Array.isArray(metadata?.toolTrace) ? metadata.toolTrace : [];
  const toolsUsed = toolTrace
    .map((item) => item?.toolName)
    .filter((name) => typeof name === "string" && name);

  return {
    turnId,
    timestamp,
    intentPrimary,
    intentSecondary,
    riskLevel,
    userSummary: sanitizeText(metadata?.userSummary || userMessage, 140),
    assistantSummary: sanitizeText(metadata?.assistantSummary || assistantMessage, 140),
    toolsUsed,
    safetyTriggered: Boolean(metadata?.safetyTriggered || metadata?.escalated),
    primaryDistressCandidate: normalizePrimaryDistressCandidate(
      metadata?.primaryDistressCandidate || {},
      intentPrimary,
      Number(classification?.confidence) || 0
    ),
  };
}

function computeCurrentPrimaryDistress(recentTurns = [], timestamp = null) {
  const candidates = recentTurns
    .slice(-3)
    .reverse()
    .map((turn, index) => {
      const candidate = turn?.primaryDistressCandidate || {};
      const confidence = Number(candidate?.confidence);
      if (!Number.isFinite(confidence)) return null;
      const recencyWeight = Math.max(0.5, 1 - index * 0.18);
      return {
        label: sanitizeText(candidate?.label, 80) || "unclear_distress",
        score: confidence * recencyWeight,
      };
    })
    .filter(Boolean);

  if (!candidates.length) {
    return {
      ...DEFAULT_PRIMARY_DISTRESS,
      updatedAt: timestamp,
    };
  }

  const best = candidates.sort((a, b) => b.score - a.score)[0];
  const confidence = Number(Math.max(0, Math.min(1, best.score)).toFixed(2));
  return {
    label: best.label,
    confidence,
    needsClarification: confidence < 0.6,
    updatedAt: timestamp,
  };
}

function normalizeLatestRecommendation(input = {}, timestamp, fallback = null) {
  const topic = sanitizeText(input?.topic, 80);
  const contentId = sanitizeText(input?.contentId || input?.content_id, 80);
  const reason = sanitizeText(input?.reason, 120);
  const hasMeaningfulField = Boolean(topic || contentId || reason);
  if (!hasMeaningfulField) return fallback;
  return {
    topic: topic || (fallback?.topic || "general_support"),
    contentId: contentId || null,
    reason: reason || (fallback?.reason || "agent_recommendation"),
    recommendedAt: timestamp,
    feedbackStatus:
      input?.feedbackStatus === "accepted" || input?.feedbackStatus === "rejected" ? input.feedbackStatus : "pending",
  };
}

function deriveFallbackRecommendation({ classification = {}, topic = "", nextActions = [], timestamp, previous }) {
  const primaryIntent = classification?.primary_intent || "";
  const hasAction = Array.isArray(nextActions) && nextActions.length > 0;
  const topicalIntent = ["sleep_advice", "dietary_advice", "exercise_advice", "content_recommendation"].includes(primaryIntent);
  if (!hasAction || !topicalIntent) return previous || null;
  return {
    topic: sanitizeText(topic || primaryIntent, 80),
    contentId: null,
    reason: `intent:${primaryIntent}`,
    recommendedAt: timestamp,
    feedbackStatus: "pending",
  };
}

function normalizeEmotionalState(input = {}, fallback = {}) {
  const valenceRaw = sanitizeText(input?.valence, 24).toLowerCase();
  const arousalRaw = sanitizeText(input?.arousal, 24).toLowerCase();
  const valence = ["negative", "neutral", "positive"].includes(valenceRaw) ? valenceRaw : fallback.valence || "neutral";
  const arousal = ["low", "medium", "high"].includes(arousalRaw) ? arousalRaw : fallback.arousal || "medium";
  const riskLevel = typeof input?.riskLevel === "string" ? input.riskLevel : fallback.riskLevel || "R0";
  const inferredFrom = normalizeIntentList(input?.inferredFrom || fallback.inferredFrom || []);
  return {
    valence,
    arousal,
    riskLevel,
    inferredFrom: inferredFrom.length ? inferredFrom : ["intent_classifier"],
  };
}

function deriveLatestEmotionalState({ emotionalState, classification = {}, riskLevel = "R0", checkInsCount = 0, safetyTriggered = false, previous }) {
  const primaryIntent = classification?.primary_intent || "";
  const inferredFrom = ["intent_classifier"];
  if (riskLevel !== "R0") inferredFrom.push("risk_precheck");
  if (checkInsCount > 0) inferredFrom.push("checkin_summary");
  if (safetyTriggered) inferredFrom.push("safety_rule");

  if (emotionalState && typeof emotionalState === "object") {
    return normalizeEmotionalState(
      {
        ...emotionalState,
        riskLevel,
        inferredFrom: [...normalizeIntentList(emotionalState.inferredFrom || []), ...inferredFrom],
      },
      previous
    );
  }

  const valence =
    riskLevel === "R2" || riskLevel === "R3"
      ? "negative"
      : ["emotional_support", "daily_companionship", "sleep_advice", "high_risk_expressions"].includes(primaryIntent)
        ? "negative"
        : "neutral";
  const arousal =
    riskLevel === "R2" || riskLevel === "R3"
      ? "high"
      : primaryIntent === "app_feature_explanation"
        ? "low"
        : "medium";
  return normalizeEmotionalState(
    {
      valence,
      arousal,
      riskLevel,
      inferredFrom,
    },
    previous
  );
}

export function createInitialSessionMemoryState() {
  return {
    sessions: {},
  };
}

function parseTtlDays(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return 14;
  return parsed;
}

export function createSessionMemoryStore({ store, maxRounds = SESSION_MAX_ROUNDS, ttlDays = 14, now = () => new Date() }) {
  const maxRoundCount = Number.isFinite(Number(maxRounds)) ? Math.max(1, Number(maxRounds)) : SESSION_MAX_ROUNDS;
  const safeTtlDays = parseTtlDays(ttlDays);

  const pruneExpired = (state) => {
    const sessions = state?.sessions && typeof state.sessions === "object" ? state.sessions : {};
    const thresholdMs = now().getTime() - safeTtlDays * DAY_MS;
    const nextSessions = {};
    for (const [sessionId, session] of Object.entries(sessions)) {
      const updatedAtMs = Date.parse(session?.updatedAt || "");
      if (Number.isFinite(updatedAtMs) && updatedAtMs < thresholdMs) continue;
      nextSessions[sessionId] = session;
    }
    return {
      sessions: nextSessions,
    };
  };

  const ensureSession = (state, { sessionId, userId, lang }) => {
    const sessions = state.sessions || {};
    if (!sessions[sessionId]) {
      sessions[sessionId] = {
        sessionId,
        userId,
        lang,
        rounds: [],
        shortTermMemory: {
          recentTurns: [],
          currentPrimaryDistress: { ...DEFAULT_PRIMARY_DISTRESS },
          latestRecommendation: null,
          latestEmotionalState: null,
          recentSafetyEvent: {
            triggered: false,
            level: "R0",
            ruleIds: [],
            timestamp: null,
          },
          safetyLockActive: false,
        },
        createdAt: now().toISOString(),
        updatedAt: now().toISOString(),
      };
    }
    return sessions[sessionId];
  };

  return {
    async appendRound({ sessionId, userId, lang, userMessage, assistantMessage, metadata = {} }) {
      const raw = await store.read();
      const state = pruneExpired(raw);
      const session = ensureSession(state, { sessionId, userId, lang });
      const timestamp = now().toISOString();

      if (session.userId !== userId) {
        const error = new Error("sessionId does not belong to this user.");
        error.code = "AGENT_SESSION_USER_MISMATCH";
        error.statusCode = 403;
        throw error;
      }

      session.lang = lang;
      session.rounds = Array.isArray(session.rounds) ? session.rounds : [];
      const roundId = `round_${randomUUID()}`;
      session.rounds.push({
        id: roundId,
        timestamp,
        user: { text: userMessage },
        assistant: {
          text: assistantMessage,
          riskLevel: metadata?.riskLevel || "R0",
        },
        metadata: {
          route: metadata?.route || "unknown",
          escalated: Boolean(metadata?.escalated),
          reason: metadata?.reason || "",
          classification: metadata?.classification || null,
        },
      });
      if (session.rounds.length > maxRoundCount) {
        session.rounds = session.rounds.slice(session.rounds.length - maxRoundCount);
      }

      const shortTerm = session.shortTermMemory && typeof session.shortTermMemory === "object" ? session.shortTermMemory : {};
      shortTerm.recentTurns = Array.isArray(shortTerm.recentTurns) ? shortTerm.recentTurns : [];
      const turnSummary = buildTurnSummary({
        turnId: roundId,
        timestamp,
        userMessage,
        assistantMessage,
        metadata,
      });
      shortTerm.recentTurns.push(turnSummary);
      if (shortTerm.recentTurns.length > Math.min(SHORT_TERM_MAX_RECENT_TURNS, maxRoundCount)) {
        shortTerm.recentTurns = shortTerm.recentTurns.slice(shortTerm.recentTurns.length - Math.min(SHORT_TERM_MAX_RECENT_TURNS, maxRoundCount));
      }

      shortTerm.currentPrimaryDistress = computeCurrentPrimaryDistress(shortTerm.recentTurns, timestamp);
      const fallbackRecommendation = deriveFallbackRecommendation({
        classification: metadata?.classification || {},
        topic: metadata?.topic || "",
        nextActions: metadata?.nextActions || [],
        timestamp,
        previous: shortTerm.latestRecommendation || null,
      });
      shortTerm.latestRecommendation = normalizeLatestRecommendation(metadata?.latestRecommendation || {}, timestamp, fallbackRecommendation);
      shortTerm.latestEmotionalState = deriveLatestEmotionalState({
        emotionalState: metadata?.latestEmotionalState || null,
        classification: metadata?.classification || {},
        riskLevel: metadata?.riskLevel || "R0",
        checkInsCount: Number(metadata?.checkInsCount || 0),
        safetyTriggered: Boolean(metadata?.safetyTriggered || metadata?.escalated),
        previous: shortTerm.latestEmotionalState || null,
      });

      const riskLevel = metadata?.riskLevel || "R0";
      const safetyTriggered =
        Boolean(metadata?.safetyTriggered || metadata?.escalated) || riskLevel === "R2" || riskLevel === "R3";
      shortTerm.recentSafetyEvent = {
        triggered: safetyTriggered,
        level: riskLevel,
        ruleIds: normalizeRuleIds(metadata?.safetyRuleIds || []),
        timestamp,
      };
      shortTerm.safetyLockActive =
        Boolean(shortTerm.safetyLockActive) || (safetyTriggered && (riskLevel === "R2" || riskLevel === "R3"));
      session.shortTermMemory = shortTerm;

      session.updatedAt = timestamp;

      await store.write(state);
      return {
        sessionId: session.sessionId,
        roundCount: session.rounds.length,
        trimmed: session.rounds.length >= maxRoundCount,
        shortTermMemory: {
          currentPrimaryDistress: session.shortTermMemory.currentPrimaryDistress,
          latestRecommendation: session.shortTermMemory.latestRecommendation,
          latestEmotionalState: session.shortTermMemory.latestEmotionalState,
          recentSafetyEvent: session.shortTermMemory.recentSafetyEvent,
          safetyLockActive: session.shortTermMemory.safetyLockActive,
        },
      };
    },

    async getHistory({ sessionId, userId }) {
      const raw = await store.read();
      const state = pruneExpired(raw);
      const session = state.sessions?.[sessionId];
      if (!session) {
        return {
          sessionId,
          userId,
          rounds: [],
          updatedAt: null,
        };
      }
      if (session.userId !== userId) {
        const error = new Error("sessionId does not belong to this user.");
        error.code = "AGENT_SESSION_USER_MISMATCH";
        error.statusCode = 403;
        throw error;
      }
      return {
        sessionId,
        userId,
        rounds: Array.isArray(session.rounds) ? session.rounds : [],
        shortTermMemory:
          session.shortTermMemory && typeof session.shortTermMemory === "object"
            ? session.shortTermMemory
            : {
                recentTurns: [],
                currentPrimaryDistress: { ...DEFAULT_PRIMARY_DISTRESS },
                latestRecommendation: null,
                latestEmotionalState: null,
                recentSafetyEvent: {
                  triggered: false,
                  level: "R0",
                  ruleIds: [],
                  timestamp: null,
                },
                safetyLockActive: false,
              },
        updatedAt: session.updatedAt || null,
      };
    },
  };
}
