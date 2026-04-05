/**
 * 运动内容库
 * 包含孕期各阶段的运动建议、运动库、安全提示等
 */

// 孕期阶段
export const PREGNANCY_TRIMESTERS = {
  FIRST: "first",      // 孕早期 (1-12周)
  SECOND: "second",    // 孕中期 (13-27周)
  THIRD: "third",      // 孕晚期 (28-40周)
};

// 运动强度
export const EXERCISE_INTENSITY = {
  LOW: "low",          // 低强度
  MEDIUM: "medium",     // 中等强度
  HIGH: "high",        // 高强度（孕中期以后不推荐）
};

// 运动基础
export const FITNESS_LEVELS = {
  BEGINNER: "beginner",        // 无运动基础
  INTERMEDIATE: "intermediate", // 有一定基础
  ADVANCED: "advanced",        // 运动基础良好
};

// 运动类型
export const EXERCISE_TYPES = {
  AEROBIC: "aerobic",       // 有氧运动
  STRENGTH: "strength",      // 力量训练
  STRETCHING: "stretching",  // 拉伸运动
  YOGA: "yoga",            // 瑜伽
  SWIMMING: "swimming",     // 游泳
  WALKING: "walking",       // 散步
  PILATES: "pilates",       // 普拉提
  BREATHING: "breathing",   // 呼吸训练
};

