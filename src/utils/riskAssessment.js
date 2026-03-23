// Risk Assessment Utilities for Emotional Health

/**
 * Risk level definitions
 */
export const RISK_LEVELS = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
};

/**
 * Risk level configurations
 */
export const RISK_LEVEL_CONFIG = {
  [RISK_LEVELS.LOW]: {
    label: { zh: "低风险", en: "Low Risk" },
    color: "bg-green-500",
    textColor: "text-green-600",
    borderColor: "border-green-500",
    scoreRange: [0, 30],
    recommendation: {
      zh: "情绪状态良好，继续保持健康的生活习惯。",
      en: "Emotional state is good, maintain healthy habits.",
    },
    expertType: ["midwife", "nutritionist"],
  },
  [RISK_LEVELS.MEDIUM]: {
    label: { zh: "中等风险", en: "Medium Risk" },
    color: "bg-yellow-500",
    textColor: "text-yellow-600",
    borderColor: "border-yellow-500",
    scoreRange: [31, 60],
    recommendation: {
      zh: "建议进行心理疏导，尝试放松练习，必要时咨询专业人士。",
      en: "Consider psychological counseling and relaxation exercises, consult a professional if needed.",
    },
    expertType: ["psychologist", "midwife"],
  },
  [RISK_LEVELS.HIGH]: {
    label: { zh: "高风险", en: "High Risk" },
    color: "bg-red-500",
    textColor: "text-red-600",
    borderColor: "border-red-500",
    scoreRange: [61, 100],
    recommendation: {
      zh: "建议立即寻求专业心理医生或产科医生的帮助。",
      en: "Seek immediate help from a psychologist or obstetrician.",
    },
    expertType: ["psychologist", "obstetrician"],
  },
};

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
  }

  return consecutiveDays;
}

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
    factors.push({
      type: "consecutive_low_mood",
      weight,
      value: consecutiveLowMoodDays,
      description: {
        zh: `连续${consecutiveLowMoodDays}天低情绪`,
        en: `${consecutiveLowMoodDays} consecutive days with low mood`,
      },
    });
  }

  // Factor 2: Average mood (inverse: lower mood = higher risk)
  if (avgMood !== null && avgMood < 2) {
    const weight = Math.round((2 - avgMood) * 20);
    factors.push({
      type: "low_average_mood",
      weight,
      value: avgMood.toFixed(1),
      description: {
        zh: `近期平均情绪值较低 (${avgMood.toFixed(1)}/4)`,
        en: `Low recent average mood (${avgMood.toFixed(1)}/4)`,
      },
    });
  }

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
      },
    });
  }

  // Factor 4: Mood extremes (weight: 8 per extreme)
  if (moodExtremeCount > 0) {
    const weight = Math.min(30, moodExtremeCount * 8);
    factors.push({
      type: "mood_extremes",
      weight,
      value: moodExtremeCount,
      description: {
        zh: `近期情绪波动较大 (${moodExtremeCount}次极值)`,
        en: `High mood volatility (${moodExtremeCount} extreme events)`,
      },
    });
  }

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
export function getRecommendedExpertTypes(riskLevel) {
  return RISK_LEVEL_CONFIG[riskLevel]?.expertType || [];
}

/**
 * Get risk level configuration
 * @param {string} riskLevel - Risk level (low, medium, high)
 * @param {string} lang - Language code (zh or en)
 * @returns {Object} Risk level configuration
 */
export function getRiskLevelConfig(riskLevel, lang = "zh") {
  const config = RISK_LEVEL_CONFIG[riskLevel];
  if (!config) return null;

  return {
    level: riskLevel,
    label: config.label[lang],
    color: config.color,
    textColor: config.textColor,
    borderColor: config.borderColor,
    recommendation: config.recommendation[lang],
    scoreRange: config.scoreRange,
  };
}

export default {
  RISK_LEVELS,
  RISK_LEVEL_CONFIG,
  assessEmotionalRisk,
  shouldTriggerEmergencyAlert,
  getRecommendedExpertTypes,
  getRiskLevelConfig,
};
