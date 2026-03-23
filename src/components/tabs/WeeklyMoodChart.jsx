import { memo, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CalendarCheck2 } from "lucide-react";
import Card from "../ui/Card";
import { txt } from "../../utils/txt";
import { toDateKey } from "../../utils/checkin";

const moodEmoji = ["🌧️", "☁️", "🌤️", "🌸", "☀️"];
const moodToChartValue = [34, 48, 62, 78, 90];

const weekName = (date, lang) => {
  const zh = ["日", "一", "二", "三", "四", "五", "六"];
  const en = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return (lang === "zh" ? zh : en)[date.getDay()];
};

const formatShortDate = (dateKey, lang) => {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return lang === "zh"
    ? `${date.getMonth() + 1}/${date.getDate()}`
    : `${date.toLocaleDateString("en-US", { month: "short" })} ${date.getDate()}`;
};

export default memo(function WeeklyMoodChart({ lang, style, checkIns, motionEnabled = true }) {
  const moodLabels =
    lang === "zh"
      ? ["压力很大", "有点低落", "比较平稳", "逐渐变好", "心情晴朗"]
      : ["Overwhelmed", "Low", "Steady", "Better", "Bright"];

  const series = useMemo(() => {
    const map = new Map(checkIns.map((item) => [item.date, item]));
    const values = [];
    for (let i = 6; i >= 0; i -= 1) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const key = toDateKey(date);
      const item = map.get(key);
      values.push({
        dateKey: key,
        dayLabel: weekName(date, lang),
        value: item ? moodToChartValue[item.mood] : null,
        mood: item ? item.mood : null,
        tag: item?.tag || "",
        note: item?.note || "",
      });
    }
    return values;
  }, [checkIns, lang]);

  const checkedSeries = useMemo(() => series.filter((item) => item.mood !== null), [series]);
  const [selectedDateKey, setSelectedDateKey] = useState(null);

  useEffect(() => {
    if (series.length === 0) return;
    setSelectedDateKey((prev) => {
      if (prev && series.some((item) => item.dateKey === prev)) return prev;
      const fallback = checkedSeries[checkedSeries.length - 1] || series[series.length - 1];
      return fallback.dateKey;
    });
  }, [series, checkedSeries]);

  const chartPoints = useMemo(
    () =>
      series.map((item, index) => ({
        x: 30 + index * 72,
        y: item.value === null ? 150 : 165 - item.value * 1.2,
        mood: item.mood,
        dateKey: item.dateKey,
      })),
    [series],
  );

  const linePoints = useMemo(() => chartPoints.filter((point) => point.mood !== null), [chartPoints]);
  const linePath =
    linePoints.length >= 2
      ? linePoints.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ")
      : "";
  const areaPath =
    linePoints.length >= 2
      ? `${linePath} L ${linePoints[linePoints.length - 1].x} 170 L ${linePoints[0].x} 170 Z`
      : "";

  const selectedPoint = useMemo(() => {
    const found = series.find((item) => item.dateKey === selectedDateKey);
    if (found) return found;
    return checkedSeries[checkedSeries.length - 1] || series[series.length - 1] || null;
  }, [series, selectedDateKey, checkedSeries]);

  const trendDelta = useMemo(() => {
    if (checkedSeries.length < 2) return 0;
    return checkedSeries[checkedSeries.length - 1].value - checkedSeries[0].value;
  }, [checkedSeries]);

  const trendHeadline = useMemo(() => {
    if (checkedSeries.length < 3) {
      return txt(lang, "Keep going: 3 check-ins will unlock trend insight.", "再完成3次打卡，就能看到你的趋势判断。");
    }
    if (trendDelta >= 8) {
      return txt(lang, "Overall steadier this week.", "这周整体趋稳。");
    }
    if (trendDelta <= -8) {
      return txt(lang, "This week is more volatile.", "这周波动偏大。");
    }
    return txt(lang, "This week is mostly stable.", "这周整体基本持平。");
  }, [checkedSeries.length, lang, trendDelta]);

  const maxSwing = useMemo(() => {
    let result = null;
    for (let i = 1; i < series.length; i += 1) {
      if (series[i - 1].mood === null || series[i].mood === null) continue;
      const delta = Math.abs(series[i].value - series[i - 1].value);
      if (!result || delta > result.delta) {
        result = { delta, index: i };
      }
    }
    return result;
  }, [series]);

  const swingPoint = maxSwing ? series[maxSwing.index] : null;
  const swingText = useMemo(() => {
    if (!swingPoint) {
      return txt(lang, "No major fluctuation captured yet.", "暂时还没有明显波动日。");
    }
    const tagText = swingPoint.tag || txt(lang, "No tag", "未标注");
    if (lang === "zh") return `波动最大：周${swingPoint.dayLabel}（${tagText}）`;
    return `Largest swing: ${swingPoint.dayLabel} (${tagText})`;
  }, [lang, swingPoint]);

  const trendColorClass =
    checkedSeries.length < 3
      ? "text-clay/70"
      : trendDelta >= 8
        ? "text-sage"
        : trendDelta <= -8
          ? "text-[#C9875D]"
          : "text-clay";

  return (
    <Card style={style}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-heading text-xl font-bold text-clay sm:text-2xl">{txt(lang, "Are you getting steadier this week?", "这周情绪有没有更稳")}</h3>
        <span className="text-sm font-semibold text-clay/65">{txt(lang, "Last 7 days", "近7天")}</span>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-sage/15 bg-[#fffaf3] px-3 py-2.5 sm:px-3.5">
        <div>
          <p className={`text-base font-semibold leading-snug ${trendColorClass}`}>{trendHeadline}</p>
          <p className="mt-0.5 text-sm leading-snug text-clay/72">{swingText}</p>
        </div>
        {swingPoint && (
          <button
            type="button"
            onClick={() => setSelectedDateKey(swingPoint.dateKey)}
            className="rounded-full px-3 py-1.5 text-xs font-semibold"
            style={{ backgroundColor: style.pillBg, color: style.pillText }}
          >
            {txt(lang, "View that day", "查看这天")}
          </button>
        )}
      </div>

      <div className="mt-3 overflow-hidden rounded-[1.4rem] bg-[#fffdf9] p-3.5 sm:p-4">
        {checkedSeries.length === 0 ? (
          <div className="grid min-h-[170px] place-items-center rounded-2xl border border-sage/15 bg-[#fffaf3] p-4 text-center">
            <CalendarCheck2 className="h-8 w-8 text-sage/65" />
            <div>
              <p className="mt-2 text-base font-semibold text-clay">{txt(lang, "No trend yet. Start your first check-in today.", "还没有趋势，先完成今天第一条打卡。")}</p>
              <p className="mt-1 text-sm text-clay/70">{txt(lang, "After 3 check-ins, your weekly mood trajectory becomes visible.", "完成3次打卡后，就能看到更清晰的情绪轨迹。")}</p>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-2.5 grid grid-cols-7 gap-1.5 text-center text-[13px] font-semibold text-clay/70 sm:gap-2 sm:text-sm">
              {series.map((item, index) => (
                <span key={`${item.dayLabel}-${index}`} className={item.dateKey === selectedDateKey ? "text-sage" : ""}>
                  {item.dayLabel}
                </span>
              ))}
            </div>
            <svg viewBox="0 0 480 180" className="h-[156px] w-full sm:h-[168px]">
              <defs>
                <linearGradient id="moodFillDynamic" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={style.orange} stopOpacity="0.68" />
                  <stop offset="100%" stopColor={style.orange} stopOpacity="0.2" />
                </linearGradient>
              </defs>
              {areaPath && <path d={areaPath} fill="url(#moodFillDynamic)" />}
              {linePath && <path d={linePath} fill="none" stroke={style.orange} strokeLinecap="round" strokeWidth="5.5" />}
              {chartPoints.map((point, index) => (
                <g key={index}>
                  {motionEnabled && maxSwing?.index === index && point.mood !== null && (
                    <motion.circle
                      cx={point.x}
                      cy={point.y}
                      r="11"
                      fill="none"
                      stroke={style.orange}
                      strokeWidth="2"
                      strokeOpacity="0.2"
                      animate={{ r: [10, 14, 10], strokeOpacity: [0.18, 0.55, 0.18] }}
                      transition={{ duration: 1.9, repeat: Infinity, ease: "easeInOut" }}
                    />
                  )}
                  {series[index].dateKey === selectedDateKey && (
                    <circle cx={point.x} cy={point.y} r="13" fill="none" stroke={style.primaryBg} strokeOpacity="0.55" strokeWidth="2.5" />
                  )}
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={series[index].dateKey === selectedDateKey ? "8.8" : "7.2"}
                    fill={
                      point.mood === null
                        ? "#E6DFCF"
                        : maxSwing?.index === index
                          ? "#D57948"
                          : point.mood % 2 === 0
                            ? style.orange
                            : "#F7B76A"
                    }
                    stroke={maxSwing?.index === index && point.mood !== null ? "#FFF7EC" : "none"}
                    strokeWidth={maxSwing?.index === index && point.mood !== null ? "2.4" : "0"}
                    className="cursor-pointer"
                    onClick={() => setSelectedDateKey(series[index].dateKey)}
                  />
                </g>
              ))}
            </svg>

            {checkedSeries.length < 3 && (
              <p className="mt-1 rounded-xl bg-[#faf2e6] px-3 py-2.5 text-sm font-semibold text-clay/70">
                {txt(lang, "Not enough records yet. Complete 3 check-ins to unlock stronger trend insight.", "记录还不够，完成3次打卡后趋势会更准确。")}
              </p>
            )}
          </>
        )}

        <div className="mt-2.5 rounded-2xl bg-[#faf2e6] px-3.5 py-3 text-base text-clay/80">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-clay/65">{txt(lang, "Day detail", "当日详情")}</p>
            {selectedPoint && (
              <p className="text-sm font-semibold text-clay/60">
                {selectedPoint.dayLabel} · {formatShortDate(selectedPoint.dateKey, lang)}
              </p>
            )}
          </div>
          {selectedPoint?.mood === null ? (
            <p className="mt-2 text-base text-clay/75">{txt(lang, "No record for this day yet.", "这一天还没有记录。")}</p>
          ) : (
            <div className="mt-2 space-y-1.5">
              <p>
                <span className="text-clay/65">{txt(lang, "Mood:", "情绪：")}</span>{" "}
                {moodEmoji[selectedPoint?.mood ?? 2]} {moodLabels[selectedPoint?.mood ?? 2]}
              </p>
              <p>
                <span className="text-clay/65">{txt(lang, "Tag:", "标签：")}</span>{" "}
                {selectedPoint?.tag || txt(lang, "No tag", "未标注")}
              </p>
              <p>
                <span className="text-clay/65">{txt(lang, "Note:", "记录：")}</span>{" "}
                {selectedPoint?.note || txt(lang, "No note for this day.", "当天没有填写一句话。")}
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
});