// 运动库
export const EXERCISE_DATABASE = {
  // 有氧运动
  "walking": {
    id: "walking",
    name: "散步",
    nameEn: "Walking",
    type: EXERCISE_TYPES.WALKING,
    category: EXERCISE_TYPES.AEROBIC,
    defaultDuration: 30,
    intensity: EXERCISE_INTENSITY.LOW,
    caloriesPerMinute: 3.5,
    difficulty: "easy",
    pregnancySafe: true,
    allowedTrimesters: [PREGNANCY_TRIMESTERS.FIRST, PREGNANCY_TRIMESTERS.SECOND, PREGNANCY_TRIMESTERS.THIRD],
    instructions: "保持对话不喘气的速度，可以正常说话",
    precautions: [
      "穿舒适的运动鞋",
      "避免不平路面",
      "孕晚期避免长时间站立",
      "天气过热时避免户外运动",
    ],
    benefits: ["促进血液循环", "控制体重", "缓解压力", "改善睡眠"],
    contraindications: ["前置胎盘", "先兆流产", "严重水肿"],
    equipment: ["运动鞋"],
  },
  "swimming": {
    id: "swimming",
    name: "游泳",
    nameEn: "Swimming",
    type: EXERCISE_TYPES.SWIMMING,
    category: EXERCISE_TYPES.AEROBIC,
    defaultDuration: 30,
    intensity: EXERCISE_INTENSITY.MEDIUM,
    caloriesPerMinute: 6,
    difficulty: "medium",
    pregnancySafe: true,
    allowedTrimesters: [PREGNANCY_TRIMESTERS.FIRST, PREGNANCY_TRIMESTERS.SECOND, PREGNANCY_TRIMESTERS.THIRD],
    instructions: "选择蛙泳或自由泳，避免过于激烈的动作",
    precautions: [
      "水温控制在26-28℃",
      "避免跳水",
      "避免水中停留过久",
      "感觉不适立即上岸",
    ],
    benefits: ["全身运动", "减轻关节压力", "缓解水肿", "改善心肺功能"],
    contraindications: ["早孕期出血", "子宫过度敏感"],
    equipment: ["泳衣", "泳帽", "护目镜"],
  },
  "cycling_indoor": {
    id: "cycling_indoor",
    name: "室内骑行",
    nameEn: "Indoor Cycling",
    type: EXERCISE_TYPES.AEROBIC,
    category: EXERCISE_TYPES.AEROBIC,
    defaultDuration: 25,
    intensity: EXERCISE_INTENSITY.MEDIUM,
    caloriesPerMinute: 5,
    difficulty: "medium",
    pregnancySafe: true,
    allowedTrimesters: [PREGNANCY_TRIMESTERS.FIRST, PREGNANCY_TRIMESTERS.SECOND],
    instructions: "调整座椅高度，避免腰部压力过大",
    precautions: [
      "孕晚期因重心变化不建议",
      "保持心率在安全范围内",
      "避免剧烈踩踏",
    ],
    benefits: ["增强心肺功能", "锻炼腿部力量", "消耗热量"],
    contraindications: ["孕晚期（重心不稳）", "孕期高血压"],
    equipment: ["室内自行车"],
  },

  // 瑜伽
  "yoga_prenatal": {
    id: "yoga_prenatal",
    name: "孕妇瑜伽",
    nameEn: "Prenatal Yoga",
    type: EXERCISE_TYPES.YOGA,
    category: EXERCISE_TYPES.STRETCHING,
    defaultDuration: 30,
    intensity: EXERCISE_INTENSITY.LOW,
    caloriesPerMinute: 2.5,
    difficulty: "easy",
    pregnancySafe: true,
    allowedTrimesters: [PREGNANCY_TRIMESTERS.FIRST, PREGNANCY_TRIMESTERS.SECOND, PREGNANCY_TRIMESTERS.THIRD],
    instructions: "选择专门的孕妇瑜伽课程，跟随专业老师",
    precautions: [
      "避免倒立动作",
      "避免过度扭转",
      "孕24周后避免平躺仰卧位",
      "如有不适立即停止",
    ],
    benefits: ["缓解孕期不适", "改善睡眠", "增强柔韧性", "缓解压力"],
    contraindications: ["先兆流产", "孕期出血", "严重妊娠糖尿病"],
    equipment: ["瑜伽垫", "舒适的服装"],
  },
  "stretching_neck": {
    id: "stretching_neck",
    name: "颈部拉伸",
    nameEn: "Neck Stretching",
    type: EXERCISE_TYPES.STRETCHING,
    category: EXERCISE_TYPES.STRETCHING,
    defaultDuration: 10,
    intensity: EXERCISE_INTENSITY.LOW,
    caloriesPerMinute: 1.5,
    difficulty: "easy",
    pregnancySafe: true,
    allowedTrimesters: [PREGNANCY_TRIMESTERS.FIRST, PREGNANCY_TRIMESTERS.SECOND, PREGNANCY_TRIMESTERS.THIRD],
    instructions: "缓慢转动头部，左右各5次",
    precautions: [
      "动作要缓慢",
      "避免用力过猛",
      "如有眩晕立即停止",
    ],
    benefits: ["缓解颈肩紧张", "改善姿势"],
    contraindications: [],
    equipment: [],
  },

  // 力量训练
  "squat_prenatal": {
    id: "squat_prenatal",
    name: "孕妇深蹲",
    nameEn: "Prenatal Squat",
    type: EXERCISE_TYPES.STRENGTH,
    category: EXERCISE_TYPES.STRENGTH,
    defaultDuration: 15,
    intensity: EXERCISE_INTENSITY.MEDIUM,
    caloriesPerMinute: 4,
    difficulty: "medium",
    pregnancySafe: true,
    allowedTrimesters: [PREGNANCY_TRIMESTERS.SECOND],
    instructions: "双脚分开与肩同宽，缓慢下蹲，膝盖不超过脚尖",
    precautions: [
      "避免完全蹲到底",
      "保持背部挺直",
      "孕晚期不建议",
      "如有盆底肌问题需医生同意",
    ],
    benefits: ["增强腿部力量", "促进分娩", "改善盆底肌"],
    contraindications: ["孕晚期", "盆底肌松弛", "先兆流产"],
    equipment: ["可选：哑铃（轻重量）"],
  },
  "pelvic_floor": {
    id: "pelvic_floor",
    name: "凯格尔运动",
    nameEn: "Kegel Exercises",
    type: EXERCISE_TYPES.STRENGTH,
    category: EXERCISE_TYPES.STRENGTH,
    defaultDuration: 10,
    intensity: EXERCISE_INTENSITY.LOW,
    caloriesPerMinute: 1,
    difficulty: "easy",
    pregnancySafe: true,
    allowedTrimesters: [PREGNANCY_TRIMESTERS.FIRST, PREGNANCY_TRIMESTERS.SECOND, PREGNANCY_TRIMESTERS.THIRD],
    instructions: "收缩盆底肌5秒，放松10秒，重复10-15次",
    precautions: [
      "避免收缩腹部和大腿肌肉",
      "排空膀胱后再做",
      "每天可进行多次",
    ],
    benefits: ["增强盆底肌", "预防产后漏尿", "促进分娩"],
    contraindications: ["急性尿路感染"],
    equipment: [],
  },

  // 普拉提
  "pilates_prenatal": {
    id: "pilates_prenatal",
    name: "孕妇普拉提",
    nameEn: "Prenatal Pilates",
    type: EXERCISE_TYPES.PILATES,
    category: EXERCISE_TYPES.STRENGTH,
    defaultDuration: 25,
    intensity: EXERCISE_INTENSITY.LOW,
    caloriesPerMinute: 3,
    difficulty: "medium",
    pregnancySafe: true,
    allowedTrimesters: [PREGNANCY_TRIMESTERS.SECOND],
    instructions: "选择专门的孕妇普拉提课程，注意避免平躺位",
    precautions: [
      "孕24周后避免平躺仰卧位",
      "避免核心过度收缩",
      "动作幅度要小",
    ],
    benefits: ["增强核心稳定性", "改善姿势", "缓解腰背痛"],
    contraindications: ["孕晚期", "盆底肌问题"],
    equipment: ["普拉提垫"],
  },

  // 呼吸训练
  "breathing_lamaze": {
    id: "breathing_lamaze",
    name: "拉梅兹呼吸法",
    nameEn: "Lamaze Breathing",
    type: EXERCISE_TYPES.BREATHING,
    category: EXERCISE_TYPES.STRETCHING,
    defaultDuration: 15,
    intensity: EXERCISE_INTENSITY.LOW,
    caloriesPerMinute: 1,
    difficulty: "easy",
    pregnancySafe: true,
    allowedTrimesters: [PREGNANCY_TRIMESTERS.SECOND, PREGNANCY_TRIMESTERS.THIRD],
    instructions: "学习不同的呼吸节奏，为分娩做准备",
    precautions: [
      "练习时要放松",
      "避免过度换气",
      "最好有专业人士指导",
    ],
    benefits: ["缓解疼痛", "放松身心", "为分娩做准备"],
    contraindications: [],
    equipment: [],
  },
  "deep_breathing": {
    id: "deep_breathing",
    name: "深呼吸练习",
    nameEn: "Deep Breathing",
    type: EXERCISE_TYPES.BREATHING,
    category: EXERCISE_TYPES.STRETCHING,
    defaultDuration: 10,
    intensity: EXERCISE_INTENSITY.LOW,
    caloriesPerMinute: 0.5,
    difficulty: "easy",
    pregnancySafe: true,
    allowedTrimesters: [PREGNANCY_TRIMESTERS.FIRST, PREGNANCY_TRIMESTERS.SECOND, PREGNANCY_TRIMESTERS.THIRD],
    instructions: "缓慢深吸气，屏息2秒，缓慢呼气",
    precautions: [
      "呼吸要均匀缓慢",
      "避免过度用力",
    ],
    benefits: ["缓解压力", "改善睡眠", "增加氧气供应"],
    contraindications: [],
    equipment: [],
  },
};

