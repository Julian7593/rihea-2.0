export function createInitialUserStateMemoryState() {
  return {
    users: {},
  };
}

const DAY_MS = 24 * 60 * 60 * 1000;
const SOURCE_PRIORITY = ["assessment_results", "behavioral_data", "conversational_extraction"];
const WRITE_SOURCE_WHITELIST = new Set(["agent_chat", ...SOURCE_PRIORITY]);

function sanitizeText(value, maxLength = 120) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function normalizeEnum(value, allowed, fallback) {
  return allowed.includes(value) ? value : fallback;
}

function normalizeStringArray(value, maxItems = 8, maxItemLength = 64) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  const items = [];
  for (const raw of value) {
    const item = sanitizeText(raw, maxItemLength);
    if (!item || seen.has(item)) continue;
    seen.add(item);
    items.push(item);
    if (items.length >= maxItems) break;
  }
  return items;
}

function normalizeTrend(existing, currentRiskLevel) {
  const history = Array.isArray(existing) ? existing : [];
  const next = [...history, currentRiskLevel].slice(-7);
  return next;
}

function normalizeIsoDate(value) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const parsed = Date.parse(trimmed);
  if (!Number.isFinite(parsed)) return "";
  return new Date(parsed).toISOString().slice(0, 10);
}

function uniqueMerge(left = [], right = [], maxItems = 8) {
  return normalizeStringArray([...left, ...right], maxItems);
}

function deriveRiskBaseline(trend = []) {
  const history = Array.isArray(trend) ? trend : [];
  if (!history.length) return "R0";
  const count = history.reduce(
    (acc, item) => {
      if (item === "R3") acc.R3 += 1;
      else if (item === "R2") acc.R2 += 1;
      else if (item === "R1") acc.R1 += 1;
      else acc.R0 += 1;
      return acc;
    },
    { R0: 0, R1: 0, R2: 0, R3: 0 }
  );
  if (count.R3 > 0) return "R3";
  if (count.R2 > 0) return "R2";
  if (count.R1 > 0) return "R1";
  return "R0";
}

function summarizeCheckIns(checkIns = []) {
  const list = Array.isArray(checkIns) ? checkIns.slice(0, 30) : [];
  const sleepHours = list
    .map((item) => Number(item?.sleepHours))
    .filter((value) => Number.isFinite(value) && value > 0 && value <= 20);

  const nightWakingDays = sleepHours.filter((hours) => hours < 6).length;
  const avgHours =
    sleepHours.length > 0
      ? Number((sleepHours.reduce((sum, value) => sum + value, 0) / sleepHours.length).toFixed(1))
      : null;

  return {
    sleep_summary_7d: {
      avg_hours: avgHours,
      night_waking_days: nightWakingDays,
    },
  };
}

function createDefaultLongTermMemory() {
  return {
    emotional_patterns: {
      tags: [],
      peak_timeband: "",
      effective_actions: [],
    },
    faq_patterns: {
      top_intents_30d: [],
      intent_histogram_30d: {},
    },
    content_preferences: {
      topic_scores: {},
      format_pref: [],
      reject_tags: [],
    },
    feature_preferences: {
      most_used_features: [],
      preferred_entry_path: "",
      dropoff_points: [],
    },
    sensitive_reminders: {
      opt_in: true,
      quiet_hours: "",
      tone: "gentle",
      frequency_cap_per_day: 2,
    },
    lifestyle_trends: {
      sleep_trend_30d: {
        avg_hours: null,
        improving: null,
      },
      diet_trend_30d: {
        adherence: null,
        improving: null,
      },
      exercise_trend_30d: {
        consistency: null,
        improving: null,
      },
    },
  };
}

function createDefaultMemoryMeta(nowIso) {
  return {
    write_policy_version: "v1",
    source_priority: [...SOURCE_PRIORITY],
    pending_verification: {},
    signal_history: {
      primary_distress_events: [],
      intent_events: [],
      escalation_events: [],
    },
    last_compacted_at: nowIso,
  };
}

