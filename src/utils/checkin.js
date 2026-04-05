export const CHECKIN_STORAGE_KEY = "rihea_daily_checkins_v1";
export const CHECKIN_SLEEP_HOURS_MIN = 3;
export const CHECKIN_SLEEP_HOURS_MAX = 12;
export const CHECKIN_SLEEP_HOURS_STEP = 0.5;
export const CHECKIN_SLEEP_SOURCE_MANUAL = "manual";
export const CHECKIN_SLEEP_SOURCE_HEALTHKIT = "healthkit";
export const CHECKIN_SLEEP_SOURCE_GOOGLE_FIT = "google_fit";
const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const VALID_SLEEP_SOURCES = new Set([
  CHECKIN_SLEEP_SOURCE_MANUAL,
  CHECKIN_SLEEP_SOURCE_HEALTHKIT,
  CHECKIN_SLEEP_SOURCE_GOOGLE_FIT,
]);

export const toDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const isDateKey = (value) => typeof value === "string" && DATE_KEY_PATTERN.test(value);

export const parseDateKey = (value) => {
  if (!isDateKey(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(year, month - 1, day);
  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }
  return parsed;
};

export const diffDateKeys = (left, right) => {
  const leftDate = parseDateKey(left);
  const rightDate = parseDateKey(right);
  if (!leftDate || !rightDate) return null;
  const dayMs = 24 * 60 * 60 * 1000;
  return Math.round((leftDate.getTime() - rightDate.getTime()) / dayMs);
};

const coerceSleepHours = (value) => {
  if (value === null || value === undefined) return null;
  if (typeof value === "string" && value.trim() === "") return null;
  const hours = Number(value);
  if (!Number.isFinite(hours)) return null;
  const clamped = Math.min(CHECKIN_SLEEP_HOURS_MAX, Math.max(CHECKIN_SLEEP_HOURS_MIN, hours));
  const rounded = roundToStep(clamped, CHECKIN_SLEEP_HOURS_STEP);
  return Number(rounded.toFixed(1));
};

const roundToStep = (value, step) => {
  if (!Number.isFinite(value) || !Number.isFinite(step) || step <= 0) return value;
  return Math.round(value / step) * step;
};

export const normalizeSleepHours = (value, fallback = null) => {
  const normalized = coerceSleepHours(value);
  if (normalized !== null) return normalized;
  if (fallback === null || fallback === undefined) return null;
  const normalizedFallback = coerceSleepHours(fallback);
  return normalizedFallback ?? CHECKIN_SLEEP_HOURS_MIN;
};

export const sleepHoursToPercent = (hours) => {
  const normalized = normalizeSleepHours(hours, null);
  if (!Number.isFinite(normalized)) return null;
  const diffFromIdeal = Math.abs(normalized - 8);
  const rawScore = 100 - diffFromIdeal * 18;
  return Math.max(20, Math.min(100, Math.round(rawScore)));
};

const normalizeEntry = (entry) => {
  if (!entry || typeof entry !== "object") return null;
  const date = typeof entry.date === "string" ? entry.date : "";
  const mood = Number.isInteger(entry.mood) ? entry.mood : -1;
  const sleepHours = normalizeSleepHours(entry.sleepHours, null);
  const sleepSource =
    typeof entry.sleepSource === "string" && VALID_SLEEP_SOURCES.has(entry.sleepSource)
      ? entry.sleepSource
      : sleepHours === null
        ? ""
        : CHECKIN_SLEEP_SOURCE_MANUAL;
  if (!isDateKey(date) || !parseDateKey(date)) return null;
  if (mood < 0 || mood > 4) return null;
  return {
    date,
    mood,
    tag: typeof entry.tag === "string" ? entry.tag : "",
    note: typeof entry.note === "string" ? entry.note : "",
    sleepHours,
    sleepSource,
    updatedAt: Number.isFinite(entry.updatedAt) ? entry.updatedAt : Date.now(),
  };
};

export const readCheckIns = () => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CHECKIN_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(normalizeEntry)
      .filter(Boolean)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 90);
  } catch {
    return [];
  }
};

export const saveCheckIns = (entries) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CHECKIN_STORAGE_KEY, JSON.stringify(entries.slice(0, 90)));
  } catch {
    // ignore storage errors
  }
};

export const calcCheckInStreak = (entries) => {
  const dateSet = new Set(entries.map((item) => item.date));
  let streak = 0;
  const cursor = new Date();

  while (dateSet.has(toDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
};

export const getRecentCheckIns = (entries, days = 7, now = new Date()) => {
  const safeEntries = Array.isArray(entries) ? entries.filter(Boolean) : [];
  if (days <= 0) return [];
  const thresholdDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  thresholdDate.setDate(thresholdDate.getDate() - days + 1);

  return safeEntries.filter((entry) => {
    const entryDate = parseDateKey(entry?.date);
    return entryDate && entryDate >= thresholdDate;
  });
};

export const calcCheckInCoverage = (entries, days = 7, now = new Date()) => {
  const recent = getRecentCheckIns(entries, days, now);
  const uniqueDays = new Set(recent.map((entry) => entry.date));
  const coveredDays = uniqueDays.size;
  return {
    windowDays: days,
    coveredDays,
    coverage: days > 0 ? coveredDays / days : 0,
    recentEntries: recent.length,
  };
};
