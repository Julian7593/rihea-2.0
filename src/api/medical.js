// Medical Knowledge Base API

import {
  MEDICAL_CATEGORIES,
  getArticlesByCategory,
  getArticlesByWeek,
  searchArticles,
  getCategories as getMedicalCategories,
} from "../data/medicalContent";
import {
  getArticlesByCategory as getArticlesByCategoryEn,
  getArticlesByWeek as getArticlesByWeekEn,
  searchArticles as searchArticlesEn,
} from "../data/medicalContent.en";

const wait = (ms = 150) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Get medical advice for a specific category
 * @param {string} category - The category key (first, second, third, postpartum, emergency)
 * @param {string} lang - Language code (zh or en)
 * @returns {Promise<Array>} Array of medical articles
 */
export async function getMedicalAdvice(category, lang = "zh") {
  await wait();
  if (lang === "en") {
    return getArticlesByCategoryEn(category);
  }
  return getArticlesByCategory(category);
}

/**
 * Get medical articles filtered by pregnancy week
 * @param {number} week - Pregnancy week (0-42)
 * @param {string} lang - Language code (zh or en)
 * @returns {Promise<Array>} Array of relevant medical articles
 */
export async function getMedicalAdviceByWeek(week, lang = "zh") {
  await wait();
  const validWeek = Math.max(0, Math.min(42, week));
  if (lang === "en") {
    return getArticlesByWeekEn(validWeek);
  }
  return getArticlesByWeek(validWeek);
}

/**
 * Search medical articles by keyword
 * @param {string} keyword - Search keyword
 * @param {string} lang - Language code (zh or en)
 * @returns {Promise<Array>} Array of matching medical articles
 */
export async function searchMedicalArticles(keyword, lang = "zh") {
  await wait();
  if (!keyword || keyword.trim().length === 0) {
    return [];
  }
  if (lang === "en") {
    return searchArticlesEn(keyword.trim());
  }
  return searchArticles(keyword.trim());
}

/**
 * Get all available categories
 * @param {string} lang - Language code (zh or en)
 * @returns {Promise<Array>} Array of categories with labels
 */
export async function getMedicalCategoriesWithLabels(lang = "zh") {
  await wait();
  const categories = getMedicalCategories();

  const labelsByLang = {
    zh: [
      { key: "first", label: "早孕期 (1-12周)", icon: "sprout" },
      { key: "second", label: "中孕期 (13-27周)", icon: "flower" },
      { key: "third", label: "晚孕期 (28-40周)", icon: "baby" },
      { key: "postpartum", label: "产后期", icon: "heart" },
      { key: "emergency", label: "紧急情况", icon: "alert-circle", highlight: true },
    ],
    en: [
      { key: "first", label: "First Trimester (1-12 weeks)", icon: "sprout" },
      { key: "second", label: "Second Trimester (13-27 weeks)", icon: "flower" },
      { key: "third", label: "Third Trimester (28-40 weeks)", icon: "baby" },
      { key: "postpartum", label: "Postpartum", icon: "heart" },
      { key: "emergency", label: "Emergency", icon: "alert-circle", highlight: true },
    ],
  };

  return labelsByLang[lang] || labelsByLang.zh;
}

/**
 * Get emergency articles
 * @param {string} lang - Language code (zh or en)
 * @returns {Promise<Array>} Array of emergency articles
 */
export async function getEmergencyArticles(lang = "zh") {
  await wait();
  const allArticles = lang === "en"
    ? await searchArticlesEn("emergency")
    : await searchArticles("紧急");
  return allArticles.filter(article => article.isEmergency);
}

/**
 * Get featured article for the home page
 * @param {number} week - Current pregnancy week
 * @param {string} lang - Language code (zh or en)
 * @returns {Promise<Object|null>} Featured article or null
 */
export async function getFeaturedArticle(week, lang = "zh") {
  await wait();
  const articles = await getMedicalAdviceByWeek(week, lang);
  if (articles.length === 0) return null;
  // Return the first article as featured
  return articles[0];
}

/**
 * Get article by ID
 * @param {string} id - Article ID
 * @param {string} lang - Language code (zh or en)
 * @returns {Promise<Object|null>} Article or null if not found
 */
export async function getArticleById(id, lang = "zh") {
  await wait();
  const allArticles = lang === "en"
    ? searchArticlesEn("") // Get all articles
    : searchArticles(""); // Get all articles

  return allArticles.find(article => article.id === id) || null;
}

/**
 * Get article type label
 * @param {string} type - Article type
 * @param {string} lang - Language code
 * @returns {string} Article type label
 */
export function getArticleTypeLabel(type, lang = "zh") {
  const labels = {
    zh: {
      medical: "医疗",
      psychology: "心理",
      practice: "练习",
      faq: "问题"
    },
    en: {
      medical: "Medical",
      psychology: "Psychology",
      practice: "Practice",
      faq: "FAQ"
    }
  };
  return labels[lang]?.[type] || labels.zh[type];
}

/**
 * Get risk recommended articles based on risk level
 * @param {string} riskLevel - Risk level (low/medium/high)
 * @param {number} pregnancyWeek - Pregnancy week
 * @param {string} lang - Language code
 * @returns {Array} Recommended articles
 */
export function getRiskRecommendedArticles(riskLevel, pregnancyWeek, lang = "zh") {
  const allArticles = lang === "en" ? MEDICAL_ARTICLES_EN : MEDICAL_ARTICLES_ZH;

  // Filter by pregnancy week
  const weekArticles = allArticles.filter(article =>
    pregnancyWeek >= article.weekRange[0] && pregnancyWeek <= article.weekRange[1]
  );

  // Recommendations based on risk level
  const recommendations = {
    high: [
      // Priority: emotion management articles
      "mind-001", "mind-002", "mind-003",
      // Priority: relaxation practice articles
      "habit-001", "habit-002", "habit-003",
      // Priority: high-risk FAQ articles
      "faq-001", "faq-003"
    ],
    medium: [
      "mind-001", "habit-001", "habit-002",
      "science-001", "science-003", "faq-001"
    ],
    low: [
      "first-001", "second-001", "habit-001", "science-003"
    ]
  };

  const recommendedIds = recommendations[riskLevel] || recommendations.low;

  // Return recommended articles that match the pregnancy week
  return weekArticles.filter(article => recommendedIds.includes(article.id));
}

// Export categories for direct use
export { MEDICAL_CATEGORIES };