// 运动计划模板（按孕周）
export const WEEKLY_PLANS = {
  firstTrimester: {
    weekRange: [1, 12],
    trimester: PREGNANCY_TRIMESTERS.FIRST,
    target: "每周3-4次温和运动，累计90-120分钟",
    weeklyTemplate: [
      {
        day: "周一",
        exercises: [
          { exerciseId: "walking", duration: 20 },
          { exerciseId: "stretching_neck", duration: 5 },
        ],
      },
      {
        day: "周二",
        exercises: [
          { exerciseId: "deep_breathing", duration: 10 },
        ],
      },
      {
        day: "周三",
        exercises: [
          { exerciseId: "walking", duration: 20 },
          { exerciseId: "pelvic_floor", duration: 5 },
        ],
      },
      {
        day: "周四",
        exercises: [],
      },
      {
        day: "周五",
        exercises: [
          { exerciseId: "yoga_prenatal", duration: 20 },
        ],
      },
      {
        day: "周六",
        exercises: [
          { exerciseId: "walking", duration: 25 },
        ],
      },
      {
        day: "周日",
        exercises: [],
      },
    ],
    safetyAlerts: [
      "孕早期胚胎着床期，避免剧烈运动",
      "如有腹痛、出血，立即停止并就医",
      "严重孕吐时可暂停运动",
    ],
  },
  secondTrimester: {
    weekRange: [13, 27],
    trimester: PREGNANCY_TRIMESTERS.SECOND,
    target: "每周4-5次中等强度运动，累计150分钟",
    weeklyTemplate: [
      {
        day: "周一",
        exercises: [
          { exerciseId: "walking", duration: 30 },
        ],
      },
      {
        day: "周二",
        exercises: [
          { exerciseId: "yoga_prenatal", duration: 30 },
        ],
      },
      {
        day: "周三",
        exercises: [
          { exerciseId: "swimming", duration: 30 },
        ],
      },
      {
        day: "周四",
        exercises: [
          { exerciseId: "squat_prenatal", duration: 15 },
          { exerciseId: "pelvic_floor", duration: 10 },
        ],
      },
      {
        day: "周五",
        exercises: [
          { exerciseId: "walking", duration: 30 },
        ],
      },
      {
        day: "周六",
        exercises: [
          { exerciseId: "pilates_prenatal", duration: 25 },
        ],
      },
      {
        day: "周日",
        exercises: [
          { exerciseId: "stretching_neck", duration: 10 },
        ],
      },
    ],
    safetyAlerts: [
      "孕中期身体状态稳定，可适当增加运动强度",
      "注意监测心率，保持在安全范围内",
      "孕24周后避免平躺仰卧位运动",
    ],
  },
  thirdTrimester: {
    weekRange: [28, 40],
    trimester: PREGNANCY_TRIMESTERS.THIRD,
    target: "每周3-4次温和运动，重点在呼吸和盆底肌训练",
    weeklyTemplate: [
      {
        day: "周一",
        exercises: [
          { exerciseId: "walking", duration: 20 },
        ],
      },
      {
        day: "周二",
        exercises: [
          { exerciseId: "breathing_lamaze", duration: 15 },
          { exerciseId: "pelvic_floor", duration: 10 },
        ],
      },
      {
        day: "周三",
        exercises: [
          { exerciseId: "yoga_prenatal", duration: 25 },
        ],
      },
      {
        day: "周四",
        exercises: [],
      },
      {
        day: "周五",
        exercises: [
          { exerciseId: "walking", duration: 20 },
        ],
      },
      {
        day: "周六",
        exercises: [
          { exerciseId: "deep_breathing", duration: 10 },
        ],
      },
      {
        day: "周日",
        exercises: [],
      },
    ],
    safetyAlerts: [
      "孕晚期重心变化，避免剧烈运动和容易摔倒的运动",
      "避免平躺仰卧位，采取侧卧或坐姿",
      "关注身体信号，如有不适立即停止",
      "为分娩做准备，重点训练呼吸和盆底肌",
    ],
  },
};