function compactEvents(events = [], nowIso, keepDays = 35, maxItems = 240) {
  const nowMs = Date.parse(nowIso || "");
  const threshold = Number.isFinite(nowMs) ? nowMs - keepDays * DAY_MS : null;
  const normalized = Array.isArray(events) ? events : [];
  const filtered = normalized.filter((item) => {
    if (!threshold) return true;
    const ts = Date.parse(item?.timestamp || "");
    if (!Number.isFinite(ts)) return false;
    return ts >= threshold;
  });
  return filtered.slice(-maxItems);
}

function countRecentEvents(events = [], nowIso, days = 30) {
  const nowMs = Date.parse(nowIso || "");
  if (!Number.isFinite(nowMs)) return 0;
  const threshold = nowMs - days * DAY_MS;
  return (Array.isArray(events) ? events : []).filter((item) => {
    const ts = Date.parse(item?.timestamp || "");
    return Number.isFinite(ts) && ts >= threshold;
  }).length;
}

function countSameSignalWithinDays(events = [], label, nowIso, days = 14) {
  if (!label) return 0;
  const nowMs = Date.parse(nowIso || "");
  if (!Number.isFinite(nowMs)) return 0;
  const threshold = nowMs - days * DAY_MS;
  return (Array.isArray(events) ? events : []).filter((item) => {
    const ts = Date.parse(item?.timestamp || "");
    return Number.isFinite(ts) && ts >= threshold && item?.label === label;
  }).length;
}

function intentHistogramLast30d(intentEvents = [], nowIso) {
  const nowMs = Date.parse(nowIso || "");
  if (!Number.isFinite(nowMs)) return {};
  const threshold = nowMs - 30 * DAY_MS;
  const histogram = {};
  for (const item of Array.isArray(intentEvents) ? intentEvents : []) {
    const ts = Date.parse(item?.timestamp || "");
    if (!Number.isFinite(ts) || ts < threshold) continue;
    const intent = sanitizeText(item?.intent, 64);
    if (!intent) continue;
    histogram[intent] = Number(histogram[intent] || 0) + 1;
  }
  return histogram;
}

function topIntentsFromHistogram(histogram = {}, top = 3) {
  return Object.entries(histogram)
    .sort((a, b) => b[1] - a[1])
    .slice(0, top)
    .map(([intent]) => intent);
}

function inferPeakTimeband(nowIso) {
  const parsed = Date.parse(nowIso || "");
  if (!Number.isFinite(parsed)) return "";
  const hour = new Date(parsed).getUTCHours();
  if (hour >= 13 && hour < 17) return "21:00-01:00";
  if (hour >= 8 && hour < 13) return "16:00-20:00";
  return "08:00-12:00";
}

function isExplicitReminderPreference(message = "") {
  const text = String(message || "").toLowerCase();
  return (
    (text.includes("提醒") && (text.includes("不要") || text.includes("别") || text.includes("以后"))) ||
    (text.includes("remind") && (text.includes("don't") || text.includes("do not") || text.includes("later")))
  );
}

function buildPromptSlotCandidates({ profile, longTerm, primaryConcern, riskLevel }) {
  const coreSlots = [
    { key: "risk_level_current", value: riskLevel, priority: 1 },
    { key: "last_primary_concern", value: primaryConcern || "", priority: 2 },
    { key: "pregnancy_week", value: profile?.pregnancy_week || "", priority: 3 },
    { key: "language_pref", value: profile?.language_pref || "zh", priority: 3 },
    { key: "sensitive_reminder_pref", value: profile?.sensitive_reminder_pref || null, priority: 4 },
    { key: "conversation_tone_pref", value: profile?.conversation_tone_pref || "", priority: 4 },
    { key: "content_pref_topics", value: profile?.content_pref_topics || [], priority: 4 },
    { key: "faq_type_top3", value: profile?.faq_type_top3 || [], priority: 4 },
  ];

  const longTermSlots = [
    { key: "emotional_patterns", value: longTerm?.emotional_patterns || null, priority: 5 },
    { key: "content_preferences", value: longTerm?.content_preferences || null, priority: 5 },
    { key: "feature_preferences", value: longTerm?.feature_preferences || null, priority: 5 },
    { key: "lifestyle_trends", value: longTerm?.lifestyle_trends || null, priority: 5 },
  ];

  return [...coreSlots, ...longTermSlots];
}

