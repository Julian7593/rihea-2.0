// Risk Assessment Utilities for Emotional Health

<<<<<<< HEAD
import { calcCheckInCoverage, getRecentCheckIns, toDateKey } from "./checkin.js";
import { detectDangerSignalsInText } from "./dangerSignalDetector.js";

=======
/**
 * Risk level definitions
 */
>>>>>>> 356bd4d38d8b7f31d8a35a177e59ac40d7d6cf8a
export const RISK_LEVELS = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
};

<<<<<<< HEAD
export const ALERT_LEVELS = {
  NONE: "none",
  WATCH: "watch",
  URGENT: "urgent",
};

const LEVEL_ORDER = {
  [RISK_LEVELS.LOW]: 0,
  [RISK_LEVELS.MEDIUM]: 1,
  [RISK_LEVELS.HIGH]: 2,
};

const CBT_VALIDITY_DAYS = 14;

=======
/**
 * Risk level configurations
 */
>>>>>>> 356bd4d38d8b7f31d8a35a177e59ac40d7d6cf8a
export const RISK_LEVEL_CONFIG = {
  [RISK_LEVELS.LOW]: {
    label: { zh: "低风险", en: "Low Risk" },
    color: "bg-green-500",
    textColor: "text-green-600",
    borderColor: "border-green-500",
<<<<<<< HEAD
    accent: "#22c55e",
    scoreRange: [0, 30],
    recommendation: {
      zh: "情绪状态总体稳定，继续保持规律打卡、睡眠和支持网络。",
      en: "Emotional state looks broadly stable. Keep consistent check-ins, sleep, and support routines.",
=======
    scoreRange: [0, 30],
    recommendation: {
      zh: "情绪状态良好，继续保持健康的生活习惯。",
      en: "Emotional state is good, maintain healthy habits.",
>>>>>>> 356bd4d38d8b7f31d8a35a177e59ac40d7d6cf8a
    },
    expertType: ["midwife", "nutritionist"],
  },
  [RISK_LEVELS.MEDIUM]: {
    label: { zh: "中等风险", en: "Medium Risk" },
    color: "bg-yellow-500",
    textColor: "text-yellow-600",
    borderColor: "border-yellow-500",
<<<<<<< HEAD
    accent: "#eab308",
    scoreRange: [31, 60],
    recommendation: {
      zh: "建议增加观察频率，并尽快安排一次专业沟通或筛查复评。",
      en: "Increase monitoring and consider arranging a professional check-in or reassessment soon.",
=======
    scoreRange: [31, 60],
    recommendation: {
      zh: "建议进行心理疏导，尝试放松练习，必要时咨询专业人士。",
      en: "Consider psychological counseling and relaxation exercises, consult a professional if needed.",
>>>>>>> 356bd4d38d8b7f31d8a35a177e59ac40d7d6cf8a
    },
    expertType: ["psychologist", "midwife"],
  },
  [RISK_LEVELS.HIGH]: {
    label: { zh: "高风险", en: "High Risk" },
    color: "bg-red-500",
    textColor: "text-red-600",
    borderColor: "border-red-500",
<<<<<<< HEAD
    accent: "#ef4444",
    scoreRange: [61, 100],
    recommendation: {
      zh: "当前更适合优先获得专业支持，并尽快完成安全确认与临床协作。",
      en: "Professional support should be prioritized now, together with a safety check and clinical follow-up.",
=======
    scoreRange: [61, 100],
    recommendation: {
      zh: "建议立即寻求专业心理医生或产科医生的帮助。",
      en: "Seek immediate help from a psychologist or obstetrician.",
>>>>>>> 356bd4d38d8b7f31d8a35a177e59ac40d7d6cf8a
    },
    expertType: ["psychologist", "obstetrician"],
  },
};

<<<<<<< HEAD
const fallbackText = (lang, zh, en) => (lang === "en" ? en : zh);

const clampScore = (value) => Math.max(0, Math.min(100, Math.round(Number(value) || 0)));

const compareRiskLevel = (left, right) =>
  LEVEL_ORDER[left] > LEVEL_ORDER[right] ? left : right;

const normalizeAssessment = (value = {}) => ({
  epdsScore: Number.isFinite(Number(value?.epdsScore)) ? Number(value.epdsScore) : 0,
  gad7Score: Number.isFinite(Number(value?.gad7Score)) ? Number(value.gad7Score) : 0,
  isi7Score: Number.isFinite(Number(value?.isi7Score)) ? Number(value.isi7Score) : 0,
  selfHarmRisk: Boolean(value?.selfHarmRisk),
  completedAt: typeof value?.completedAt === "string" ? value.completedAt : "",
  source: typeof value?.source === "string" ? value.source : "",
});

function getLevelFromScore(score) {
  if (score <= RISK_LEVEL_CONFIG[RISK_LEVELS.LOW].scoreRange[1]) return RISK_LEVELS.LOW;
  if (score <= RISK_LEVEL_CONFIG[RISK_LEVELS.MEDIUM].scoreRange[1]) return RISK_LEVELS.MEDIUM;
  return RISK_LEVELS.HIGH;
}

function calcConsecutiveLowMoodDays(entries, now = new Date()) {
  const todayKey = toDateKey(now);
  const entryMap = new Map(entries.map((entry) => [entry.date, entry]));
  let cursorKey = todayKey;
  let consecutiveDays = 0;

  while (entryMap.has(cursorKey)) {
    const entry = entryMap.get(cursorKey);
    if (!entry || entry.mood > 1) break;
    consecutiveDays += 1;
    const cursorDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - consecutiveDays);
    cursorKey = toDateKey(cursorDate);
=======
/**
 * Calculate consecutive low mood days
 * @param {Array} entries - Check-in entries sorted by date (descending)
 * @returns {number} Number of consecutive low mood days
 */
function calcConsecutiveLowMoodDays(entries) {
  const LOW_MOOD_THRESHOLD = 1; // mood <= 1 is considered low
  const today = new Date();
  let consecutiveDays = 0;

  // Check from today backwards
  for (let i = 0; i < 30; i++) {
    const dateToCheck = new Date(today);
    dateToCheck.setDate(dateToCheck.getDate() - i);
    const dateKey = dateToCheck.toISOString().slice(0, 10);

    const entry = entries.find(e => e.date === dateKey);

    if (!entry) {
      // Missing day breaks the streak if we haven't started counting yet
      if (consecutiveDays === 0) continue;
      break;
    }

    if (entry.mood <= LOW_MOOD_THRESHOLD) {
      consecutiveDays++;
    } else {
      break;
    }
>>>>>>> 356bd4d38d8b7f31d8a35a177e59ac40d7d6cf8a
  }

  return consecutiveDays;
}

<<<<<<< HEAD
function calcAverageMood(entries) {
  if (!entries.length) return null;
  const sum = entries.reduce((acc, entry) => acc + entry.mood, 0);
  return sum / entries.length;
}

function calcMoodExtremeCount(entries) {
  return entries.filter((entry) => entry.mood === 0 || entry.mood === 4).length;
}

function calcSleepMetrics(entries) {
  const sleepEntries = entries.filter((entry) => Number.isFinite(entry.sleepHours));
  if (!sleepEntries.length) {
    return {
      avgSleepHours: null,
      sleepQuality: null,
      sleepVariability: null,
    };
  }

  const avgSleepHours = sleepEntries.reduce((acc, entry) => acc + entry.sleepHours, 0) / sleepEntries.length;
  const variance =
    sleepEntries.reduce((acc, entry) => acc + (entry.sleepHours - avgSleepHours) ** 2, 0) / sleepEntries.length;
  const sleepVariability = Math.sqrt(variance);
  const diff = Math.abs(avgSleepHours - 8);
  const sleepQuality = Math.max(0, 100 - diff * 15 - sleepVariability * 12);

  return {
    avgSleepHours: Number(avgSleepHours.toFixed(1)),
    sleepQuality: Math.round(sleepQuality),
    sleepVariability: Number(sleepVariability.toFixed(1)),
  };
}

function buildNoDataResult(lang = "zh") {
  return {
    level: RISK_LEVELS.LOW,
    score: 0,
    factors: [
      {
        type: "no_data",
        weight: 0,
        description: {
          zh: "暂无足够数据进行评估，请继续记录打卡数据。",
          en: "Not enough data for assessment. Keep recording check-ins.",
        },
      },
    ],
    recommendation: RISK_LEVEL_CONFIG[RISK_LEVELS.LOW].recommendation[lang],
    expertTypes: RISK_LEVEL_CONFIG[RISK_LEVELS.LOW].expertType,
    hasData: false,
    provisional: false,
    dataQuality: {
      recentEntries: 0,
      coverage7d: 0,
      stable: false,
    },
    bands: {
      dynamicLevel: RISK_LEVELS.LOW,
      clinicalLevel: null,
      finalLevel: RISK_LEVELS.LOW,
    },
    alert: {
      triggered: false,
      level: ALERT_LEVELS.NONE,
      reasons: [],
    },
    sources: {
      dynamic: {
        used: false,
        stable: false,
      },
      clinical: {
        used: false,
        valid: false,
        expired: false,
      },
    },
    metrics: {
      consecutiveLowMoodDays: 0,
      avgMood: null,
      sleepQuality: null,
      avgSleepHours: null,
      sleepVariability: null,
      moodExtremeCount: 0,
      noteSignalCount: 0,
      coverage7d: 0,
      recentEntries: 0,
    },
  };
}

export function computeDynamicRisk({ checkIns = [], lang = "zh", now = new Date() } = {}) {
  const recentEntries = getRecentCheckIns(checkIns, 7, now);
  const coverage = calcCheckInCoverage(checkIns, 7, now);
  const consecutiveLowMoodDays = calcConsecutiveLowMoodDays(checkIns, now);
  const avgMood = calcAverageMood(recentEntries);
  const moodExtremeCount = calcMoodExtremeCount(recentEntries);
  const sleep = calcSleepMetrics(recentEntries);
  const noteSignals = recentEntries.flatMap((entry) => detectDangerSignalsInText(entry?.note || ""));
  const uniqueNoteSignals = Array.from(new Map(noteSignals.map((signal) => [signal.id, signal])).values());
  const factors = [];

  if (consecutiveLowMoodDays > 0) {
    const weight = Math.min(48, consecutiveLowMoodDays * 12);
=======
/**
 * Calculate average mood over recent period
 * @param {Array} entries - Check-in entries
 * @param {number} days - Number of days to look back (default: 7)
 * @returns {number} Average mood score (0-4) or null if no data
 */
function calcAverageMood(entries, days = 7) {
  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() - days + 1);

  const recentEntries = entries.filter(e => {
    const entryDate = new Date(e.date);
    return entryDate >= thresholdDate;
  });

  if (recentEntries.length === 0) return null;

  const sum = recentEntries.reduce((acc, e) => acc + e.mood, 0);
  return sum / recentEntries.length;
}

/**
 * Calculate sleep quality score
 * @param {Array} entries - Check-in entries
 * @param {number} days - Number of days to look back (default: 7)
 * @returns {number} Sleep quality score (0-100) or null if no data
 */
function calcSleepQualityScore(entries, days = 7) {
  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() - days + 1);

  const recentEntries = entries.filter(e => {
    const entryDate = new Date(e.date);
    return entryDate >= thresholdDate && e.sleepHours !== null;
  });

  if (recentEntries.length === 0) return null;

  // Calculate average sleep hours
  const avgSleep = recentEntries.reduce((acc, e) => acc + e.sleepHours, 0) / recentEntries.length;

  // Ideal sleep is 8 hours, calculate score
  const diff = Math.abs(avgSleep - 8);
  const score = Math.max(0, 100 - diff * 15); // Each hour difference reduces score by 15

  return Math.round(score);
}

/**
 * Count mood extremes (very low or very high)
 * @param {Array} entries - Check-in entries
 * @param {number} days - Number of days to look back (default: 7)
 * @returns {number} Count of extreme mood events
 */
function calcMoodExtremeCount(entries, days = 7) {
  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() - days + 1);

  const recentEntries = entries.filter(e => {
    const entryDate = new Date(e.date);
    return entryDate >= thresholdDate;
  });

  // Count extreme moods (0 or 4)
  return recentEntries.filter(e => e.mood === 0 || e.mood === 4).length;
}

/**
 * Assess emotional risk based on check-in data
 * @param {Object} profile - User profile containing check-in data
 * @returns {Object} Risk assessment result
 */
export function assessEmotionalRisk(profile) {
  const entries = profile?.checkIns || [];
  const lang = profile?.lang || "zh";

  // If no data, return low risk with a note
  if (entries.length === 0) {
    return {
      level: RISK_LEVELS.LOW,
      score: 0,
      factors: [
        {
          type: "no_data",
          weight: 0,
          description: {
            zh: "暂无足够数据进行评估，请继续记录打卡数据。",
            en: "Not enough data for assessment, please continue check-in.",
          },
        },
      ],
      recommendation: RISK_LEVEL_CONFIG[RISK_LEVELS.LOW].recommendation[lang],
      expertTypes: RISK_LEVEL_CONFIG[RISK_LEVELS.LOW].expertType,
      hasData: false,
    };
  }

  // Calculate risk factors
  const consecutiveLowMoodDays = calcConsecutiveLowMoodDays(entries);
  const avgMood = calcAverageMood(entries);
  const sleepQuality = calcSleepQualityScore(entries);
  const moodExtremeCount = calcMoodExtremeCount(entries);

  const factors = [];

  // Factor 1: Consecutive low mood days (weight: 10 per day)
  if (consecutiveLowMoodDays > 0) {
    const weight = Math.min(50, consecutiveLowMoodDays * 10);
>>>>>>> 356bd4d38d8b7f31d8a35a177e59ac40d7d6cf8a
    factors.push({
      type: "consecutive_low_mood",
      weight,
      value: consecutiveLowMoodDays,
      description: {
<<<<<<< HEAD
        zh: `连续${consecutiveLowMoodDays}天记录到低情绪`,
        en: `${consecutiveLowMoodDays} consecutive recorded days with low mood`,
=======
        zh: `连续${consecutiveLowMoodDays}天低情绪`,
        en: `${consecutiveLowMoodDays} consecutive days with low mood`,
>>>>>>> 356bd4d38d8b7f31d8a35a177e59ac40d7d6cf8a
      },
    });
  }

<<<<<<< HEAD
  if (avgMood !== null && avgMood < 2) {
    const weight = Math.min(28, Math.round((2 - avgMood) * 20));
=======
  // Factor 2: Average mood (inverse: lower mood = higher risk)
  if (avgMood !== null && avgMood < 2) {
    const weight = Math.round((2 - avgMood) * 20);
>>>>>>> 356bd4d38d8b7f31d8a35a177e59ac40d7d6cf8a
    factors.push({
      type: "low_average_mood",
      weight,
      value: avgMood.toFixed(1),
      description: {
<<<<<<< HEAD
        zh: `近7天平均情绪偏低 (${avgMood.toFixed(1)}/4)`,
        en: `Low average mood over the past 7 days (${avgMood.toFixed(1)}/4)`,
=======
        zh: `近期平均情绪值较低 (${avgMood.toFixed(1)}/4)`,
        en: `Low recent average mood (${avgMood.toFixed(1)}/4)`,
>>>>>>> 356bd4d38d8b7f31d8a35a177e59ac40d7d6cf8a
      },
    });
  }

<<<<<<< HEAD
  if (sleep.avgSleepHours !== null && (sleep.avgSleepHours < 6 || sleep.avgSleepHours > 9.5)) {
    const weight = Math.min(22, Math.round(Math.abs(sleep.avgSleepHours - 8) * 8));
    factors.push({
      type: "sleep_duration_out_of_range",
      weight,
      value: sleep.avgSleepHours,
      description: {
        zh: `近7天平均睡眠时长偏离理想区间 (${sleep.avgSleepHours}h)`,
        en: `Average sleep duration is outside the ideal range (${sleep.avgSleepHours}h)`,
=======
  // Factor 3: Sleep quality (inverse: poorer sleep = higher risk)
  if (sleepQuality !== null && sleepQuality < 60) {
    const weight = Math.round((60 - sleepQuality) * 0.8);
    factors.push({
      type: "poor_sleep",
      weight,
      value: sleepQuality,
      description: {
        zh: `睡眠质量评分偏低 (${sleepQuality}/100)`,
        en: `Low sleep quality score (${sleepQuality}/100)`,
>>>>>>> 356bd4d38d8b7f31d8a35a177e59ac40d7d6cf8a
      },
    });
  }

<<<<<<< HEAD
  if (sleep.sleepVariability !== null && sleep.sleepVariability >= 1.5) {
    const weight = Math.min(16, Math.round((sleep.sleepVariability - 1.4) * 8));
    factors.push({
      type: "sleep_variability",
      weight,
      value: sleep.sleepVariability,
      description: {
        zh: `近7天睡眠波动偏大 (波动 ${sleep.sleepVariability}h)`,
        en: `Sleep has been unstable over the past 7 days (variation ${sleep.sleepVariability}h)`,
      },
    });
  }

  if (moodExtremeCount >= 2) {
    const weight = Math.min(18, moodExtremeCount * 6);
=======
  // Factor 4: Mood extremes (weight: 8 per extreme)
  if (moodExtremeCount > 0) {
    const weight = Math.min(30, moodExtremeCount * 8);
>>>>>>> 356bd4d38d8b7f31d8a35a177e59ac40d7d6cf8a
    factors.push({
      type: "mood_extremes",
      weight,
      value: moodExtremeCount,
      description: {
<<<<<<< HEAD
        zh: `近7天出现${moodExtremeCount}次情绪极值`,
        en: `${moodExtremeCount} extreme mood events over the past 7 days`,
=======
        zh: `近期情绪波动较大 (${moodExtremeCount}次极值)`,
        en: `High mood volatility (${moodExtremeCount} extreme events)`,
>>>>>>> 356bd4d38d8b7f31d8a35a177e59ac40d7d6cf8a
      },
    });
  }

<<<<<<< HEAD
  if (uniqueNoteSignals.length > 0) {
    factors.push({
      type: "danger_note_signal",
      weight: 35,
      value: uniqueNoteSignals.length,
      description: {
        zh: "近期备注中出现需要优先关注的安全信号",
        en: "Recent notes contain safety signals that need priority attention",
      },
    });
  }

  const score = clampScore(factors.reduce((sum, factor) => sum + factor.weight, 0));
  const level = getLevelFromScore(score);
  const stable = coverage.coveredDays >= 3;
  const provisional = coverage.recentEntries > 0 && !stable;

  return {
    level,
    score,
    formalLevel: stable ? level : score >= 31 ? RISK_LEVELS.MEDIUM : RISK_LEVELS.LOW,
    factors,
    provisional,
    hasData: coverage.recentEntries > 0,
    dataQuality: {
      recentEntries: coverage.recentEntries,
      coverage7d: Number(coverage.coverage.toFixed(2)),
      stable,
    },
    metrics: {
      consecutiveLowMoodDays,
      avgMood: avgMood !== null ? Number(avgMood.toFixed(1)) : null,
      sleepQuality: sleep.sleepQuality,
      avgSleepHours: sleep.avgSleepHours,
      sleepVariability: sleep.sleepVariability,
      moodExtremeCount,
      noteSignalCount: uniqueNoteSignals.length,
      coverage7d: Number(coverage.coverage.toFixed(2)),
      recentEntries: coverage.recentEntries,
    },
    alertReasons: [
      ...(consecutiveLowMoodDays >= 7
        ? [fallbackText(lang, "连续低情绪已达到 7 天及以上", "Low mood has persisted for at least 7 consecutive days")]
        : []),
      ...uniqueNoteSignals.map((signal) =>
        fallbackText(lang, `备注触发安全信号：${signal.name}`, `Safety signal detected in notes: ${signal.name}`)
      ),
    ],
  };
}

export function computeClinicalRisk({ cbtAssessment = null, lang = "zh", now = new Date() } = {}) {
  if (!cbtAssessment || typeof cbtAssessment !== "object") {
    return {
      available: false,
      valid: false,
      expired: false,
      level: null,
      score: 0,
      factors: [],
      alertReasons: [],
      assessment: null,
    };
  }

  const assessment = normalizeAssessment(cbtAssessment);
  const hasAssessment =
    assessment.selfHarmRisk ||
    assessment.epdsScore > 0 ||
    assessment.gad7Score > 0 ||
    assessment.isi7Score > 0;

  if (!hasAssessment) {
    return {
      available: false,
      valid: false,
      expired: false,
      level: null,
      score: 0,
      factors: [],
      alertReasons: [],
      assessment,
    };
  }

  const completedAt = assessment.completedAt ? new Date(assessment.completedAt) : null;
  const ageDays =
    completedAt && Number.isFinite(completedAt.getTime())
      ? Math.floor((now.getTime() - completedAt.getTime()) / (24 * 60 * 60 * 1000))
      : 0;
  const expired = ageDays > CBT_VALIDITY_DAYS;
  const valid = !expired;
  const factors = [];
  let level = RISK_LEVELS.LOW;
  let score = 0;

  if (assessment.selfHarmRisk) {
    level = RISK_LEVELS.HIGH;
    score = 95;
    factors.push({
      type: "clinical_self_harm_risk",
      weight: 95,
      value: true,
      description: {
        zh: "CBT 安全题提示存在自伤/急性安全风险",
        en: "CBT safety gate indicates self-harm or acute safety risk",
      },
    });
  } else if (assessment.epdsScore >= 13 || assessment.gad7Score >= 15 || assessment.isi7Score >= 15) {
    level = RISK_LEVELS.HIGH;
    score = 75;
    factors.push({
      type: "clinical_high_screening",
      weight: 75,
      value: {
        epdsScore: assessment.epdsScore,
        gad7Score: assessment.gad7Score,
        isi7Score: assessment.isi7Score,
      },
      description: {
        zh: "近期 CBT 量表达到高风险区间",
        en: "Recent CBT screening scores are in the high-risk range",
      },
    });
  } else if (
    (assessment.epdsScore >= 10 && assessment.epdsScore <= 12) ||
    (assessment.gad7Score >= 10 && assessment.gad7Score <= 14) ||
    (assessment.isi7Score >= 8 && assessment.isi7Score <= 14)
  ) {
    level = RISK_LEVELS.MEDIUM;
    score = 45;
    factors.push({
      type: "clinical_medium_screening",
      weight: 45,
      value: {
        epdsScore: assessment.epdsScore,
        gad7Score: assessment.gad7Score,
        isi7Score: assessment.isi7Score,
      },
      description: {
        zh: expired ? "最近一次 CBT 量表提示中风险（已过期）" : "近期 CBT 量表提示中风险",
        en: expired
          ? "The most recent CBT screening suggests medium risk (expired)"
          : "Recent CBT screening suggests medium risk",
      },
    });
  }

  return {
    available: true,
    valid,
    expired,
    level,
    score,
    factors,
    alertReasons: assessment.selfHarmRisk
      ? [fallbackText(lang, "CBT 安全题提示需要立即专业评估", "CBT safety gate indicates immediate professional review")]
      : [],
    assessment,
  };
}

export function mergeRiskDecision({ dynamicRisk, clinicalRisk, lang = "zh" } = {}) {
  const dynamic = dynamicRisk || computeDynamicRisk({ lang });
  const clinical = clinicalRisk || computeClinicalRisk({ lang });
  const urgent = dynamic.metrics.noteSignalCount > 0 || dynamic.metrics.consecutiveLowMoodDays >= 7 || clinical.alertReasons.length > 0;
  const watch = clinical.valid
    ? clinical.level === RISK_LEVELS.HIGH || dynamic.formalLevel === RISK_LEVELS.HIGH
    : dynamic.formalLevel === RISK_LEVELS.HIGH;

  let finalLevel = dynamic.formalLevel;
  if (clinical.valid && clinical.level) {
    finalLevel = compareRiskLevel(finalLevel, clinical.level);
  }
  if (!dynamic.dataQuality.stable && !clinical.valid) {
    finalLevel = dynamic.formalLevel;
  }
  if (urgent) {
    finalLevel = RISK_LEVELS.HIGH;
  }

  const alertLevel = urgent ? ALERT_LEVELS.URGENT : watch ? ALERT_LEVELS.WATCH : ALERT_LEVELS.NONE;
  const score = clampScore(Math.max(dynamic.score, clinical.valid ? clinical.score : 0, urgent ? 85 : 0));
  const config = RISK_LEVEL_CONFIG[finalLevel];
  const reasons = [...clinical.alertReasons, ...dynamic.alertReasons];

  return {
    level: finalLevel,
    score,
    factors: [...clinical.factors, ...dynamic.factors],
    recommendation: config.recommendation[lang],
    expertTypes: config.expertType,
    hasData: Boolean(dynamic.hasData || clinical.available),
    provisional: Boolean(dynamic.provisional && !clinical.valid),
    dataQuality: dynamic.dataQuality,
    bands: {
      dynamicLevel: dynamic.level,
      clinicalLevel: clinical.level,
      finalLevel,
    },
    alert: {
      triggered: alertLevel !== ALERT_LEVELS.NONE,
      level: alertLevel,
      reasons,
    },
    sources: {
      dynamic: {
        used: dynamic.hasData,
        stable: dynamic.dataQuality.stable,
      },
      clinical: {
        used: clinical.available,
        valid: clinical.valid,
        expired: clinical.expired,
      },
    },
    metrics: dynamic.metrics,
  };
}

export function assessEmotionalRisk(profile = {}) {
  const entries = Array.isArray(profile?.checkIns) ? profile.checkIns : [];
  const lang = profile?.lang || "zh";
  const cbtAssessment = profile?.cbtAssessment || profile?.assessment || null;
  const now = profile?.now instanceof Date ? profile.now : new Date();

  if (!entries.length && !cbtAssessment) {
    return buildNoDataResult(lang);
  }

  const dynamicRisk = computeDynamicRisk({ checkIns: entries, lang, now });
  const clinicalRisk = computeClinicalRisk({ cbtAssessment, lang, now });
  const merged = mergeRiskDecision({ dynamicRisk, clinicalRisk, lang });

  if (!merged.hasData) {
    return buildNoDataResult(lang);
  }

  return merged;
}

export function shouldTriggerEmergencyAlert(profile) {
  return assessEmotionalRisk(profile)?.alert?.triggered === true;
}

=======
  // Calculate total score
  const totalScore = factors.reduce((sum, f) => sum + f.weight, 0);

  // Determine risk level
  let riskLevel;
  if (totalScore <= RISK_LEVEL_CONFIG[RISK_LEVELS.LOW].scoreRange[1]) {
    riskLevel = RISK_LEVELS.LOW;
  } else if (totalScore <= RISK_LEVEL_CONFIG[RISK_LEVELS.MEDIUM].scoreRange[1]) {
    riskLevel = RISK_LEVELS.MEDIUM;
  } else {
    riskLevel = RISK_LEVELS.HIGH;
  }

  const config = RISK_LEVEL_CONFIG[riskLevel];

  return {
    level: riskLevel,
    score: Math.min(100, totalScore),
    factors,
    recommendation: config.recommendation[lang],
    expertTypes: config.expertType,
    hasData: true,
    // Additional context
    metrics: {
      consecutiveLowMoodDays,
      avgMood: avgMood?.toFixed(1),
      sleepQuality,
      moodExtremeCount,
    },
  };
}

/**
 * Check if emergency alert should be triggered
 * @param {Object} profile - User profile
 * @returns {boolean} True if emergency alert should be triggered
 */
export function shouldTriggerEmergencyAlert(profile) {
  const risk = assessEmotionalRisk(profile);

  // Emergency conditions:
  // 1. High risk level
  // 2. More than 7 consecutive low mood days
  // 3. Has valid data

  if (!risk.hasData) return false;

  if (risk.level === RISK_LEVELS.HIGH) {
    return true;
  }

  if (risk.metrics.consecutiveLowMoodDays >= 7) {
    return true;
  }

  // Check for danger indicators in notes
  const entries = profile?.checkIns || [];
  const dangerKeywords = [
    "自杀", "suicide", "结束", "end it", "不想活", "die",
    "解脱", "escape", "放弃", "give up",
  ];

  for (const entry of entries) {
    if (entry.note) {
      const noteLower = entry.note.toLowerCase();
      for (const keyword of dangerKeywords) {
        if (noteLower.includes(keyword)) {
          return true;
        }
      }
    }
  }

  return false;
}

/**
 * Get recommended expert types based on risk level
 * @param {string} riskLevel - Risk level (low, medium, high)
 * @returns {Array<string>} Array of recommended expert types
 */
>>>>>>> 356bd4d38d8b7f31d8a35a177e59ac40d7d6cf8a
export function getRecommendedExpertTypes(riskLevel) {
  return RISK_LEVEL_CONFIG[riskLevel]?.expertType || [];
}

<<<<<<< HEAD
=======
/**
 * Get risk level configuration
 * @param {string} riskLevel - Risk level (low, medium, high)
 * @param {string} lang - Language code (zh or en)
 * @returns {Object} Risk level configuration
 */
>>>>>>> 356bd4d38d8b7f31d8a35a177e59ac40d7d6cf8a
export function getRiskLevelConfig(riskLevel, lang = "zh") {
  const config = RISK_LEVEL_CONFIG[riskLevel];
  if (!config) return null;

  return {
    level: riskLevel,
    label: config.label[lang],
    color: config.color,
    textColor: config.textColor,
    borderColor: config.borderColor,
<<<<<<< HEAD
    accent: config.accent,
=======
>>>>>>> 356bd4d38d8b7f31d8a35a177e59ac40d7d6cf8a
    recommendation: config.recommendation[lang],
    scoreRange: config.scoreRange,
  };
}

export default {
<<<<<<< HEAD
  ALERT_LEVELS,
  RISK_LEVELS,
  RISK_LEVEL_CONFIG,
  computeClinicalRisk,
  computeDynamicRisk,
  mergeRiskDecision,
=======
  RISK_LEVELS,
  RISK_LEVEL_CONFIG,
>>>>>>> 356bd4d38d8b7f31d8a35a177e59ac40d7d6cf8a
  assessEmotionalRisk,
  shouldTriggerEmergencyAlert,
  getRecommendedExpertTypes,
  getRiskLevelConfig,
};