// 运动禁忌
export const EXERCISE_CONTRAINDICATIONS = {
  // 孕期任何时候都应避免的运动
  absolute: [
    {
      id: "contact_sports",
      name: "接触性运动",
      nameEn: "Contact Sports",
      examples: ["篮球", "足球", "排球"],
      reason: "有腹部受伤风险",
    },
    {
      id: "high_impact",
      name: "高冲击运动",
      nameEn: "High Impact Sports",
      examples: ["跑步", "跳跃", "跳绳"],
      reason: "可能导致关节压力过大",
      trimesters: [PREGNANCY_TRIMESTERS.FIRST, PREGNANCY_TRIMESTERS.THIRD],
    },
    {
      id: "scuba_diving",
      name: "潜水",
      nameEn: "Scuba Diving",
      examples: [],
      reason: "可能影响胎儿",
    },
    {
      id: "hot_yoga",
      name: "热瑜伽",
      nameEn: "Hot Yoga",
      examples: [],
      reason: "过热可能影响胎儿",
    },
    {
      id: "supine_exercises",
      name: "平躺仰卧位运动",
      nameEn: "Supine Exercises",
      examples: ["仰卧起坐", "平板支撑"],
      reason: "孕24周后可能压迫下腔静脉",
      trimesters: [PREGNANCY_TRIMESTERS.THIRD],
    },
  ],
  // 根据健康状况应避免的运动
  conditional: [
    {
      id: "placenta_previa",
      name: "前置胎盘",
      nameEn: "Placenta Previa",
      prohibited: ["跑跳", "深蹲", "游泳"],
      allowed: ["轻微散步", "呼吸训练"],
      reason: "有出血风险",
    },
    {
      id: "threatened_abortion",
      name: "先兆流产",
      nameEn: "Threatened Abortion",
      prohibited: ["所有运动"],
      allowed: ["卧床休息"],
      reason: "需严格卧床休息",
    },
    {
      id: "cervical_incompetence",
      name: "宫颈机能不全",
      nameEn: "Cervical Incompetence",
      prohibited: ["跑跳", "深蹲", "游泳"],
      allowed: ["轻微散步"],
      reason: "有流产风险",
    },
    {
      id: "preeclampsia",
      name: "妊娠高血压",
      nameEn: "Preeclampsia",
      prohibited: ["中等强度以上运动"],
      allowed: ["轻微散步", "呼吸训练"],
      reason: "需要控制血压",
    },
    {
      id: "gestational_diabetes",
      name: "妊娠糖尿病",
      nameEn: "Gestational Diabetes",
      prohibited: ["高强度运动"],
      allowed: ["中等强度有氧运动", "散步"],
      reason: "需要控制血糖，但避免过度运动",
    },
  ],
};

