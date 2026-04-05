const DAY_MS = 24 * 60 * 60 * 1000;

export const PREGNANCY_DATING_METHOD = {
  DUE_DATE: "dueDate",
  LMP: "lmp",
  IVF: "ivf",
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export const parseIsoDate = (value) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
};

export const toIsoDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const addDays = (date, days) => {
  const copy = new Date(date.getTime());
  copy.setDate(copy.getDate() + days);
  return copy;
};

export const isValidWeekLabel = (value) => {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  const match = /^(\d{1,3})\+(\d{1,2})$/.exec(trimmed);
  if (!match) return false;
  const week = Number(match[1]);
  const day = Number(match[2]);
  return week >= 0 && week <= 45 && day >= 0 && day <= 6;
};

export const normalizeWeekLabel = (value) => {
  if (!isValidWeekLabel(value)) return "";
  const [weekPart, dayPart] = value.trim().split("+");
  return `${Number(weekPart)}+${Number(dayPart)}`;
};

export const calcPregnancyWeekByDueDate = (dueDateText, referenceDate = new Date()) => {
  const dueDate = parseIsoDate(dueDateText);
  if (!dueDate) return "";
  const reference = startOfDay(referenceDate);
  const due = startOfDay(dueDate);
  const daysLeft = Math.ceil((due.getTime() - reference.getTime()) / DAY_MS);
  const gestationalDays = 280 - daysLeft;
  if (gestationalDays <= 0) return "0+0";
  const week = Math.floor(gestationalDays / 7);
  const day = gestationalDays % 7;
  return `${week}+${day}`;
};

export const calcDueDateByMethod = ({
  datingMethod = PREGNANCY_DATING_METHOD.DUE_DATE,
  dueDate = "",
  lmpDate = "",
  cycleLength = 28,
  ivfTransferDate = "",
  embryoAgeDays = 5,
}) => {
  if (datingMethod === PREGNANCY_DATING_METHOD.DUE_DATE) {
    return parseIsoDate(dueDate) ? dueDate : "";
  }

  if (datingMethod === PREGNANCY_DATING_METHOD.LMP) {
    const lmp = parseIsoDate(lmpDate);
    if (!lmp) return "";
    const cycle = clamp(Number.isFinite(Number(cycleLength)) ? Number(cycleLength) : 28, 21, 35);
    // Naegele-based estimate with cycle-length adjustment from 28-day baseline.
    const cycleOffset = cycle - 28;
    return toIsoDate(addDays(lmp, 280 + cycleOffset));
  }

  if (datingMethod === PREGNANCY_DATING_METHOD.IVF) {
    const transfer = parseIsoDate(ivfTransferDate);
    if (!transfer) return "";
    // ACOG examples: day-5 embryo => +261 days, day-3 embryo => +263 days.
    const embryo = Number(embryoAgeDays) === 3 ? 3 : 5;
    return toIsoDate(addDays(transfer, 266 - embryo));
  }

  return "";
};

export const validateDueDatePlausible = (dueDateText, referenceDate = new Date()) => {
  const dueDate = parseIsoDate(dueDateText);
  if (!dueDate) {
    return { ok: false, code: "invalid_due_date" };
  }
  const reference = startOfDay(referenceDate);
  const due = startOfDay(dueDate);
  const daysDelta = Math.ceil((due.getTime() - reference.getTime()) / DAY_MS);
  // Keep practical range for onboarding:
  // up to ~6 weeks post-date and up to ~45 weeks before due date.
  if (daysDelta < -42 || daysDelta > 320) {
    return { ok: false, code: "out_of_range", daysDelta };
  }
  return { ok: true, daysDelta };
};

export const resolvePregnancyProfile = (payload, referenceDate = new Date()) => {
  const datingMethod = payload?.datingMethod || PREGNANCY_DATING_METHOD.DUE_DATE;
  const computedDueDate = calcDueDateByMethod({
    datingMethod,
    dueDate: payload?.dueDate || "",
    lmpDate: payload?.lmpDate || "",
    cycleLength: payload?.cycleLength ?? 28,
    ivfTransferDate: payload?.ivfTransferDate || "",
    embryoAgeDays: payload?.embryoAgeDays ?? 5,
  });
  const computedWeek = calcPregnancyWeekByDueDate(computedDueDate, referenceDate);
  const weekOverride = normalizeWeekLabel(payload?.pregnancyWeek || "");
  return {
    datingMethod,
    dueDate: computedDueDate,
    pregnancyWeek: weekOverride || computedWeek,
    computedWeek,
  };
};