function hasValue(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return Boolean(value.trim());
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value).length > 0;
  return true;
}

function defaultUserRecord(userId, nowIso) {
  return {
    userId,
    pregnancyWeek: "",
    riskLevel: "R0",
    emotionalTrend: [],
    escalationCount: 0,
    lastSessionId: "",
    lastUpdatedAt: nowIso,
    source: "agent_chat",
    user_profile: {
      user_id: userId,
      display_name: "",
      language_pref: "zh",
      timezone: "",
      pregnancy_week: "",
      due_date: "",
      dating_method: "",
      risk_level_current: "R0",
      risk_level_baseline: "R0",
      risk_last_trigger_at: null,
      escalation_count_30d: 0,
      emotion_trend_7d: [],
      sleep_summary_7d: {
        avg_hours: null,
        night_waking_days: 0,
      },
      diet_summary_7d: {
        adherence_score: null,
      },
      exercise_summary_7d: {
        active_days: null,
        consistency_score: null,
      },
      content_pref_topics: [],
      content_format_pref: [],
      feature_usage_pref: {},
      sensitive_reminder_pref: {
        opt_in: true,
        quiet_hours: "",
        tone: "gentle",
      },
      conversation_tone_pref: "",
      faq_type_top3: [],
      medical_contraindication_tags: [],
      allergy_tags: [],
      last_primary_concern: "",
    },
    long_term_memory: createDefaultLongTermMemory(),
    memory_meta: createDefaultMemoryMeta(nowIso),
  };
}