// 危险信号（需要立即停止运动并就医）
export const DANGER_SIGNALS = {
  name: "运动时危险信号",
  signals: [
    {
      id: "vaginal_bleeding",
      name: "阴道出血",
      nameEn: "Vaginal Bleeding",
      priority: "emergency",
      action: "立即停止运动，立即就医",
    },
    {
      id: "severe_abdominal_pain",
      name: "持续性腹痛",
      nameEn: "Severe Abdominal Pain",
      priority: "emergency",
      action: "立即停止运动，立即就医",
    },
    {
      id: "dizziness_fainting",
      name: "头晕或昏厥",
      nameEn: "Dizziness or Fainting",
      priority: "high",
      action: "立即停止运动，坐下休息，如不缓解就医",
    },
    {
      id: "chest_pain",
      name: "胸痛",
      nameEn: "Chest Pain",
      priority: "emergency",
      action: "立即停止运动，立即就医",
    },
    {
      id: "reduced_fetal_movement",
      name: "胎动明显减少",
      nameEn: "Reduced Fetal Movement",
      priority: "high",
      action: "停止运动，监测胎动，如不改善就医",
    },
    {
      id: "leakage_fluid",
      name: "阴道流出液体",
      nameEn: "Fluid Leakage",
      priority: "emergency",
      action: "立即停止运动，立即就医（可能破水）",
    },
    {
      id: "shortness_of_breath",
      name: "严重呼吸困难",
      nameEn: "Severe Shortness of Breath",
      priority: "high",
      action: "立即停止运动，坐下休息，如不缓解就医",
    },
    {
      id: "headache_severe",
      name: "严重头痛",
      nameEn: "Severe Headache",
      priority: "high",
      action: "停止运动，监测血压，必要时就医",
    },
    {
      id: "vision_changes",
      name: "视力模糊或出现光斑",
      nameEn: "Vision Changes",
      priority: "high",
      action: "停止运动，监测血压，必要时就医",
    },
    {
      id: "leg_swelling",
      name: "单腿或双腿严重肿胀",
      nameEn: "Leg Swelling",
      priority: "medium",
      action: "停止运动，休息，抬高腿，如持续就医",
    },
    {
      id: "contractions",
      name: "规律宫缩",
      nameEn: "Regular Contractions",
      priority: "emergency",
      action: "立即停止运动，立即就医（可能早产）",
    },
  ],
};

