/**
 * 危险信号检测器
 * 检测饮食和运动记录中的危险信号，及时预警
 */

import { fitnessContent } from "../data/fitnessContent.js";
import { useLocalStorage } from "../hooks/useLocalStorage.js";

/**
 * 危险信号类型
 */
export const DANGER_SIGNAL_TYPES = {
  EMERGENCY: "emergency",       // 紧急 - 需要立即就医
  HIGH: "high",                // 高危 - 需要密切观察
  MEDIUM: "medium",            // 中危 - 需要注意
  LOW: "low",                 // 低危 - 提示
};

/**
 * 饮食相关危险信号
 */
const dietDangerSignals = [
  {
    id: "severe_nausea_cannot_eat",
    type: DANGER_SIGNAL_TYPES.HIGH,
    name: "严重孕吐无法进食",
    keywords: ["严重孕吐", "无法进食", "完全吃不下", "持续呕吐"],
    detection: (record) => {
      const note = record.note?.toLowerCase() || "";
      return note.includes("严重") && (note.includes("孕吐") || note.includes("呕吐")) &&
             (note.includes("无法") || note.includes("吃不下"));
    },
    action: "建议立即就医，可能需要输液补充营养",
  },
  {
    id: "continuous_low_intake",
    type: DANGER_SIGNAL_TYPES.MEDIUM,
    name: "连续3天营养摄入严重不足",
    keywords: [],
    detection: (records) => {
      if (!Array.isArray(records) || records.length < 3) return false;

      // 检查连续3天的记录
      const recentRecords = records.slice(0, 7); // 最近7天
      const uniqueDates = [...new Set(recentRecords.map(r => r.createdAt?.split("T")[0]))];

      if (uniqueDates.length >= 3) {
        const last3DaysRecords = recentRecords.filter(r =>
          uniqueDates.slice(0, 3).includes(r.createdAt?.split("T")[0])
        );

        const totalCalories = last3DaysRecords.reduce((sum, r) =>
          sum + (r.nutrition?.calories || 0), 0
        );

        // 如果3天总热量少于3000卡（平均每天<1000卡）
        return totalCalories < 3000;
      }

      return false;
    },
    action: "营养摄入严重不足，请尽快补充营养或就医",
  },
];

/**
 * 运动相关危险信号
 */
const exerciseDangerSignals = [
  ...fitnessContent.dangerSignals.signals.map((signal) => ({
    id: signal.id,
    type: signal.priority === "emergency" ? DANGER_SIGNAL_TYPES.EMERGENCY :
          signal.priority === "high" ? DANGER_SIGNAL_TYPES.HIGH :
          signal.priority === "medium" ? DANGER_SIGNAL_TYPES.MEDIUM : DANGER_SIGNAL_TYPES.LOW,
    name: signal.name,
    keywords: [signal.nameEn?.toLowerCase() || "", signal.name?.toLowerCase() || ""],
    detection: (record) => {
      const symptoms = record.discomfortSymptoms || [];
      return symptoms.some(symptom =>
        signal.nameEn?.toLowerCase().includes(symptom.toLowerCase()) ||
        signal.name?.toLowerCase().includes(symptom.toLowerCase())
      );
    },
    action: signal.action,
  })),
];

/**
 * 通用危险信号
 */
