// Expert Database

export const EXPERT_TYPES = {
  PSYCHOLOGIST: "psychologist",  // 心理咨询师
  OBSTETRICIAN: "obstetrician",   // 产科医生
  NUTRITIONIST: "nutritionist",   // 营养师
  MIDWIFE: "midwife"              // 助产士
};

export const EXPERTS_ZH = [
  {
    id: "exp-001",
    name: "李慧心",
    title: "心理咨询师",
    type: EXPERT_TYPES.PSYCHOLOGIST,
    specialties: ["孕期焦虑", "产后抑郁", "情绪管理"],
    experience: "8年",
    rating: 4.9,
    consultationMethods: ["在线咨询", "语音通话"],
    languages: ["中文", "英文"],
    description: "专注孕产期心理健康，擅长认知行为疗法和正念治疗。",
    tags: ["高评分", "快速响应"]
  },
  {
    id: "exp-002",
    name: "王雅文",
    title: "产科医生",
    type: EXPERT_TYPES.OBSTETRICIAN,
    specialties: ["孕期保健", "高危妊娠", "产前诊断"],
    experience: "15年",
    rating: 4.8,
    consultationMethods: ["在线咨询"],
    languages: ["中文"],
    description: "在三甲医院工作，处理过多例高危妊娠。",
    tags: ["经验丰富", "权威医生"]
  },
  {
    id: "exp-003",
    name: "陈晓红",
    title: "营养师",
    type: EXPERT_TYPES.NUTRITIONIST,
    specialties: ["孕期营养", "产后恢复", "体重管理"],
    experience: "6年",
    rating: 4.7,
    consultationMethods: ["在线咨询"],
    languages: ["中文", "英文"],
    description: "注册营养师，专注孕产期科学饮食指导。",
    tags: ["科学饮食", "个性化方案"]
  },
  {
    id: "exp-004",
    name: "张美玲",
    title: "助产士",
    type: EXPERT_TYPES.MIDWIFE,
    specialties: ["分娩准备", "产后护理", "母乳喂养"],
    experience: "10年",
    rating: 4.9,
    consultationMethods: ["在线咨询", "语音通话"],
    languages: ["中文"],
    description: "温柔耐心的助产士，帮助妈妈们度过孕产期。",
    tags: ["温柔耐心", "口碑好评"]
  },
  {
    id: "exp-005",
    name: "林思宇",
    title: "心理咨询师",
    type: EXPERT_TYPES.PSYCHOLOGIST,
    specialties: ["夫妻关系", "产后心理", "亲子关系"],
    experience: "5年",
    rating: 4.8,
    consultationMethods: ["在线咨询", "视频通话"],
    languages: ["中文"],
    description: "擅长家庭系统治疗，帮助建立健康的家庭关系。",
    tags: ["家庭咨询", "专业认证"]
  }
];

export const EXPERTS_EN = [
  {
    id: "exp-001",
    name: "Dr. Li Huixin",
    title: "Psychologist",
    type: EXPERT_TYPES.PSYCHOLOGIST,
    specialties: ["Pregnancy Anxiety", "Postpartum Depression", "Emotional Management"],
    experience: "8 years",
    rating: 4.9,
    consultationMethods: ["Online Chat", "Voice Call"],
    languages: ["Chinese", "English"],
    description: "Specialized in perinatal mental health, expert in CBT and mindfulness.",
    tags: ["Top Rated", "Fast Response"]
  },
  {
    id: "exp-002",
    name: "Dr. Wang Yawen",
    title: "Obstetrician",
    type: EXPERT_TYPES.OBSTETRICIAN,
    specialties: ["Prenatal Care", "High-Risk Pregnancy", "Prenatal Diagnosis"],
    experience: "15 years",
    rating: 4.8,
    consultationMethods: ["Online Chat"],
    languages: ["Chinese"],
    description: "Working at top-tier hospital, experienced in high-risk pregnancies.",
    tags: ["Experienced", "Authoritative"]
  },
  {
    id: "exp-003",
    name: "Chen Xiaohong",
    title: "Nutritionist",
    type: EXPERT_TYPES.NUTRITIONIST,
    specialties: ["Pregnancy Nutrition", "Postpartum Recovery", "Weight Management"],
    experience: "6 years",
    rating: 4.7,
    consultationMethods: ["Online Chat"],
    languages: ["Chinese", "English"],
    description: "Registered nutritionist, focused on scientific dietary guidance for pregnancy.",
    tags: ["Scientific", "Personalized"]
  },
  {
    id: "exp-004",
    name: "Zhang Meiling",
    title: "Midwife",
    type: EXPERT_TYPES.MIDWIFE,
    specialties: ["Birth Preparation", "Postpartum Care", "Breastfeeding"],
    experience: "10 years",
    rating: 4.9,
    consultationMethods: ["Online Chat", "Voice Call"],
    languages: ["Chinese"],
    description: "Gentle and patient midwife, helping moms through pregnancy and birth.",
    tags: ["Gentle", "Well Reviewed"]
  },
  {
    id: "exp-005",
    name: "Lin Siyu",
    title: "Psychologist",
    type: EXPERT_TYPES.PSYCHOLOGIST,
    specialties: ["Couple Relationship", "Postpartum Mental Health", "Parent-Child Bonding"],
    experience: "5 years",
    rating: 4.8,
    consultationMethods: ["Online Chat", "Video Call"],
    languages: ["Chinese"],
    description: "Expert in family systems therapy, helping build healthy family relationships.",
    tags: ["Family Therapy", "Certified"]
  }
];