// 运动建议按风险等级
export const RECOMMENDATIONS_BY_RISK = {
  low: {
    description: "低风险孕妇，可进行标准推荐的运动方案",
    intensity: "低到中等强度",
    frequency: "每周3-5次",
    specialNotes: ["保持运动习惯", "注意监测身体信号"],
  },
  medium: {
    description: "中等风险孕妇，需要适当降低运动强度",
    intensity: "低强度为主，可适当中等强度",
    frequency: "每周3-4次",
    specialNotes: ["降低运动强度", "增加休息频率", "避免剧烈运动"],
  },
  high: {
    description: "高风险孕妇，运动需在医生指导下进行",
    intensity: "仅推荐温和运动",
    frequency: "根据医生建议",
    specialNotes: [
      "强制医生审核",
      "仅推荐温和运动（散步、简单拉伸）",
      "监测胎动和身体信号",
      "如有任何不适立即停止",
    ],
  },
};

// 运动基础适配
export const ADAPTATIONS_BY_LEVEL = {
  beginner: {
    description: "无运动基础，从最简单的运动开始",
    startingPlan: {
      week1: {
        duration: 5,
        frequency: "3次/周",
        exercises: ["walking"],
      },
      week2: {
        duration: 10,
        frequency: "3次/周",
        exercises: ["walking", "deep_breathing"],
      },
      week3: {
        duration: 15,
        frequency: "4次/周",
        exercises: ["walking", "deep_breathing", "stretching_neck"],
      },
    },
    progression: "每周增加5分钟时长",
  },
  intermediate: {
    description: "有运动基础，可直接进入标准推荐",
    startingPlan: {
      duration: 20,
      frequency: "4次/周",
      exercises: ["walking", "yoga_prenatal"],
    },
    progression: "每2周评估一次，根据感受调整",
  },
  advanced: {
    description: "运动基础良好，需注意避免孕期不适合的剧烈运动",
    startingPlan: {
      duration: 30,
      frequency: "4-5次/周",
      exercises: ["walking", "yoga_prenatal", "swimming"],
    },
    progression: "根据身体感受调整，避免过度",
    specialNotes: [
      "避免高强度运动",
      "避免跑跳和剧烈动作",
      "重点在于维持而非挑战",
    ],
  },
};

// 导出所有内容
export const fitnessContent = {
  trimesters: PREGNANCY_TRIMESTERS,
  intensity: EXERCISE_INTENSITY,
  levels: FITNESS_LEVELS,
  types: EXERCISE_TYPES,
  exerciseDatabase: EXERCISE_DATABASE,
  weeklyPlans: WEEKLY_PLANS,
  contraindications: EXERCISE_CONTRAINDICATIONS,
  dangerSignals: DANGER_SIGNALS,
  riskRecommendations: RECOMMENDATIONS_BY_RISK,
  levelAdaptations: ADAPTATIONS_BY_LEVEL,
};
