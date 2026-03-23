import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { BarChart3, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { txt } from "../../utils/txt";

const fetalWeekStages = [
  {
    start: 4,
    end: 7,
    icon: "🌱",
    bg: "#F1C487",
    zh: {
      size: "约 0.2-1.3 cm（种子大小）",
      title: "关键器官开始打底",
      detail: "神经管和心脏结构开始形成，小生命进入快速建构期。",
      comfort: "你每天的休息和营养，都在悄悄保护 ta 的起点。",
    },
    en: {
      size: "About 0.2-1.3 cm (seed-like)",
      title: "Core foundations begin",
      detail: "Neural tube and heart structures start to form in this rapid build stage.",
      comfort: "Your rest and nutrition today quietly protect baby's beginning.",
    },
  },
  {
    start: 8,
    end: 11,
    icon: "🍓",
    bg: "#F4B77E",
    zh: {
      size: "约 1.6-5.4 cm（草莓到青柠）",
      title: "五官与四肢更清晰",
      detail: "四肢更完整，外观特征逐步可见，身体比例持续调整。",
      comfort: "你感受到的每一次情绪波动，都值得被温柔接住。",
    },
    en: {
      size: "About 1.6-5.4 cm (berry to lime)",
      title: "Face and limbs gain form",
      detail: "Limbs become more complete and external features become easier to identify.",
      comfort: "Every mood shift you feel deserves gentle support.",
    },
  },
  {
    start: 12,
    end: 15,
    icon: "🍋",
    bg: "#EDBF72",
    zh: {
      size: "约 6-10 cm（柠檬大小）",
      title: "动作协调性提升",
      detail: "宝宝会有更多活动，神经与肌肉配合继续发展。",
      comfort: "你的稳定节奏，会成为 ta 感受到的第一份安全感。",
    },
    en: {
      size: "About 6-10 cm (lemon-sized)",
      title: "Movement coordination improves",
      detail: "Baby moves more while neural-muscle coordination keeps maturing.",
      comfort: "Your steadiness becomes baby's first feeling of safety.",
    },
  },
  {
    start: 16,
    end: 19,
    icon: "🥑",
    bg: "#E9B56A",
    zh: {
      size: "约 11-15 cm（牛油果大小）",
      title: "听觉与感知开始活跃",
      detail: "感官发育更明显，宝宝对声音和节律更敏感。",
      comfort: "你说的话、你放松的呼吸，ta 都在慢慢记住。",
    },
    en: {
      size: "About 11-15 cm (avocado-sized)",
      title: "Senses become more active",
      detail: "Sensory growth advances and baby becomes more responsive to rhythm and sounds.",
      comfort: "Your voice and calmer breathing become familiar to baby.",
    },
  },
  {
    start: 20,
    end: 23,
    icon: "🌽",
    bg: "#E8B468",
    zh: {
      size: "约 25-30 cm（玉米棒长度）",
      title: "睡眠节律逐步建立",
      detail: "宝宝会有更清晰的活动与休息节律，身体组织继续增长。",
      comfort: "你越照顾好睡眠，ta 的日夜节奏也更容易稳定。",
    },
    en: {
      size: "About 25-30 cm (corn-length)",
      title: "Sleep rhythms begin to form",
      detail: "Activity-rest rhythm gets clearer while body tissues continue to grow.",
      comfort: "The better your sleep, the easier baby's rhythm settles too.",
    },
  },
  {
    start: 24,
    end: 27,
    icon: "🥭",
    bg: "#E5B062",
    zh: {
      size: "约 30-36 cm（玉米到茄子体量）",
      title: "听觉更敏锐，互动感增强",
      detail: "对声音和触感更敏感，肺部发育持续推进。",
      comfort: "你今天给自己的安稳，会通过你的身体传递给 ta。",
    },
    en: {
      size: "About 30-36 cm (corn to eggplant range)",
      title: "Hearing sharpens, bonding grows",
      detail: "Baby is more responsive to sound and touch while lungs keep developing.",
      comfort: "Your calm today is a message baby can feel through your body.",
    },
  },
  {
    start: 28,
    end: 31,
    icon: "🥥",
    bg: "#DDA95C",
    zh: {
      size: "约 36-42 cm（椰子大小）",
      title: "体重增长明显",
      detail: "皮下脂肪增加更快，身体更接近出生前状态。",
      comfort: "你正在和宝宝一起进入“更有力量”的阶段。",
    },
    en: {
      size: "About 36-42 cm (coconut-sized)",
      title: "Weight gain accelerates",
      detail: "Subcutaneous fat grows faster and body composition nears birth readiness.",
      comfort: "You and baby are entering a stronger phase together.",
    },
  },
  {
    start: 32,
    end: 35,
    icon: "🍍",
    bg: "#D5A357",
    zh: {
      size: "约 42-46 cm（菠萝大小）",
      title: "体温与呼吸调节更成熟",
      detail: "多系统逐步完善，身体为出生做最后的节律准备。",
      comfort: "你此刻的耐心和节奏，正在成为 ta 的底气。",
    },
    en: {
      size: "About 42-46 cm (pineapple-sized)",
      title: "Thermal and breathing control matures",
      detail: "Multiple systems continue refining for final birth readiness.",
      comfort: "Your patience and rhythm are becoming baby's confidence.",
    },
  },
  {
    start: 36,
    end: 42,
    icon: "🍉",
    bg: "#CCA054",
    zh: {
      size: "约 47-52 cm（西瓜区间）",
      title: "进入待产冲刺阶段",
      detail: "主要器官接近成熟，宝宝在做最后的适应。",
      comfort: "你已经走了很远，现在要做的是：稳住、休息、被支持。",
    },
    en: {
      size: "About 47-52 cm (watermelon range)",
      title: "Final pre-birth stretch",
      detail: "Major systems are near maturity while baby makes final adaptations.",
      comfort: "You've come far. Now: stay steady, rest well, and ask for support.",
    },
  },
];

const parseWeekNumber = (weekLabel) => {
  if (typeof weekLabel !== "string") return 24;
  const match = /^(\d{1,2})\+([0-6])$/.exec(weekLabel.trim());
  if (!match) return 24;
  return Number(match[1]);
};

const parseWeekDay = (weekLabel) => {
  if (typeof weekLabel !== "string") return { week: 24, day: 3 };
  const match = /^(\d{1,2})\+([0-6])$/.exec(weekLabel.trim());
  if (!match) return { week: 24, day: 3 };
  return { week: Number(match[1]), day: Number(match[2]) };
};

const clampWeek = (week) => Math.min(42, Math.max(4, week));

const resolveFetalStage = (weekLabel) => {
  const { week, day } = parseWeekDay(weekLabel);
  const weekFloat = week + day / 7;
  return fetalWeekStages.find((item) => weekFloat >= item.start && weekFloat < item.end + 1) || fetalWeekStages[5];
};

const fetalLengthCheckpoints = [
  { week: 4, cm: 0.2 },
  { week: 8, cm: 1.6 },
  { week: 12, cm: 6.0 },
  { week: 16, cm: 12.0 },
  { week: 20, cm: 25.0 },
  { week: 24, cm: 30.0 },
  { week: 28, cm: 37.0 },
  { week: 32, cm: 43.0 },
  { week: 36, cm: 47.0 },
  { week: 40, cm: 50.0 },
  { week: 42, cm: 51.0 },
];

const estimateFetalLengthCm = (weekLabel) => {
  const { week, day } = parseWeekDay(weekLabel);
  const clampedWeek = clampWeek(week);
  const weekFloat = clampedWeek + Math.min(6, Math.max(0, day)) / 7;

  if (weekFloat <= fetalLengthCheckpoints[0].week) return fetalLengthCheckpoints[0].cm;
  if (weekFloat >= fetalLengthCheckpoints[fetalLengthCheckpoints.length - 1].week) {
    return fetalLengthCheckpoints[fetalLengthCheckpoints.length - 1].cm;
  }

  for (let i = 0; i < fetalLengthCheckpoints.length - 1; i += 1) {
    const left = fetalLengthCheckpoints[i];
    const right = fetalLengthCheckpoints[i + 1];
    if (weekFloat >= left.week && weekFloat <= right.week) {
      const ratio = (weekFloat - left.week) / (right.week - left.week);
      return left.cm + (right.cm - left.cm) * ratio;
    }
  }

  return fetalLengthCheckpoints[5].cm;
};

const buildFetalEncouragement = ({ lang, weekLabel, mood, viewingCurrentWeek, movementSummary }) => {
  const week = parseWeekNumber(weekLabel);
  const phaseLine =
    week <= 13
      ? txt(
          lang,
          "Now is a foundation phase. You don't need to be perfect, only steady.",
          "现在是打地基阶段，不需要完美，只需要稳定。"
        )
      : week <= 27
        ? txt(
            lang,
            "Now is a bonding phase. Baby is increasingly sensing your voice and rhythm.",
            "现在是连接阶段，宝宝会越来越感受到你的声音和节律。"
          )
        : txt(
            lang,
            "Now is the final stretch. Protect your sleep, hydration, and energy.",
            "现在是冲刺阶段，把睡眠、补水和体力放在优先位。"
          );

  const moodLine = (
    lang === "zh"
      ? [
          "今天先把任务减半，先稳呼吸，再做一件最小的事。",
          "先允许自己慢一点，完成一次记录就已经很好。",
          "保持现在的节奏，稳定就是最好的支持。",
          "把这份回稳延续到晚上，会更有掌控感。",
          "把今天的轻松感留住，晚些回看会更有力量。",
        ]
      : [
          "Cut today's load in half. Stabilize breathing first, then do one tiny task.",
          "Allow yourself to slow down. One check-in is already a good job.",
          "Keep this rhythm. Steadiness is the best support.",
          "Carry this improving rhythm into tonight for stronger control.",
          "Keep today's lightness. It will give you strength later.",
        ]
  )[mood] || (lang === "zh" ? "保持今天的节奏，稳定就是最好的支持。" : "Keep this rhythm. Steadiness is the best support.");

  let actionLine;
  if (movementSummary?.status === "need_attention") {
    actionLine = txt(
      lang,
      "Action now: add one movement log today; if movement stays clearly reduced, contact your care team.",
      "现在可执行：今天补记1次胎动；若明显持续减少，请尽快联系产科团队。"
    );
  } else if (movementSummary?.status === "normal") {
    actionLine = txt(
      lang,
      "Action now: keep one movement log + one 3-minute calming practice.",
      "现在可执行：保持1次胎动记录 + 1次3分钟稳态练习。"
    );
  } else {
    actionLine = txt(
      lang,
      "Action now: start with your first movement log to establish rhythm.",
      "现在可执行：先记录第一条胎动，建立你们的节律感。"
    );
  }

  if (!viewingCurrentWeek) {
    actionLine += txt(
      lang,
      " (Reference for this week preview.)",
      "（这是该孕周的预览建议，可提前准备。）"
    );
  }

  return {
    supportLine: `${phaseLine} ${moodLine}`.trim(),
    actionTitle: txt(lang, "Your next small step", "你下一步可做的小行动"),
    actionLine,
  };
};

const formatTimeLabel = (isoDateTime, lang) => {
  if (!isoDateTime) return txt(lang, "No movement logged yet", "今天还没有记录胎动");
  const date = new Date(isoDateTime);
  if (Number.isNaN(date.getTime())) return txt(lang, "No movement logged yet", "今天还没有记录胎动");
  return lang === "zh"
    ? `最近记录：${date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}`
    : `Latest: ${date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;
};

export default memo(function FetalBondCard({
  lang,
  style,
  motionEnabled = true,
  weekLabel,
  currentWeekLabel,
  mood,
  canPrev,
  canNext,
  onPrevWeek,
  onNextWeek,
  movementSummary,
  movementBusy,
  onRecordMovement,
  movementFeedback,
  onOpenDetail,
}) {
  const stage = useMemo(() => resolveFetalStage(weekLabel), [weekLabel]);
  const content = lang === "zh" ? stage.zh : stage.en;
  const viewingCurrentWeek = weekLabel === currentWeekLabel;
  const estimatedLengthCm = useMemo(() => estimateFetalLengthCm(weekLabel), [weekLabel]);

  const lengthText = useMemo(() => {
    const cmText = estimatedLengthCm < 10 ? estimatedLengthCm.toFixed(1) : String(Math.round(estimatedLengthCm));
    return txt(lang, `Current estimate: ~${cmText} cm`, `当前估算约 ${cmText} cm`);
  }, [estimatedLengthCm, lang]);

  const encouragement = useMemo(
    () => buildFetalEncouragement({ lang, weekLabel, mood, viewingCurrentWeek, movementSummary }),
    [lang, weekLabel, mood, viewingCurrentWeek, movementSummary]
  );

  const movementMetaText = useMemo(() => {
    if (!movementSummary) return txt(lang, "Loading movement summary...", "正在读取胎动概览...");
    if (movementSummary.status === "normal") {
      return txt(lang, `今日已记录 ${movementSummary.todayCount} 次，节律看起来稳定。`, `${movementSummary.todayCount} logs today, rhythm looks stable.`);
    }
    if (movementSummary.status === "need_attention") {
      return txt(lang, `今日已记录 ${movementSummary.todayCount} 次，可继续留意并补充观察。`, `${movementSummary.todayCount} logs today, keep observing regularly.`);
    }
    return txt(lang, "今天还没开始记录，建议先记下第一条。", "No logs yet today, start with your first one.");
  }, [lang, movementSummary]);

  return (
    <div className="w-full sm:w-[360px] lg:w-full">
      <div className="rounded-[1.5rem] border border-sage/20 bg-[#fffaf3] p-3.5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-clay/60">
            {txt(lang, "Baby Growth Snapshot", "宝宝成长快照")}
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onPrevWeek}
              disabled={!canPrev}
              aria-label={txt(lang, "Previous week", "上一周")}
              className={`grid h-7 w-7 place-items-center rounded-full border text-clay transition ${
                canPrev ? "border-sage/25 bg-white hover:bg-sage/10" : "cursor-not-allowed border-sage/10 bg-[#f5f1e9] text-clay/35"
              }`}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onNextWeek}
              disabled={!canNext}
              aria-label={txt(lang, "Next week", "下一周")}
              className={`grid h-7 w-7 place-items-center rounded-full border text-clay transition ${
                canNext ? "border-sage/25 bg-white hover:bg-sage/10" : "cursor-not-allowed border-sage/10 bg-[#f5f1e9] text-clay/35"
              }`}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-2 flex items-center gap-3">
          <motion.div
            className="grid h-16 w-16 shrink-0 place-items-center rounded-[40%_60%_57%_43%/44%_46%_54%_56%] text-[30px]"
            style={{ backgroundColor: stage.bg }}
            animate={motionEnabled ? { scale: [1, 1.06, 1], rotate: [0, 2.5, 0] } : { scale: 1, rotate: 0 }}
            transition={motionEnabled ? { duration: 4.2, repeat: Infinity, ease: "easeInOut" } : { duration: 0 }}
          >
            <span>{stage.icon}</span>
          </motion.div>
          <div className="min-w-0">
            <p className="text-base font-bold leading-snug text-clay">{content.title}</p>
            <p className="mt-0.5 text-sm text-clay/75">{content.size}</p>
            <p className="mt-0.5 text-xs font-semibold text-clay/60">{lengthText}</p>
            <div className="mt-1 flex items-center gap-1.5 text-xs font-semibold">
              <span className="rounded-full px-2 py-0.5 text-sage" style={{ backgroundColor: style.pillBg }}>
                {txt(lang, "Week", "孕周")} {weekLabel}
              </span>
              {!viewingCurrentWeek && (
                <span className="rounded-full border border-sage/20 bg-white px-2 py-0.5 text-clay/70">
                  {txt(lang, "Preview", "预览")}
                </span>
              )}
            </div>
          </div>
        </div>

        <p className="mt-2.5 rounded-xl bg-white/85 px-2.5 py-2.5 text-sm leading-snug text-clay/80">{content.detail}</p>
        <p className="mt-2 text-sm font-semibold leading-snug text-sage">{encouragement.supportLine}</p>

        <div className="mt-2 rounded-xl border border-sage/15 bg-white/80 px-2.5 py-2">
          <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-clay/70">
            <Sparkles className="h-3.5 w-3.5 text-sage" />
            {encouragement.actionTitle}
          </p>
          <p className="mt-1 text-sm leading-snug text-clay/85">{encouragement.actionLine}</p>
        </div>

        <div className="mt-2 rounded-xl border border-sage/15 bg-white/80 px-2.5 py-2">
          <p className="text-sm font-semibold text-clay/75">{txt(lang, "Movement log", "胎动记录入口")}</p>
          <p className="mt-1 text-sm leading-snug text-clay/80">{movementMetaText}</p>
          <p className="mt-1 text-sm text-clay/62">{formatTimeLabel(movementSummary?.lastRecordedAt, lang)}</p>
          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={onRecordMovement}
              disabled={movementBusy}
              className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-sm font-bold transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-70"
              style={{ backgroundColor: style.primaryBg, color: style.primaryText }}
            >
              {movementBusy ? txt(lang, "Saving...", "记录中...") : txt(lang, "Record one movement", "记录一次胎动")}
            </button>
            <button
              type="button"
              onClick={onOpenDetail}
              className="inline-flex items-center gap-1 rounded-full border border-sage/20 bg-white px-3 py-2 text-sm font-semibold text-clay transition hover:bg-sage/10"
            >
              <BarChart3 className="h-3.5 w-3.5" />
              {txt(lang, "Open detail page", "打开胎动页")}
            </button>
            {movementFeedback && <span className="text-sm font-semibold text-sage">{movementFeedback}</span>}
          </div>
        </div>

        <p className="mt-2 text-xs leading-relaxed text-clay/58">
          {txt(lang, "For emotional support only. Not a medical diagnosis.", "用于情绪支持展示，不替代医疗诊断。")}
        </p>
      </div>
    </div>
  );
});
