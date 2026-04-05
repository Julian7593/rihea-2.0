import { MEDICAL_ARTICLES_ZH } from "../../../../src/data/medicalContent.js";
import { MEDICAL_ARTICLES_EN } from "../../../../src/data/medicalContent.en.js";
import { knowledgeBase } from "../../../../src/data/knowledgeBase.js";

const DEFAULT_TOP_K = 3;
const MAX_TOP_K = 8;

function toSafeArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === "object") return Object.values(value);
  return [];
}

function normalizeWeekRange(value) {
  if (!Array.isArray(value) || value.length < 2) return [0, 42];
  const start = Number(value[0]);
  const end = Number(value[1]);
  if (!Number.isFinite(start) || !Number.isFinite(end)) return [0, 42];
  return [Math.max(0, start), Math.max(start, end)];
}

function normalizeTags(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => String(item || "").trim())
    .filter(Boolean)
    .slice(0, 10);
}

function normalizeText(value, maxLength = 240) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function parsePregnancyWeek(raw) {
  const safe = String(raw || "").trim();
  if (!safe) return null;
  const num = Number(safe.split("+")[0]);
  if (!Number.isFinite(num) || num < 0 || num > 60) return null;
  return num;
}

function tokenize(query) {
  const safe = String(query || "").trim().toLowerCase();
  if (!safe) return [];
  const matched = safe.match(/[\u4e00-\u9fa5]{1,}|[a-z0-9_]+/gi) || [];
  const tokens = matched.map((item) => item.trim()).filter(Boolean);
  return Array.from(new Set(tokens)).slice(0, 10);
}

function inWeekRange(week, weekRange) {
  if (!Number.isFinite(week)) return true;
  const [start, end] = normalizeWeekRange(weekRange);
  return week >= start && week <= end;
}

function buildEntry(raw, { source, lang, categoryFallback }) {
  const title = normalizeText(raw?.title, 120);
  const summary = normalizeText(raw?.summary || raw?.content, 320);
  if (!title && !summary) return null;

  const tags = normalizeTags(raw?.tags);
  const category = normalizeText(raw?.category, 32) || categoryFallback;
  const id = normalizeText(raw?.id, 80) || `${source}_${title || Math.random().toString(36).slice(2, 8)}`;
  const weekRange = normalizeWeekRange(raw?.weekRange);

  return {
    id,
    title,
    summary,
    tags,
    category,
    source,
    lang,
    weekRange,
    searchableText: `${title} ${summary} ${tags.join(" ")} ${category}`.toLowerCase(),
  };
}

function buildDefaultEntries() {
  const entries = [];
  for (const article of toSafeArray(MEDICAL_ARTICLES_ZH)) {
    const entry = buildEntry(article, {
      source: "medical_content_zh",
      lang: "zh",
      categoryFallback: "emotional",
    });
    if (entry) entries.push(entry);
  }

  for (const article of toSafeArray(MEDICAL_ARTICLES_EN)) {
    const entry = buildEntry(article, {
      source: "medical_content_en",
      lang: "en",
      categoryFallback: "emotional",
    });
    if (entry) entries.push(entry);
  }

  for (const article of toSafeArray(knowledgeBase)) {
    const entry = buildEntry(article, {
      source: "knowledge_base",
      lang: "zh",
      categoryFallback: "general",
    });
    if (entry) entries.push(entry);
  }

  return entries;
}

function scoreEntry(entry, { tokens, query, week, tags, category }) {
  let score = 0;
  const lowerTitle = entry.title.toLowerCase();
  const lowerSummary = entry.summary.toLowerCase();
  const lowerTags = entry.tags.map((item) => item.toLowerCase());
  const lowerCategory = String(entry.category || "").toLowerCase();

  for (const token of tokens) {
    if (lowerTitle.includes(token)) score += 4;
    else if (lowerSummary.includes(token)) score += 2;
    else if (entry.searchableText.includes(token)) score += 1;
  }

  for (const tag of tags) {
    const safe = String(tag || "").toLowerCase();
    if (!safe) continue;
    if (lowerTags.some((item) => item.includes(safe))) score += 2;
  }

  if (category && lowerCategory === String(category).toLowerCase()) {
    score += 1;
  }

  if (Number.isFinite(week)) {
    if (inWeekRange(week, entry.weekRange)) score += 1;
    else score -= 1;
  }

  if (!tokens.length && query) {
    if (entry.searchableText.includes(String(query).toLowerCase())) score += 1;
  }

  return score;
}

export function createLocalKbIndex({ entries = null } = {}) {
  const normalizedEntries = Array.isArray(entries) && entries.length ? entries : buildDefaultEntries();

  return {
    size() {
      return normalizedEntries.length;
    },

    search({ query = "", pregnancyWeek = null, tags = [], category = "", topK = DEFAULT_TOP_K, lang = "" } = {}) {
      const safeQuery = normalizeText(query, 180);
      const tokens = tokenize(safeQuery);
      const safeTopK = Number.isFinite(Number(topK))
        ? Math.max(1, Math.min(MAX_TOP_K, Number(topK)))
        : DEFAULT_TOP_K;
      const week = parsePregnancyWeek(pregnancyWeek);
      const langFilter = lang === "en" || lang === "zh" ? lang : "";

      const scored = normalizedEntries
        .filter((entry) => !langFilter || entry.lang === langFilter || entry.lang === "zh")
        .map((entry) => ({
          entry,
          score: scoreEntry(entry, {
            tokens,
            query: safeQuery,
            week,
            tags: normalizeTags(tags),
            category,
          }),
        }))
        .filter((item) => item.score > 0 || (!safeQuery && !tokens.length))
        .sort((a, b) => b.score - a.score)
        .slice(0, safeTopK)
        .map((item) => ({
          id: item.entry.id,
          title: item.entry.title,
          summary: item.entry.summary,
          tags: item.entry.tags,
          weekRange: item.entry.weekRange,
          category: item.entry.category,
          source: item.entry.source,
          score: Number(item.score.toFixed(2)),
        }));

      return {
        query: safeQuery,
        total: scored.length,
        hits: scored,
      };
    },
  };
}