const generalDangerSignals = [
  {
    id: "user_reported_bleeding",
    type: DANGER_SIGNAL_TYPES.EMERGENCY,
    name: "用户报告出血",
    keywords: ["出血", "流血", "见红", "棕色分泌物"],
    detection: (input) => {
      const text = (input || "").toLowerCase();
      return ["出血", "流血", "见红"].some(keyword => text.includes(keyword));
    },
    action: "立即停止所有活动，立即就医！",
  },
  {
    id: "user_reported_abdominal_pain",
    type: DANGER_SIGNAL_TYPES.EMERGENCY,
    name: "用户报告腹痛",
    keywords: ["腹痛", "肚子痛", "宫缩"],
    detection: (input) => {
      const text = (input || "").toLowerCase();
      return ["腹痛", "肚子痛", "宫缩"].some(keyword => text.includes(keyword));
    },
    action: "立即停止活动，卧床休息，如不缓解立即就医！",
  },
  {
    id: "user_reported_reduced_fetal_movement",
    type: DANGER_SIGNAL_TYPES.HIGH,
    name: "胎动明显减少",
    keywords: ["胎动减少", "胎动消失", "宝宝不动"],
    detection: (input) => {
      const text = (input || "").toLowerCase();
      return ["胎动减少", "胎动消失", "宝宝不动"].some(keyword => text.includes(keyword));
    },
    action: "立即停止活动，左侧卧休息，数胎动1小时，如不改善立即就医",
  },
  {
    id: "user_reported_self_harm_risk",
    type: DANGER_SIGNAL_TYPES.EMERGENCY,
    name: "用户表达自伤或轻生风险",
    keywords: [
      "自杀",
      "不想活",
      "结束生命",
      "伤害自己",
      "suicide",
      "kill myself",
      "end it all",
      "don't want to live",
      "hurt myself",
    ],
    detection: (input) => {
      const text = (input || "").toLowerCase();
      return [
        "自杀",
        "不想活",
        "结束生命",
        "伤害自己",
        "suicide",
        "kill myself",
        "end it all",
        "don't want to live",
        "hurt myself",
      ].some((keyword) => text.includes(keyword));
    },
    action: "请立即联系专业人员、伴侣或家人，如有急性风险立刻就医或呼叫急救。",
  },
  {
    id: "user_reported_harm_to_baby",
    type: DANGER_SIGNAL_TYPES.EMERGENCY,
    name: "用户表达伤害宝宝的风险",
    keywords: ["伤害宝宝", "不想要宝宝", "harm the baby", "hurt my baby"],
    detection: (input) => {
      const text = (input || "").toLowerCase();
      return ["伤害宝宝", "不想要宝宝", "harm the baby", "hurt my baby"].some((keyword) =>
        text.includes(keyword)
      );
    },
    action: "请立即联系专业人员并确保身边有人陪同，如存在急性风险立即就医。",
  },
];

/**
 * 合并所有危险信号
 */
const allDangerSignals = {
  diet: dietDangerSignals,
  exercise: exerciseDangerSignals,
  general: generalDangerSignals,
};

/**
 * 检测饮食记录中的危险信号
 */
export function detectDietDangerSignals(records) {
  const detected = [];

  // 检查单条记录的危险信号
  for (const record of records) {
    for (const signal of dietDangerSignals) {
      if (signal.detection(record)) {
        if (!detected.find(d => d.id === signal.id)) {
          detected.push({
            ...signal,
            recordId: record.id,
            detectedAt: new Date().toISOString(),
          });
        }
      }
    }
  }

  // 检查多条记录的危险信号
  for (const signal of dietDangerSignals) {
    if (signal.detection.length > 1) { // 多条记录检测
      if (signal.detection(records)) {
        if (!detected.find(d => d.id === signal.id)) {
          detected.push({
            ...signal,
            detectedAt: new Date().toISOString(),
          });
        }
      }
    }
  }

  return detected;
}

/**
 * 检测运动记录中的危险信号
 */
export function detectExerciseDangerSignals(records) {
  const detected = [];

  for (const record of records) {
    for (const signal of exerciseDangerSignals) {
      if (signal.detection(record)) {
        if (!detected.find(d => d.id === signal.id)) {
          detected.push({
            ...signal,
            recordId: record.id,
            detectedAt: new Date().toISOString(),
          });
        }
      }
    }
  }

  return detected;
}

/**
 * 检测文本输入中的危险信号
 */
export function detectDangerSignalsInText(input) {
  const detected = [];

  for (const signal of generalDangerSignals) {
    if (signal.detection(input)) {
      detected.push({
        ...signal,
        detectedAt: new Date().toISOString(),
      });
    }
  }

  return detected;
}

/**
 * 综合检测所有危险信号
 */
export function detectAllDangerSignals(dietRecords, exerciseRecords) {
  const dietDetected = detectDietDangerSignals(dietRecords || []);
  const exerciseDetected = detectExerciseDangerSignals(exerciseRecords || []);

  const allDetected = [...dietDetected, ...exerciseDetected];

  // 按优先级排序
  const priorityOrder = {
    [DANGER_SIGNAL_TYPES.EMERGENCY]: 0,
    [DANGER_SIGNAL_TYPES.HIGH]: 1,
    [DANGER_SIGNAL_TYPES.MEDIUM]: 2,
    [DANGER_SIGNAL_TYPES.LOW]: 3,
  };

  allDetected.sort((a, b) => {
    return priorityOrder[a.type] - priorityOrder[b.type];
  });

  return {
    signals: allDetected,
    highestType: allDetected.length > 0 ? allDetected[0].type : null,
    emergencyCount: allDetected.filter(s => s.type === DANGER_SIGNAL_TYPES.EMERGENCY).length,
    highCount: allDetected.filter(s => s.type === DANGER_SIGNAL_TYPES.HIGH).length,
  };
}

