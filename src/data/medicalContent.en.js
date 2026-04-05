// Medical Knowledge Base Content - English Version

export const MEDICAL_CATEGORIES = {
  FIRST_TRIMESTER: "first",    // First trimester (1-12 weeks)
  SECOND_TRIMESTER: "second",  // Second trimester (13-27 weeks)
  THIRD_TRIMESTER: "third",    // Third trimester (28-40 weeks)
  POSTPARTUM: "postpartum",    // Postpartum period
  EMERGENCY: "emergency"       // Emergency situations
};

export const MEDICAL_ARTICLES_EN = [
  // First Trimester
  {
    id: "first-001",
    category: "first",
    title: "Mood Swings in Early Pregnancy Are Normal",
    summary: "Hormonal changes cause emotional fluctuations, this is a natural body response",
    content: "In the first trimester (1-12 weeks), estrogen and progesterone levels change dramatically, affecting neurotransmitters that regulate mood. Common symptoms include: sudden mood changes, easy crying, increased anxiety.\n\nCoping strategies:\n1. Accept your emotional fluctuations, don't blame yourself\n2. Maintain regular sleep schedule\n3. Moderate exercise like walking, yoga\n4. Communicate with partner and family for support",
    tags: ["Mood", "Hormones", "Normal"],
    weekRange: [1, 12]
  },
  {
    id: "first-002",
    category: "first",
    title: "Morning Sickness and Emotional Management",
    summary: "Morning sickness not only affects the body but also emotional state",
    content: "About 80% of pregnant women experience varying degrees of morning sickness in early pregnancy. Persistent nausea and discomfort can lead to fatigue, anxiety and low mood.\n\nRelief methods:\n1. Eat small frequent meals, avoid empty stomach\n2. Eat a few crackers before getting out of bed\n3. Avoid greasy and irritating foods\n4. Seek medical attention if symptoms are severe",
    tags: ["Morning Sickness", "Discomfort", "Physical"],
    weekRange: [1, 12]
  },
  {
    id: "first-003",
    category: "first",
    title: "Common First Trimester Anxiety",
    summary: "Anxiety about fetal development and miscarriage risk",
    content: "Common early pregnancy concerns: worry about fetal development, fear of miscarriage. These worries are normal, but excessive anxiety can affect mother and baby health.\n\nKnowledge:\n- Most early miscarriages are natural selection due to chromosomal abnormalities, unrelated to mother's behavior\n- Regular prenatal checkups, doctors will monitor fetal development\n- Avoid excessive online research, rely on professional medical advice",
    tags: ["Anxiety", "Worry", "Common Issues"],
    weekRange: [1, 12]
  },

  // Second Trimester
  {
    id: "second-001",
    category: "second",
    title: "Second Trimester Emotional Stability Period",
    summary: "Hormone levels stabilize, mood is relatively calm",
    content: "The second trimester (13-27 weeks) is called the \"honeymoon period.\" Hormone levels stabilize, morning sickness decreases, and energy returns. This is the best emotional period.\n\nSuggestions:\n1. Use this time to establish healthy habits\n2. Start prenatal education to bond with baby\n3. Prepare parenting knowledge to boost confidence\n4. Moderate socializing to maintain positive mindset",
    tags: ["Honeymoon", "Stability", "Good Time"],
    weekRange: [13, 27]
  },
  {
    id: "second-002",
    category: "second",
    title: "Body Changes and Self-Identity",
    summary: "Accept pregnancy body changes, build positive self-image",
    content: "As the belly grows, body shape changes. Some women feel uneasy about their changing figure, which can affect emotional state.\n\nCoping strategies:\n1. Recognize this is a normal process of nurturing life\n2. Wear comfortable maternity clothes to boost confidence\n3. Focus on baby health, not figure\n4. Share with other pregnant friends for support",
    tags: ["Body Changes", "Self-Image", "Acceptance"],
    weekRange: [13, 27]
  },
  {
    id: "second-003",
    category: "second",
    title: "Fetal Movement and Emotional Bonding",
    summary: "Feeling fetal movement is an important moment for mother-child bonding",
    content: "Fetal movement is usually felt around 18-20 weeks. Feeling your baby move for the first time creates strong emotional connection and happiness.\n\nSuggestions:\n1. Record fetal movement times to understand baby's patterns\n2. Share this joy with family\n3. Gently touch belly and talk to baby\n4. This connection helps relieve anxiety",
    tags: ["Fetal Movement", "Bonding", "Happiness"],
    weekRange: [13, 27]
  },

  // Third Trimester
  {
    id: "third-001",
    category: "third",
    title: "Coping with Labor Anxiety",
    summary: "Fear and anxiety about labor are very common in late pregnancy",
    content: "Late pregnancy (28-40 weeks) nears due date. Fear of labor, pain, and unknown outcomes can easily cause anxiety. This is a completely normal psychological response.\n\nCoping methods:\n1. Attend prenatal classes to understand labor process\n2. Create a birth plan for sense of control\n3. Practice breathing and relaxation techniques\n4. Discuss labor methods and pain management with doctor",
    tags: ["Labor", "Fear", "Anxiety"],
    weekRange: [28, 40]
  },
  {
    id: "third-002",
    category: "third",
    title: "Physical Discomfort and Sleep Difficulties",
    summary: "Late pregnancy physical burden increases, needing more rest and care",
    content: "Common late pregnancy discomfort: frequent urination, back pain, breathing difficulty, trouble falling asleep. These physical discomforts directly affect mood.\n\nRelief suggestions:\n1. Sleep on left side to improve circulation\n2. Use pregnancy pillows for support\n3. Prenatal yoga to relieve back pain\n4. Establish bedtime relaxation rituals",
    tags: ["Discomfort", "Sleep", "Late"],
    weekRange: [28, 40]
  },
  {
    id: "third-003",
    category: "third",
    title: "Preparing for Baby",
    summary: "Preparation work can shift anxiety and boost confidence",
    content: "Taking practical action to prepare for baby can relieve anxiety and boost confidence as parents.\n\nPreparations:\n1. Prepare baby supplies and nursery\n2. Learn newborn care knowledge\n3. Discuss parenting division with partner\n4. Create postpartum support plan",
    tags: ["Preparation", "Parenting", "Confidence"],
    weekRange: [28, 40]
  },

  // Postpartum
  {
    id: "postpartum-001",
    category: "postpartum",
    title: "Postpartum Mood Swings Are Normal",
    summary: "Postpartum blues (Baby Blues) is common and usually resolves on its own",
    content: "About 50-80% of new mothers experience mood lows, easy crying, and anxiety within 2-4 weeks after birth. This is called \"postpartum blues\" caused by hormone drop and sleep deprivation.\n\nCharacteristics:\n- Usually appears 3-5 days after birth\n- Duration does not exceed 2 weeks\n- Does not affect daily life and baby care\n- No special treatment needed, resolves on its own\n\nCoping:\n1. Accept your emotions, don't blame yourself\n2. Get family help to ensure rest\n3. Share with other new mothers",
    tags: ["Postpartum", "Blues", "Normal"],
    weekRange: [0, 6]
  },
  {
    id: "postpartum-002",
    category: "postpartum",
    title: "Recognizing Postpartum Depression",
    summary: "Postpartum depression needs professional help, early identification is important",
    content: "Postpartum depression is more severe than blues and requires professional treatment.\n\nWarning signs:\n- Mood lows persisting more than 2 weeks\n- No interest in baby or harmful thoughts toward baby\n- Unable to complete daily care\n- Suicidal thoughts\n- Hallucinations or delusions\n\nSeek help immediately:\n1. Tell family how you feel\n2. Contact obstetrician or psychologist\n3. Don't suffer alone",
    tags: ["PPD", "Warning", "Help"],
    weekRange: [0, 12]
  },
  {
    id: "postpartum-003",
    category: "postpartum",
    title: "Postpartum Recovery and Self-Care",
    summary: "Take care of yourself first, so you can better care for baby",
    content: "The 6-8 weeks postpartum is key for physical recovery. Neglecting self-care affects mood and parenting ability.\n\nSelf-care points:\n1. Nutritious balanced diet\n2. Rest as much as possible, let family share the load\n3. Postpartum checkup to understand recovery\n4. Moderate exercise, start with walking\n5. Accept body changes, give yourself time",
    tags: ["Recovery", "Self-Care", "Care"],
    weekRange: [0, 12]
  },

  // Emergency
  {
    id: "emergency-001",
    category: "emergency",
    title: "When to Seek Emergency Care",
    summary: "Seek immediate medical attention if these symptoms occur during pregnancy",
    content: "If you experience the following symptoms, please seek medical attention or contact your doctor immediately:\n\nPhysical symptoms:\n- Vaginal bleeding\n- Severe abdominal pain\n- Severe headache or visual disturbances\n- Severe swelling of hands, feet, face\n- Significantly reduced fetal movement\n- Frequent contractions (before 37 weeks)\n\nPsychological emergency:\n- Persistent suicidal thoughts\n- Harmful thoughts toward baby\n- Hallucinations or delusions\n\nEmergency contacts:\n- Obstetrician emergency phone\n- 24-hour midwife hotline\n- Psychological crisis intervention hotline",
    tags: ["Emergency", "Symptoms", "Care"],
    weekRange: [0, 40],
    isEmergency: true
  },
  {
    id: "emergency-002",
    category: "emergency",
    title: "Psychological Crisis Help Lines",
    summary: "These resources can help when experiencing psychological crisis",
    content: "If you are experiencing severe psychological distress, please seek help immediately:\n\n24-hour Mental Health Hotlines:\n- National Psychological Assistance: 400-161-9995\n- Beijing Psychological Assistance: 010-82951332\n- Shanghai Psychological Assistance: 021-34289888\n\nMedical Institutions:\n- Local Maternity Hospital Psychology Department\n- Top-tier Hospital Psychiatry/Psychology Department\n- Postpartum Depression Specialist Clinic\n\nOther Resources:\n- Maternal and Child Health Guidance Center\n- Community Mental Health Services\n\nDon't suffer alone, seeking help is brave.",
    tags: ["Crisis", "Help", "Hotline"],
    weekRange: [0, 42],
    isEmergency: true
  }
];

// Get articles by category
export function getArticlesByCategory(category) {
  return MEDICAL_ARTICLES_EN.filter(article => article.category === category);
}

// Get articles by pregnancy week
export function getArticlesByWeek(week) {
  return MEDICAL_ARTICLES_EN.filter(article =>
    week >= article.weekRange[0] && week <= article.weekRange[1]
  );
}

// Search articles
export function searchArticles(keyword) {
  const lowerKeyword = keyword.toLowerCase();
  return MEDICAL_ARTICLES_EN.filter(article =>
    article.title.toLowerCase().includes(lowerKeyword) ||
    article.summary.toLowerCase().includes(lowerKeyword) ||
    article.tags.some(tag => tag.toLowerCase().includes(lowerKeyword))
  );
}

// Get all categories (excluding emergency)
export function getCategories() {
  return Object.entries(MEDICAL_CATEGORIES)
    .filter(([key, value]) => value !== "emergency")
    .map(([key, value]) => ({ key, value }));
}

export default {
  MEDICAL_CATEGORIES,
  MEDICAL_ARTICLES_EN,
  getArticlesByCategory,
  getArticlesByWeek,
  searchArticles,
  getCategories
};
