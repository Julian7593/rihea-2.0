import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, ChevronLeft, Clock3, Download, HeartPulse } from "lucide-react";
import Card from "../ui/Card";
import { txt } from "../../utils/txt";

const parseWeekNumber = (weekLabel) => {
  if (typeof weekLabel !== "string") return 24;
  const match = /^(\d{1,2})\+([0-6])$/.exec(weekLabel.trim());
  if (!match) return 24;
  return Number(match[1]);
};

const movementSlots = [
  { id: "night", start: 0, end: 6, zh: "夜间", en: "Night" },
  { id: "morning", start: 6, end: 12, zh: "上午", en: "Morning" },
  { id: "afternoon", start: 12, end: 18, zh: "下午", en: "Afternoon" },
  { id: "evening", start: 18, end: 24, zh: "晚上", en: "Evening" },
];

const toDayKey = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const getSlotId = (date) => {
  const hour = date.getHours();
  const slot = movementSlots.find((item) => hour >= item.start && hour < item.end);
  return slot ? slot.id : "evening";
};

const buildMovementStats = (records, lang) => {
  const todayKey = toDayKey(new Date());
  const bySlot = Object.fromEntries(movementSlots.map((slot) => [slot.id, 0]));
  const byDay = new Map();
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    byDay.set(toDayKey(d), 0);
  }

  records.forEach((item) => {
    const date = new Date(item.recordedAt);
    if (Number.isNaN(date.getTime())) return;
    const dayKey = toDayKey(date);
    if (byDay.has(dayKey)) byDay.set(dayKey, (byDay.get(dayKey) || 0) + 1);
    if (dayKey === todayKey) {
      const slotId = getSlotId(date);
      bySlot[slotId] = (bySlot[slotId] || 0) + 1;
    }
  });

  const todaySlots = movementSlots.map((slot) => ({
    id: slot.id,
    label: lang === "zh" ? slot.zh : slot.en,
    count: bySlot[slot.id] || 0,
  }));

  const dailyTrend = [...byDay.entries()].map(([dayKey, count]) => {
    const [yy, mm, dd] = dayKey.split("-").map(Number);
    const d = new Date(yy, mm - 1, dd);
    const label =
      lang === "zh"
        ? `${d.getMonth() + 1}/${d.getDate()}`
        : `${d.toLocaleDateString("en-US", { month: "short" })} ${d.getDate()}`;
    return { dayKey, label, count };
  });

  return { todaySlots, dailyTrend };
};

const getMovementAnomalyHints = ({ lang, weekLabel, dailyTrend, todayCount }) => {
  const currentHour = new Date().getHours();
  const week = parseWeekNumber(weekLabel);
  const prevDays = dailyTrend.slice(0, -1).map((item) => item.count);
  const activePrevDays = prevDays.filter((v) => v > 0);
  const baseline =
    activePrevDays.length > 0
      ? activePrevDays.reduce((sum, v) => sum + v, 0) / activePrevDays.length
      : 0;

  const hints = [];
  if (week < 24) {
    hints.push({
      level: "info",
      text: txt(
        lang,
        "Before week 24, movement rhythm can still be irregular. Focus on consistent observation.",
        "24周前胎动节律可能不稳定，重点是连续观察。"
      ),
    });
  }

  if (week >= 24 && todayCount === 0 && currentHour >= 14) {
    hints.push({
      level: "warn",
      text: txt(
        lang,
        "No movement logged yet today. If this feels clearly less than usual, contact your maternity team promptly.",
        "今天尚未记录胎动；如果你主观感觉明显少于平时，请尽快联系产科/助产团队。"
      ),
    });
  }

  if (week >= 28 && baseline >= 3 && todayCount > 0 && todayCount <= baseline * 0.4) {
    hints.push({
      level: "warn",
      text: txt(
        lang,
        "Today's movement appears much lower than your recent pattern. Keep monitoring and seek clinical advice if reduction persists.",
        "今天胎动较你近期模式明显偏低，建议继续观察；若持续减少请及时就医。"
      ),
    });
  }

  if (hints.length === 0) {
    hints.push({
      level: "ok",
      text: txt(
        lang,
        "Today's record pattern looks stable. Continue observing at your usual times.",
        "今天记录模式整体稳定，按你平时习惯继续观察即可。"
      ),
    });
  }

  hints.push({
    level: "safe",
    text: txt(
      lang,
      "Safety note: there is no fixed normal count for everyone; your usual pattern matters most.",
      "安全提示：没有统一“正常次数”，最重要的是你自己的日常规律是否发生明显变化。"
    ),
  });
  return hints;
};