/**
 * 获取紧急联系信息
 */
export function getEmergencyContacts(profile) {
  // 这里可以扩展为从用户档案中读取
  const defaultContacts = [
    {
      id: "obstetrician",
      name: "产科医生",
      phone: "", // 需要从用户档案读取
      type: "obstetrician",
    },
    {
      id: "hospital",
      name: "医院急诊",
      phone: "120",
      type: "hospital",
    },
    {
      id: "ambulance",
      name: "救护车",
      phone: "120",
      type: "ambulance",
    },
  ];

  return defaultContacts;
}

/**
 * 生成危险信号报告
 */
export function generateDangerSignalReport(detectedSignals, profile) {
  if (!detectedSignals || detectedSignals.length === 0) {
    return null;
  }

  const emergencySignals = detectedSignals.filter(s => s.type === DANGER_SIGNAL_TYPES.EMERGENCY);
  const highSignals = detectedSignals.filter(s => s.type === DANGER_SIGNAL_TYPES.HIGH);
  const mediumSignals = detectedSignals.filter(s => s.type === DANGER_SIGNAL_TYPES.MEDIUM);
  const lowSignals = detectedSignals.filter(s => s.type === DANGER_SIGNAL_TYPES.LOW);

  const contacts = getEmergencyContacts(profile);

  return {
    timestamp: new Date().toISOString(),
    signals: detectedSignals,
    summary: {
      total: detectedSignals.length,
      emergency: emergencySignals.length,
      high: highSignals.length,
      medium: mediumSignals.length,
      low: lowSignals.length,
    },
    action: emergencySignals.length > 0
      ? "检测到紧急信号，请立即就医！"
      : highSignals.length > 0
      ? "检测到高危信号，请密切观察并及时就医"
      : "检测到需要注意的信号，建议休息观察",
    contacts,
  };
}

/**
 * Hook: 危险信号检测
 */
export function useDangerSignalDetection(dietRecords, exerciseRecords) {
  const [alerts, setAlerts] = useLocalStorage("rihea_danger_alerts_v1", []);

  const checkSignals = () => {
    const detection = detectAllDangerSignals(dietRecords, exerciseRecords);

    if (detection.signals.length > 0) {
      // 过滤掉已处理的警报
      const newAlerts = detection.signals.filter(
        signal => !alerts.find(a => a.id === signal.id)
      );

      if (newAlerts.length > 0) {
        const updatedAlerts = [...newAlerts, ...alerts];
        setAlerts(updatedAlerts);

        return {
          hasNewAlerts: true,
          alerts: newAlerts,
          allAlerts: detection,
        };
      }
    }

    return {
      hasNewAlerts: false,
      alerts: [],
      allAlerts: detection,
    };
  };

  const markAlertAsRead = (alertId) => {
    const updatedAlerts = alerts.filter(a => a.id !== alertId);
    setAlerts(updatedAlerts);
  };

  const clearAllAlerts = () => {
    setAlerts([]);
  };

  return {
    alerts,
    checkSignals,
    markAlertAsRead,
    clearAllAlerts,
  };
}

/**
 * 危险信号颜色配置
 */
export const dangerSignalColors = {
  [DANGER_SIGNAL_TYPES.EMERGENCY]: {
    bg: "bg-red-50",
    border: "border-red-300",
    text: "text-red-700",
    icon: "🚨",
  },
  [DANGER_SIGNAL_TYPES.HIGH]: {
    bg: "bg-orange-50",
    border: "border-orange-300",
    text: "text-orange-700",
    icon: "⚠️",
  },
  [DANGER_SIGNAL_TYPES.MEDIUM]: {
    bg: "bg-yellow-50",
    border: "border-yellow-300",
    text: "text-yellow-700",
    icon: "⚡",
  },
  [DANGER_SIGNAL_TYPES.LOW]: {
    bg: "bg-blue-50",
    border: "border-blue-300",
    text: "text-blue-700",
    icon: "ℹ️",
  },
};