export const EXPERT_TYPE_LABELS = {
  zh: {
    [EXPERT_TYPES.PSYCHOLOGIST]: "心理咨询师",
    [EXPERT_TYPES.OBSTETRICIAN]: "产科医生",
    [EXPERT_TYPES.NUTRITIONIST]: "营养师",
    [EXPERT_TYPES.MIDWIFE]: "助产士",
  },
  en: {
    [EXPERT_TYPES.PSYCHOLOGIST]: "Psychologist",
    [EXPERT_TYPES.OBSTETRICIAN]: "Obstetrician",
    [EXPERT_TYPES.NUTRITIONIST]: "Nutritionist",
    [EXPERT_TYPES.MIDWIFE]: "Midwife",
  }
};

/**
 * Get experts by type
 * @param {string} type - Expert type
 * @param {string} lang - Language code (zh or en)
 * @returns {Array} Array of experts
 */
export function getExpertsByType(type, lang = "zh") {
  const experts = lang === "en" ? EXPERTS_EN : EXPERTS_ZH;
  return experts.filter(exp => exp.type === type);
}

/**
 * Get all experts
 * @param {string} lang - Language code (zh or en)
 * @returns {Array} Array of all experts
 */
export function getAllExperts(lang = "zh") {
  return lang === "en" ? EXPERTS_EN : EXPERTS_ZH;
}

/**
 * Match experts based on risk level and pregnancy stage
 * @param {string} riskLevel - Risk level (low, medium, high)
 * @param {number} pregnancyWeek - Current pregnancy week
 * @param {string} lang - Language code (zh or en)
 * @returns {Array} Array of recommended experts
 */
export function matchExperts(riskLevel, pregnancyWeek, lang = "zh") {
  const allExperts = getAllExperts(lang);
  const recommendedTypes = {
    low: [EXPERT_TYPES.MIDWIFE, EXPERT_TYPES.NUTRITIONIST],
    medium: [EXPERT_TYPES.PSYCHOLOGIST, EXPERT_TYPES.MIDWIFE],
    high: [EXPERT_TYPES.PSYCHOLOGIST, EXPERT_TYPES.OBSTETRICIAN]
  };

  const types = recommendedTypes[riskLevel] || recommendedTypes.low;

  // Return up to 3 experts prioritized by recommended types
  const prioritizedExperts = allExperts.filter(exp =>
    types.includes(exp.type)
  );

  // If not enough experts of recommended types, add others
  const otherExperts = allExperts.filter(exp =>
    !types.includes(exp.type)
  );

  return [...prioritizedExperts, ...otherExperts].slice(0, 5);
}

/**
 * Get expert by ID
 * @param {string} id - Expert ID
 * @param {string} lang - Language code (zh or en)
 * @returns {Object|null} Expert object or null
 */
export function getExpertById(id, lang = "zh") {
  const experts = lang === "en" ? EXPERTS_EN : EXPERTS_ZH;
  return experts.find(exp => exp.id === id) || null;
}

export default {
  EXPERT_TYPES,
  EXPERTS_ZH,
  EXPERTS_EN,
  EXPERT_TYPE_LABELS,
  getExpertsByType,
  getAllExperts,
  matchExperts,
  getExpertById
};