export function createUserStateMemoryStore({ store, now = () => new Date() }) {
  return {
    async updateFromTurn({
      userId,
      sessionId,
      profile = {},
      riskLevel = "R0",
      escalated = false,
      source = "agent_chat",
      classification = null,
      shortTermMemory = null,
      message = "",
      lang = "zh",
      clientContext = {},
    }) {
      const nowIso = now().toISOString();
      const state = await store.read();
      const users = state?.users && typeof state.users === "object" ? state.users : {};
      const prev = users[userId] || defaultUserRecord(userId, nowIso);

      const safeSource = WRITE_SOURCE_WHITELIST.has(source) ? source : "agent_chat";
      const safeRiskLevel = normalizeEnum(riskLevel, ["R0", "R1", "R2", "R3"], "R0");
      const trend = normalizeTrend(prev.user_profile?.emotion_trend_7d || prev.emotionalTrend, safeRiskLevel);
      const baselineRisk = deriveRiskBaseline(trend);

      const memoryMeta = {
        ...(prev.memory_meta || createDefaultMemoryMeta(nowIso)),
      };
      memoryMeta.signal_history = {
        primary_distress_events: compactEvents(memoryMeta.signal_history?.primary_distress_events || [], nowIso),
        intent_events: compactEvents(memoryMeta.signal_history?.intent_events || [], nowIso),
        escalation_events: compactEvents(memoryMeta.signal_history?.escalation_events || [], nowIso),
      };

      const primaryDistress = sanitizeText(shortTermMemory?.currentPrimaryDistress?.label, 80);
      const primaryDistressConfidence = Number(shortTermMemory?.currentPrimaryDistress?.confidence);
      if (primaryDistress) {
        memoryMeta.signal_history.primary_distress_events.push({
          label: primaryDistress,
          confidence: Number.isFinite(primaryDistressConfidence)
            ? Number(Math.max(0, Math.min(1, primaryDistressConfidence)).toFixed(2))
            : 0,
          timestamp: nowIso,
        });
      }

      const primaryIntent = sanitizeText(classification?.primary_intent, 64);
      if (primaryIntent) {
        memoryMeta.signal_history.intent_events.push({
          intent: primaryIntent,
          confidence: Number.isFinite(Number(classification?.confidence)) ? Number(classification.confidence) : null,
          timestamp: nowIso,
        });
      }

      if (escalated || safeRiskLevel === "R2" || safeRiskLevel === "R3") {
        memoryMeta.signal_history.escalation_events.push({
          level: safeRiskLevel,
          timestamp: nowIso,
        });
      }

      memoryMeta.signal_history.primary_distress_events = compactEvents(memoryMeta.signal_history.primary_distress_events, nowIso);
      memoryMeta.signal_history.intent_events = compactEvents(memoryMeta.signal_history.intent_events, nowIso);
      memoryMeta.signal_history.escalation_events = compactEvents(memoryMeta.signal_history.escalation_events, nowIso);

      const escalationCount30d = countRecentEvents(memoryMeta.signal_history.escalation_events, nowIso, 30);
      const riskTriggered = shortTermMemory?.recentSafetyEvent?.triggered || safeRiskLevel === "R2" || safeRiskLevel === "R3";
      const hasRepeatSignal =
        primaryDistress &&
        Number(primaryDistressConfidence) >= 0.7 &&
        countSameSignalWithinDays(memoryMeta.signal_history.primary_distress_events, primaryDistress, nowIso, 14) >= 2;
      const explicitReminderPref = isExplicitReminderPreference(message);
      const shouldWriteLongTerm = Boolean(riskTriggered || hasRepeatSignal || explicitReminderPref);

      const profileCheckinSummary = summarizeCheckIns(clientContext?.checkIns || []);
      const prevLongTerm = {
        ...createDefaultLongTermMemory(),
        ...(prev.long_term_memory || {}),
      };

      const intentHistogram = intentHistogramLast30d(memoryMeta.signal_history.intent_events, nowIso);
      const topIntents30d = topIntentsFromHistogram(intentHistogram, 3);

      const nextLongTerm = {
        ...prevLongTerm,
        faq_patterns: {
          top_intents_30d: topIntents30d,
          intent_histogram_30d: intentHistogram,
        },
      };

      if (shouldWriteLongTerm && primaryDistress) {
        nextLongTerm.emotional_patterns = {
          tags: uniqueMerge(prevLongTerm.emotional_patterns?.tags || [], [primaryDistress], 12),
          peak_timeband: prevLongTerm.emotional_patterns?.peak_timeband || inferPeakTimeband(nowIso),
          effective_actions: uniqueMerge(
            prevLongTerm.emotional_patterns?.effective_actions || [],
            [shortTermMemory?.latestRecommendation?.topic || ""],
            8
          ),
        };
      }

      if (shouldWriteLongTerm) {
        const latestTopic = sanitizeText(shortTermMemory?.latestRecommendation?.topic, 64);
        const existingTopicScores = {
          ...(prevLongTerm.content_preferences?.topic_scores || {}),
        };
        if (latestTopic) {
          existingTopicScores[latestTopic] = Number((Number(existingTopicScores[latestTopic] || 0) + 0.1).toFixed(2));
        }

        nextLongTerm.content_preferences = {
          topic_scores: existingTopicScores,
          format_pref: uniqueMerge(
            prevLongTerm.content_preferences?.format_pref || [],
            normalizeStringArray(profile?.contentFormatPref || profile?.content_format_pref || [], 4)
          ),
          reject_tags: normalizeStringArray(prevLongTerm.content_preferences?.reject_tags || [], 6),
        };

        nextLongTerm.feature_preferences = {
          most_used_features: uniqueMerge(
            prevLongTerm.feature_preferences?.most_used_features || [],
            primaryIntent === "app_feature_explanation" ? ["feature_guide"] : [],
            8
          ),
          preferred_entry_path:
            sanitizeText(clientContext?.entryPath, 80) ||
            prevLongTerm.feature_preferences?.preferred_entry_path ||
            "",
          dropoff_points: normalizeStringArray(prevLongTerm.feature_preferences?.dropoff_points || [], 8),
        };
      }

      const sleepAvg = profileCheckinSummary.sleep_summary_7d?.avg_hours;
      if (Number.isFinite(Number(sleepAvg))) {
        nextLongTerm.lifestyle_trends = {
          ...prevLongTerm.lifestyle_trends,
          sleep_trend_30d: {
            avg_hours: sleepAvg,
            improving: null,
          },
          diet_trend_30d: {
            ...(prevLongTerm.lifestyle_trends?.diet_trend_30d || { adherence: null, improving: null }),
          },
          exercise_trend_30d: {
            ...(prevLongTerm.lifestyle_trends?.exercise_trend_30d || { consistency: null, improving: null }),
          },
        };
      }

      const previousSensitiveReminder = prev.user_profile?.sensitive_reminder_pref || {
        opt_in: true,
        quiet_hours: "",
        tone: "gentle",
      };
      const incomingSensitiveReminder = profile?.sensitiveReminderPref || profile?.sensitive_reminder_pref || {};
      const nextSensitiveReminder = {
        opt_in:
          typeof incomingSensitiveReminder?.opt_in === "boolean"
            ? incomingSensitiveReminder.opt_in
            : typeof incomingSensitiveReminder?.optIn === "boolean"
              ? incomingSensitiveReminder.optIn
              : previousSensitiveReminder.opt_in,
        quiet_hours:
          sanitizeText(incomingSensitiveReminder?.quiet_hours || incomingSensitiveReminder?.quietHours, 24) ||
          previousSensitiveReminder.quiet_hours ||
          "",
        tone:
          sanitizeText(incomingSensitiveReminder?.tone, 24) || previousSensitiveReminder.tone || "gentle",
      };

      if (explicitReminderPref) {
        memoryMeta.pending_verification = {
          ...(memoryMeta.pending_verification || {}),
          sensitive_reminder_pref: {
            status: "pending_verification",
            reason: "explicit_conversation_preference",
            captured_at: nowIso,
          },
        };
      }

      const contentPrefTopics = Object.entries(nextLongTerm.content_preferences?.topic_scores || {})
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([topic]) => topic);

      const userProfile = {
        ...(prev.user_profile || {}),
        user_id: userId,
        display_name: sanitizeText(profile?.name || profile?.displayName, 48) || prev.user_profile?.display_name || "",
        language_pref: normalizeEnum(profile?.language || profile?.language_pref || lang, ["zh", "en"], prev.user_profile?.language_pref || "zh"),
        timezone: sanitizeText(profile?.timezone || clientContext?.timezone, 64) || prev.user_profile?.timezone || "",
        pregnancy_week: sanitizeText(profile?.pregnancyWeek || profile?.pregnancy_week, 20) || prev.user_profile?.pregnancy_week || "",
        due_date: normalizeIsoDate(profile?.dueDate || profile?.due_date) || prev.user_profile?.due_date || "",
        dating_method: sanitizeText(profile?.datingMethod || profile?.dating_method, 20) || prev.user_profile?.dating_method || "",
        risk_level_current: safeRiskLevel,
        risk_level_baseline: baselineRisk,
        risk_last_trigger_at: riskTriggered ? nowIso : prev.user_profile?.risk_last_trigger_at || null,
        escalation_count_30d: escalationCount30d,
        emotion_trend_7d: trend,
        sleep_summary_7d: profileCheckinSummary.sleep_summary_7d,
        diet_summary_7d:
          typeof clientContext?.dietSummary === "object" && clientContext?.dietSummary
            ? {
                adherence_score: Number.isFinite(Number(clientContext.dietSummary.adherenceScore))
                  ? Number(clientContext.dietSummary.adherenceScore)
                  : prev.user_profile?.diet_summary_7d?.adherence_score || null,
              }
            : prev.user_profile?.diet_summary_7d || { adherence_score: null },
        exercise_summary_7d:
          typeof clientContext?.exerciseSummary === "object" && clientContext?.exerciseSummary
            ? {
                active_days: Number.isFinite(Number(clientContext.exerciseSummary.activeDays))
                  ? Number(clientContext.exerciseSummary.activeDays)
                  : prev.user_profile?.exercise_summary_7d?.active_days || null,
                consistency_score: Number.isFinite(Number(clientContext.exerciseSummary.consistencyScore))
                  ? Number(clientContext.exerciseSummary.consistencyScore)
                  : prev.user_profile?.exercise_summary_7d?.consistency_score || null,
              }
            : prev.user_profile?.exercise_summary_7d || { active_days: null, consistency_score: null },
        content_pref_topics: contentPrefTopics,
        content_format_pref: uniqueMerge(
          prev.user_profile?.content_format_pref || [],
          normalizeStringArray(profile?.contentFormatPref || profile?.content_format_pref || [], 4)
        ),
        feature_usage_pref:
          typeof profile?.featureUsagePref === "object" && profile?.featureUsagePref
            ? profile.featureUsagePref
            : typeof profile?.feature_usage_pref === "object" && profile?.feature_usage_pref
              ? profile.feature_usage_pref
              : prev.user_profile?.feature_usage_pref || {},
        sensitive_reminder_pref: nextSensitiveReminder,
        conversation_tone_pref:
          sanitizeText(profile?.conversationTonePref || profile?.conversation_tone_pref, 24) ||
          prev.user_profile?.conversation_tone_pref ||
          "",
        faq_type_top3: topIntents30d,
        medical_contraindication_tags: uniqueMerge(
          prev.user_profile?.medical_contraindication_tags || [],
          normalizeStringArray(profile?.medicalContraindicationTags || profile?.medical_contraindication_tags || [], 8),
          8
        ),
        allergy_tags: uniqueMerge(
          prev.user_profile?.allergy_tags || [],
          normalizeStringArray(profile?.allergyTags || profile?.allergy_tags || [], 8),
          8
        ),
        last_primary_concern: primaryDistress || prev.user_profile?.last_primary_concern || "",
      };

      if (explicitReminderPref) {
        nextLongTerm.sensitive_reminders = {
          ...prevLongTerm.sensitive_reminders,
          ...nextSensitiveReminder,
          frequency_cap_per_day: Number.isFinite(Number(prevLongTerm.sensitive_reminders?.frequency_cap_per_day))
            ? Number(prevLongTerm.sensitive_reminders.frequency_cap_per_day)
            : 2,
        };
      }

      memoryMeta.last_compacted_at = nowIso;

      const next = {
        ...prev,
        userId,
        pregnancyWeek: userProfile.pregnancy_week,
        riskLevel: safeRiskLevel,
        emotionalTrend: trend,
        escalationCount: escalationCount30d,
        lastSessionId: sessionId,
        lastUpdatedAt: nowIso,
        source: safeSource,
        user_profile: userProfile,
        long_term_memory: nextLongTerm,
        memory_meta: memoryMeta,
      };

      users[userId] = next;
      await store.write({
        ...state,
        users,
      });
      return next;
    },

    async getByUserId(userId) {
      const state = await store.read();
      return state?.users?.[userId] || null;
    },

    async getPromptContext({ userId, intent = "general", maxFields = 16 } = {}) {
      const safeLimit = Number.isFinite(Number(maxFields)) ? Math.max(6, Math.min(20, Number(maxFields))) : 16;
      const state = await store.read();
      const userState = state?.users?.[userId] || null;
      if (!userState) {
        return {
          userId,
          intent,
          slots: [],
          generatedAt: now().toISOString(),
        };
      }

      const profile = userState.user_profile || {};
      const longTerm = userState.long_term_memory || createDefaultLongTermMemory();
      const candidates = buildPromptSlotCandidates({
        profile,
        longTerm,
        primaryConcern: profile.last_primary_concern,
        riskLevel: profile.risk_level_current,
      });

      const filteredByIntent = candidates.filter((slot) => {
        if (!hasValue(slot.value)) return false;
        if (intent === "feature" && slot.key === "lifestyle_trends") return false;
        if (!["sleep", "diet", "exercise"].includes(intent) && slot.key === "lifestyle_trends") return false;
        return true;
      });

      const slots = filteredByIntent
        .sort((a, b) => a.priority - b.priority)
        .slice(0, safeLimit)
        .map((slot) => ({
          key: slot.key,
          value: slot.value,
          priority: slot.priority,
          last_updated_at: userState.lastUpdatedAt || null,
        }));

      return {
        userId,
        intent,
        slots,
        generatedAt: now().toISOString(),
      };
    },
  };
}