export default function FetalMovementPage({
  lang,
  style,
  weekLabel,
  movementSummary,
  movementRecords,
  onBack,
  onQuickRecord,
  recording,
  onSaveNote,
  savingNoteId,
  noteFeedback,
  onExportWeekly,
}) {
  const [slotFilter, setSlotFilter] = useState("all");
  const [noteDrafts, setNoteDrafts] = useState({});

  const { todaySlots, dailyTrend } = useMemo(() => buildMovementStats(movementRecords, lang), [movementRecords, lang]);
  const todayCount = movementSummary?.todayCount ?? 0;
  const hints = useMemo(
    () => getMovementAnomalyHints({ lang, weekLabel, dailyTrend, todayCount }),
    [lang, weekLabel, dailyTrend, todayCount]
  );
  const maxTodaySlot = Math.max(1, ...todaySlots.map((slot) => slot.count));
  const maxDaily = Math.max(1, ...dailyTrend.map((item) => item.count));
  const todayKey = toDayKey(new Date());

  const todayRecords = useMemo(() => {
    return movementRecords
      .filter((item) => {
        const date = new Date(item.recordedAt);
        if (Number.isNaN(date.getTime())) return false;
        return toDayKey(date) === todayKey;
      })
      .sort((a, b) => (a.recordedAt < b.recordedAt ? 1 : -1));
  }, [movementRecords, todayKey]);

  const filteredRecords = useMemo(() => {
    if (slotFilter === "all") return todayRecords;
    return todayRecords.filter((item) => {
      const date = new Date(item.recordedAt);
      return getSlotId(date) === slotFilter;
    });
  }, [todayRecords, slotFilter]);

  useEffect(() => {
    const next = {};
    todayRecords.forEach((item) => {
      next[item.id] = typeof item.note === "string" ? item.note : "";
    });
    setNoteDrafts(next);
  }, [todayRecords]);

  const slotFilters = useMemo(
    () => [
      { id: "all", label: txt(lang, "All", "全部") },
      ...movementSlots.map((slot) => ({ id: slot.id, label: lang === "zh" ? slot.zh : slot.en })),
    ],
    [lang]
  );

  return (
    <div className="space-y-5 sm:space-y-4">
      <Card style={style}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-clay/60">
              {txt(lang, "Fetal Movement Detail", "胎动记录独立页")}
            </p>
            <h3 className="mt-1 font-heading text-2xl font-bold text-clay">{txt(lang, "Understand movement rhythm, not just count", "看懂胎动节律，而不只看次数")}</h3>
            <p className="mt-1 text-sm text-clay/75">
              {txt(
                lang,
                "This page shows today's time-slot pattern, 7-day trend, and risk hints based on your baseline.",
                "这里展示今日时段分布、近7天趋势，以及基于你个人基线的提醒。"
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onExportWeekly}
              className="inline-flex items-center gap-1 rounded-full border border-sage/20 bg-white px-3 py-2.5 text-sm font-semibold text-clay transition hover:bg-sage/10"
            >
              <Download className="h-3.5 w-3.5" />
              {txt(lang, "Export weekly report", "导出周报")}
            </button>
            <button
              type="button"
              onClick={onQuickRecord}
              disabled={recording}
              className="inline-flex items-center gap-1 rounded-full px-3 py-2.5 text-sm font-bold transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-70"
              style={{ backgroundColor: style.primaryBg, color: style.primaryText }}
            >
              <HeartPulse className="h-3.5 w-3.5" />
              {recording ? txt(lang, "Recording...", "记录中...") : txt(lang, "Log movement now", "现在记录胎动")}
            </button>
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1 rounded-full border border-sage/20 bg-white px-3 py-2.5 text-sm font-semibold text-clay transition hover:bg-sage/10"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              {txt(lang, "Back", "返回")}
            </button>
          </div>
        </div>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[1.15fr,1fr]">
        <Card style={style}>
          <div className="flex items-center justify-between">
            <h4 className="font-heading text-xl font-bold text-clay">{txt(lang, "Today's time-slot distribution", "今日时段分布")}</h4>
            <span className="rounded-full px-2.5 py-1 text-sm font-semibold" style={{ backgroundColor: style.pillBg, color: style.pillText }}>
              {txt(lang, "Today", "今日")} {todayCount}
            </span>
          </div>
          <div className="mt-3 space-y-2.5">
            {todaySlots.map((slot) => {
              const ratio = Math.max(0.08, slot.count / maxTodaySlot);
              return (
                <div key={slot.id} className="rounded-xl border border-sage/15 bg-[#fffaf3] p-2.5">
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="font-semibold text-clay/80">{slot.label}</span>
                    <span className="font-semibold text-clay/70">{slot.count}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[#efe6d8]">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: style.orange }}
                      initial={{ width: "0%" }}
                      animate={{ width: `${ratio * 100}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-2 text-sm text-clay/62">
            {txt(lang, "No fixed target. Compare with your own pattern day-to-day.", "不追求固定目标，重点看你自己的节律变化。")}
          </p>
        </Card>

        <Card style={style}>
          <div className="flex items-center justify-between">
            <h4 className="font-heading text-xl font-bold text-clay">{txt(lang, "7-day movement trend", "近7天胎动趋势")}</h4>
            <Clock3 className="h-4 w-4 text-clay/65" />
          </div>
          <div className="mt-3 rounded-2xl border border-sage/15 bg-[#fffaf3] p-3">
            <div className="flex items-end gap-2">
              {dailyTrend.map((item) => (
                <div key={item.dayKey} className="flex flex-1 flex-col items-center gap-1">
                  <div className="relative flex h-24 w-full max-w-[38px] items-end rounded-md bg-[#efe6d8]">
                    <motion.div
                      className="w-full rounded-md"
                      style={{ backgroundColor: style.orangeSoft }}
                      initial={{ height: "0%" }}
                      animate={{ height: `${Math.max(8, (item.count / maxDaily) * 100)}%` }}
                      transition={{ duration: 0.45, ease: "easeOut" }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-clay/70">{item.count}</span>
                  <span className="text-sm text-clay/60">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="mt-2 text-sm text-clay/65">
            {txt(
              lang,
              "Trend interpretation is personalized. A clear drop vs your baseline matters more than absolute number.",
              "趋势判断以个人基线为主：比你平时明显下降，比绝对次数更重要。"
            )}
          </p>
        </Card>
      </div>

      <Card style={style}>
        <div className="flex items-center justify-between gap-2">
          <h4 className="font-heading text-xl font-bold text-clay">{txt(lang, "Today's records and notes", "今日记录与备注")}</h4>
          {noteFeedback && <span className="text-sm font-semibold text-sage">{noteFeedback}</span>}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {slotFilters.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSlotFilter(item.id)}
              className={`rounded-full px-3 py-2 text-sm font-semibold transition ${
                slotFilter === item.id ? "text-sage" : "text-clay/75 hover:bg-sage/10"
              }`}
              style={slotFilter === item.id ? { backgroundColor: style.pillBg } : { backgroundColor: "#fffaf3" }}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="mt-3 space-y-2">
          {filteredRecords.length === 0 ? (
            <div className="rounded-xl border border-sage/15 bg-[#fffaf3] px-3 py-2 text-sm text-clay/70">
              {txt(lang, "No records in this slot yet.", "该时段还没有记录。")}
            </div>
          ) : (
            filteredRecords.map((item) => {
              const date = new Date(item.recordedAt);
              const timeText = Number.isNaN(date.getTime())
                ? "--:--"
                : date.toLocaleTimeString(lang === "zh" ? "zh-CN" : "en-US", { hour: "2-digit", minute: "2-digit" });
              const noteValue = noteDrafts[item.id] ?? "";
              return (
                <div key={item.id} className="rounded-xl border border-sage/15 bg-[#fffaf3] p-3">
                  <div className="mb-2 flex items-center justify-between text-sm text-clay/65">
                    <span>{timeText}</span>
                    <span>{item.source === "detail_page" ? txt(lang, "Detail page", "详情页") : txt(lang, "Home card", "首页卡片")}</span>
                  </div>
                  <textarea
                    value={noteValue}
                    onChange={(event) =>
                      setNoteDrafts((prev) => ({
                        ...prev,
                        [item.id]: event.target.value.slice(0, 80),
                      }))
                    }
                    rows={2}
                    placeholder={txt(lang, "Optional note for this movement", "可选：记录这次胎动感受")}
                    className="w-full resize-none rounded-xl border border-sage/20 bg-white px-3 py-2 text-sm text-clay outline-none transition placeholder:text-clay/45 focus:border-sage/45"
                  />
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-sm text-clay/55">{noteValue.length}/80</span>
                    <button
                      type="button"
                      onClick={() => onSaveNote(item.id, noteValue)}
                      disabled={savingNoteId === item.id}
                      className="rounded-full px-3 py-2 text-sm font-semibold transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-70"
                      style={{ backgroundColor: style.primaryBg, color: style.primaryText }}
                    >
                      {savingNoteId === item.id ? txt(lang, "Saving...", "保存中...") : txt(lang, "Save note", "保存备注")}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>

      <Card style={style}>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-clay/70" />
          <h4 className="font-heading text-xl font-bold text-clay">{txt(lang, "Anomaly reminder rules", "异常提醒规则")}</h4>
        </div>
        <div className="mt-3 space-y-2">
          {hints.map((hint, index) => {
            const chip =
              hint.level === "warn"
                ? { bg: "#F7E5D7", text: "#9C6848", label: txt(lang, "Attention", "注意") }
                : hint.level === "ok"
                  ? { bg: "#E8F1E9", text: "#56725C", label: txt(lang, "Stable", "稳定") }
                  : { bg: "#EEE8DF", text: "#6D6457", label: txt(lang, "Safety", "安全提示") };
            return (
              <div key={`${hint.level}-${index}`} className="rounded-2xl border border-sage/15 bg-[#fffaf3] p-3">
                <span className="rounded-full px-2.5 py-1 text-xs font-semibold" style={{ backgroundColor: chip.bg, color: chip.text }}>
                  {chip.label}
                </span>
                <p className="mt-1.5 text-sm text-clay/85">{hint.text}</p>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
