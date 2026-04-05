import { Suspense, lazy, memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  CalendarCheck2,
  ChevronRight,
  HeartPulse,
  Moon,
  Play,
  X,
} from "lucide-react";
import Card from "../ui/Card";
import { txt } from "../../utils/txt";
import { useToast } from "../../contexts/ToastContext";
import { validateField, VALIDATION_RULES } from "../../utils/formValidation";
import {
  calcCheckInStreak,
  CHECKIN_SLEEP_HOURS_MAX,
  CHECKIN_SLEEP_HOURS_MIN,
  CHECKIN_SLEEP_HOURS_STEP,
  CHECKIN_SLEEP_SOURCE_MANUAL,
  normalizeSleepHours,
  sleepHoursToPercent,
  toDateKey,
} from "../../utils/checkin";
import {
  createFetalMovementRecord,
  fetchFetalMovementRecords,
  fetchFetalMovementSummary,
  fetchPartnerHomeCard,
  patchFetalMovementRecord,
} from "../../api/profile";
<<<<<<< HEAD
import HomePartnerCard from "../partner/HomePartnerCard";
import HomeCbtCard from "../cbt/HomeCbtCard";
=======
import { fetchCbtOverview } from "../../api/cbt";
import HomePartnerCard from "../partner/HomePartnerCard";
import HomeCbtCard from "../cbt/HomeCbtCard";
// 新增：饮食和运动相关导入
import DietAdviceCard from "../nutrition/DietAdviceCard";
import ExerciseAdviceCard from "../fitness/ExerciseAdviceCard";
import MealRecordModal from "../nutrition/MealRecordModal";
import ExerciseCheckinModal from "../fitness/ExerciseCheckinModal";
import { generateNutritionAdvice } from "../../utils/nutritionCalculator";
import { getTodayExerciseQuickView } from "../../utils/fitnessRecommender";
import { createDietRecord, createExerciseRecord, getTodaySummary } from "../../utils/recordStorage";
>>>>>>> 356bd4d38d8b7f31d8a35a177e59ac40d7d6cf8a

const FetalMovementPage = lazy(() => import("./FetalMovementPage"));
const WeeklyMoodChart = lazy(() => import("./WeeklyMoodChart"));
const FetalBondCard = lazy(() => import("./FetalBondCard"));

const moodEmoji = ["🌧️", "☁️", "🌤️", "🌸", "☀️"];

const parseWeekDay = (weekLabel) => {
  if (typeof weekLabel !== "string") return { week: 24, day: 3 };
  const match = /^(\d{1,2})\+([0-6])$/.exec(weekLabel.trim());
  if (!match) return { week: 24, day: 3 };
  return { week: Number(match[1]), day: Number(match[2]) };
};

const clampWeek = (week) => Math.min(42, Math.max(4, week));
const toWeekLabel = (week, day = 0) => `${clampWeek(week)}+${Math.min(6, Math.max(0, day))}`;


const dateLabel = (dateKey) => {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const formatShortDate = (dateKey, lang) => {
  const date = dateLabel(dateKey);
  return lang === "zh"
    ? `${date.getMonth() + 1}/${date.getDate()}`
    : `${date.toLocaleDateString("en-US", { month: "short" })} ${date.getDate()}`;
};


const StressRing = memo(function StressRing({ lang, style, mood, sleepHours }) {
  const stressValue = useMemo(() => {
    const stressByMood = [84, 68, 52, 36, 24];
    return stressByMood[mood] ?? 52;
  }, [mood]);
  const loggedSleepHours = useMemo(() => normalizeSleepHours(sleepHours, null), [sleepHours]);
  const sleepValue = useMemo(() => {
    const valueBySleepHours = sleepHoursToPercent(sleepHours);
    if (valueBySleepHours !== null) return valueBySleepHours;
    const sleepByMood = [58, 66, 74, 80, 86];
    return sleepByMood[mood] ?? 72;
  }, [mood, sleepHours]);
  const sleepLabel =
    loggedSleepHours === null
      ? txt(lang, "Log sleep hours in check-in for real data.", "在打卡里记录睡眠时长后可显示真实数据。")
      : txt(
          lang,
          `${loggedSleepHours.toFixed(1)}h logged (manual)`,
          `已记录 ${loggedSleepHours.toFixed(1)} 小时（手动）`
        );
  const stressHigh = stressValue >= 70;
  const stressColor = stressHigh ? "#D89B6B" : "#95A99D";

  const ring = (value, color) => {
    const r = 35;
    const c = 2 * Math.PI * r;
    const p = c - (value / 100) * c;
    return { r, c, p, color };
  };

  const stressRing = ring(stressValue, stressColor);
  const sleepRing = ring(sleepValue, "#9CB0A3");

  return (
    <div className="grid grid-cols-1 gap-3 rounded-[1.5rem] border border-sage/20 bg-[#fffaf3] p-3 sm:grid-cols-2">
      <div className="min-w-0 rounded-[1.25rem] bg-white/80 p-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-clay/70">{txt(lang, "Did you sleep well enough?", "昨晚睡得还行吗")}</p>
          <Moon className="h-4 w-4 text-sage" />
        </div>
        <div className="mt-3 grid place-items-center">
          <svg viewBox="0 0 100 100" className="h-20 w-20">
            <circle cx="50" cy="50" r={sleepRing.r} stroke="rgba(156,176,163,.2)" strokeWidth="8" fill="none" />
            <circle
              cx="50"
              cy="50"
              r={sleepRing.r}
              stroke={sleepRing.color}
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={sleepRing.c}
              strokeDashoffset={sleepRing.p}
              transform="rotate(-90 50 50)"
            />
          </svg>
          <p className="mt-1 text-xs font-bold text-clay">{sleepValue}%</p>
          <p className="mt-1 text-center text-[11px] text-clay/62">{sleepLabel}</p>
        </div>
      </div>

      <div className="min-w-0 rounded-[1.25rem] bg-white/80 p-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-clay/70">{txt(lang, "Is stress over your safe zone?", "今天压力有没有超线")}</p>
          <HeartPulse className="h-4 w-4 text-sage" />
        </div>
        <div className="mt-3 grid place-items-center">
          <svg viewBox="0 0 100 100" className="h-20 w-20">
            <circle cx="50" cy="50" r={stressRing.r} stroke="rgba(216,155,107,.2)" strokeWidth="8" fill="none" />
            <circle
              cx="50"
              cy="50"
              r={stressRing.r}
              stroke={stressRing.color}
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={stressRing.c}
              strokeDashoffset={stressRing.p}
              transform="rotate(-90 50 50)"
            />
          </svg>
          <p className="mt-1 text-xs font-bold text-clay">
            {stressValue}% {stressHigh ? txt(lang, "High", "偏高") : txt(lang, "Stable", "平稳")}
          </p>
        </div>
      </div>
    </div>
  );
});

const HAPTIC_PATTERNS = {
  inhale: [18],
  hold: [12, 44, 12],
  exhale: [36],
};

const TONE_PATTERNS = {
  inhale: { frequency: 392, duration: 0.14, volume: 0.03 },
  hold: { frequency: 494, duration: 0.12, volume: 0.026 },
  exhale: { frequency: 330, duration: 0.18, volume: 0.032 },
};

const BreathingWidget = memo(function BreathingWidget({
  lang,
  style,
  soundEnabled = false,
  motionEnabled = true,
  widgetId = "rihea-breathing-widget",
}) {
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState("idle");
  const [hapticEnabled, setHapticEnabled] = useState(true);
  const [toneEnabled, setToneEnabled] = useState(soundEnabled);
  const audioContextRef = useRef(null);
  const audioReadyRef = useRef(false);
  const supportsHaptics = typeof navigator !== "undefined" && typeof navigator.vibrate === "function";
  const AudioContextClass =
    typeof window !== "undefined" ? window.AudioContext || window.webkitAudioContext : null;
  const supportsTone = Boolean(AudioContextClass);

  useEffect(() => {
    setToneEnabled(soundEnabled);
  }, [soundEnabled]);

  const ensureAudioContext = useCallback(async () => {
    if (!AudioContextClass) return null;
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContextClass();
    }
    if (audioContextRef.current.state === "suspended") {
      await audioContextRef.current.resume();
    }
    audioReadyRef.current = true;
    return audioContextRef.current;
  }, [AudioContextClass]);

  const triggerHaptic = useCallback((nextPhase) => {
    if (!supportsHaptics || !hapticEnabled) return;
    const pattern = HAPTIC_PATTERNS[nextPhase];
    if (!pattern) return;
    navigator.vibrate(pattern);
  }, [hapticEnabled, supportsHaptics]);

  const playTone = useCallback(async (nextPhase) => {
    if (!toneEnabled) return;
    const tone = TONE_PATTERNS[nextPhase];
    if (!tone) return;
    const context = audioReadyRef.current ? audioContextRef.current : await ensureAudioContext();
    if (!context) return;

    const now = context.currentTime;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(tone.frequency, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(tone.volume, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + tone.duration);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + tone.duration + 0.03);
  }, [ensureAudioContext, toneEnabled]);

  useEffect(() => {
    const timers = [];
    const schedule = (fn, ms) => {
      const id = window.setTimeout(fn, ms);
      timers.push(id);
    };

    if (!isActive) {
      setPhase("idle");
      return () => timers.forEach((id) => window.clearTimeout(id));
    }

    const cycle = () => {
      setPhase("inhale");
      schedule(() => {
        setPhase("hold");
        schedule(() => {
          setPhase("exhale");
          schedule(cycle, 4000);
        }, 2000);
      }, 4000);
    };

    cycle();

    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [isActive]);

  useEffect(() => {
    if (!isActive || phase === "idle") return;
    triggerHaptic(phase);
    void playTone(phase);
  }, [isActive, phase, playTone, triggerHaptic]);

  useEffect(() => {
    if (!isActive || !toneEnabled) return;
    void ensureAudioContext();
  }, [ensureAudioContext, isActive, toneEnabled]);

  useEffect(() => () => {
    if (supportsHaptics) navigator.vibrate(0);
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
  }, [supportsHaptics]);

  const toggleExercise = useCallback(() => {
    setIsActive((value) => {
      const next = !value;
      if (next && toneEnabled) {
        void ensureAudioContext();
      }
      if (!next && supportsHaptics) {
        navigator.vibrate(0);
      }
      return next;
    });
  }, [ensureAudioContext, supportsHaptics, toneEnabled]);

  const toggleToneCue = useCallback(() => {
    setToneEnabled((value) => {
      const next = !value;
      if (next) {
        void ensureAudioContext();
      }
      return next;
    });
  }, [ensureAudioContext]);

  const phaseText =
    phase === "idle"
      ? txt(lang, "Tap to breathe", "点击开始深呼吸")
      : phase === "inhale"
        ? txt(lang, "Inhale deeply...", "缓缓吸气...")
        : phase === "hold"
          ? txt(lang, "Hold...", "屏息...")
          : txt(lang, "Exhale slowly...", "慢慢呼出...");
  const inhaleScale = motionEnabled ? 1.5 : 1.3;
  const phaseScale = phase === "inhale" || phase === "hold" ? inhaleScale : 1;
  const phaseDurationMs = phase === "hold" ? (motionEnabled ? 2000 : 1500) : (motionEnabled ? 4000 : 3000);

  return (
    <article
      id={widgetId}
      className="rounded-[1.5rem] border border-sage/20 p-4"
      style={{
        background: style.card,
        boxShadow: style.cardShadow,
      }}
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold text-clay/70">{txt(lang, "3-min to feel steadier", "3分钟让自己稳下来")}</p>
        <button
          type="button"
          onClick={toggleExercise}
          className="rounded-full px-2.5 py-1.5 text-xs font-semibold"
          style={{ backgroundColor: style.pillBg, color: style.pillText }}
        >
          {isActive ? txt(lang, "Stop", "停止") : txt(lang, "Start now", "现在开始")}
        </button>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setHapticEnabled((value) => !value)}
          disabled={!supportsHaptics}
          className="rounded-full border px-2.5 py-1 text-[11px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            borderColor: hapticEnabled ? style.line : "rgba(124, 146, 134, 0.25)",
            backgroundColor: hapticEnabled ? style.pillBg : "rgba(255, 255, 255, 0.65)",
            color: hapticEnabled ? style.pillText : "#6E7F75",
          }}
        >
          {txt(lang, "Haptic cue", "触觉提示")} {hapticEnabled ? txt(lang, "On", "开") : txt(lang, "Off", "关")}
        </button>
        <button
          type="button"
          onClick={toggleToneCue}
          disabled={!supportsTone}
          className="rounded-full border px-2.5 py-1 text-[11px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            borderColor: toneEnabled ? style.line : "rgba(124, 146, 134, 0.25)",
            backgroundColor: toneEnabled ? style.pillBg : "rgba(255, 255, 255, 0.65)",
            color: toneEnabled ? style.pillText : "#6E7F75",
          }}
        >
          {txt(lang, "Tone cue", "声音提示")} {toneEnabled ? txt(lang, "On", "开") : txt(lang, "Off", "关")}
        </button>
      </div>

      <div className="flex flex-col items-center">
        <button
          type="button"
          onClick={toggleExercise}
          className="relative grid h-28 w-28 place-items-center rounded-full"
          aria-label={txt(lang, "Toggle breathing exercise", "切换呼吸练习")}
        >
          <div
            className="absolute inset-0 rounded-full opacity-40"
            style={{
              backgroundColor: style.primaryBg,
              transform: `scale(${isActive ? phaseScale : 1})`,
              transitionProperty: "transform",
              transitionDuration: `${phaseDurationMs}ms`,
              transitionTimingFunction: "ease-in-out",
              willChange: "transform",
            }}
          />
          <div className="relative z-10 grid h-20 w-20 place-items-center rounded-full bg-white text-clay shadow-sm">
            {isActive ? <X className="h-5 w-5 text-clay/55" /> : <Play className="ml-0.5 h-5 w-5 text-sage" />}
          </div>
        </button>
        <p className="mt-4 h-6 font-heading text-base font-semibold text-sage">{phaseText}</p>
        <p className="mt-1 text-[11px] text-clay/60">
          {txt(
            lang,
            "Close your eyes and follow vibration and tone rhythm.",
            "可闭眼跟随震动与提示音节奏。"
          )}
        </p>
        {(!supportsHaptics || !supportsTone) && (
          <p className="mt-1 text-[11px] text-clay/55">
            {txt(
              lang,
              "Some feedback may be unavailable on this device/browser.",
              "当前设备/浏览器可能不支持部分感官反馈。"
            )}
          </p>
        )}
      </div>
    </article>
  );
});

<<<<<<< HEAD
function HomeCareMiniCard({ style, title, desc, meta, badge, buttonLabel, onOpen }) {
  return (
    <Card style={style}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {badge && (
              <span
                className="rounded-full px-3 py-1 text-xs font-semibold"
                style={{ backgroundColor: style.pillBg, color: style.pillText }}
              >
                {badge}
              </span>
            )}
            {meta && <span className="text-xs font-semibold text-clay/58">{meta}</span>}
          </div>
          <h3 className="mt-3 font-heading text-xl font-bold text-clay">{title}</h3>
          <p className="mt-1 text-sm text-clay/76">{desc}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onOpen}
        className="mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition hover:brightness-95"
        style={{ backgroundColor: style.primaryBg, color: style.primaryText }}
      >
        {buttonLabel}
        <ChevronRight className="h-4 w-4" />
      </button>
    </Card>
  );
}

=======
>>>>>>> 356bd4d38d8b7f31d8a35a177e59ac40d7d6cf8a
function HomeTab({
  lang,
  style,
  motionEnabled = true,
  soundEnabled = false,
  profileName,
  profile,
  checkIns,
  setCheckIns,
  focusRequest,
  onFocusConsumed,
  onOpenPartnerCenter,
  onOpenCbtCenter,
<<<<<<< HEAD
  onOpenCareSection,
  careWellness,
=======
>>>>>>> 356bd4d38d8b7f31d8a35a177e59ac40d7d6cf8a
  cbtRefreshToken = 0,
}) {
  const [mood, setMood] = useState(2);
  const [sleepHours, setSleepHours] = useState(7.5);
  const [selectedTag, setSelectedTag] = useState(null);
  const [note, setNote] = useState("");
  const [hydratedToday, setHydratedToday] = useState(false);
  const [savedTick, setSavedTick] = useState(0);
  const [moodErrors, setMoodErrors] = useState({});
  const [notesErrors, setNotesErrors] = useState({});
  const [displayWeek, setDisplayWeek] = useState(24);
  const [movementSummary, setMovementSummary] = useState(null);
  const [movementRecords, setMovementRecords] = useState([]);
  const [movementBusy, setMovementBusy] = useState(false);
  const [movementFeedback, setMovementFeedback] = useState("");
  const [savingMovementNoteId, setSavingMovementNoteId] = useState("");
  const [noteFeedback, setNoteFeedback] = useState("");
  const [showMovementPage, setShowMovementPage] = useState(false);
  const [belowFoldReady, setBelowFoldReady] = useState(false);
  const [partnerHomeCard, setPartnerHomeCard] = useState(null);
  const [partnerCardLoading, setPartnerCardLoading] = useState(true);
<<<<<<< HEAD
  const toast = useToast();
  const {
    dietAdvice,
    exerciseAdvice,
    todaySummary,
    cbtOverview,
    cbtLoading,
  } = careWellness || {};
=======
  const [cbtOverview, setCbtOverview] = useState(null);
  const [cbtLoading, setCbtLoading] = useState(true);
  const toast = useToast();

  // 新增：饮食和运动相关state
  const [dietAdvice, setDietAdvice] = useState(null);
  const [exerciseAdvice, setExerciseAdvice] = useState(null);
  const [showMealModal, setShowMealModal] = useState(false);
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState(null);
  const [selectedExerciseTask, setSelectedExerciseTask] = useState(null);
  const [todaySummary, setTodaySummary] = useState(null);
>>>>>>> 356bd4d38d8b7f31d8a35a177e59ac40d7d6cf8a

  const labels = useMemo(
    () =>
      lang === "zh"
        ? ["压力很大", "有点低落", "比较平稳", "逐渐变好", "心情晴朗"]
        : ["Overwhelmed", "Low", "Steady", "Better", "Bright"],
    [lang]
  );
  const tags = useMemo(
    () =>
      lang === "zh"
        ? ["身体不适", "睡眠不佳", "产检焦虑", "家人支持", "宝宝胎动"]
        : ["Discomfort", "Poor Sleep", "Checkup Anxiety", "Family", "Baby Movement"],
    [lang]
  );
  const dynamicComfort = useMemo(
    () => [
      { title: txt(lang, "3 minutes to stabilize high stress", "3分钟先把高压稳下来"), icon: <Play className="h-4 w-4" /> },
      { title: txt(lang, "First hold your low mood, then recover", "先接住低落，再慢慢回稳"), icon: <Play className="h-4 w-4" /> },
      { title: txt(lang, "Keep your steady state through today", "把平稳状态延续到今天"), icon: <Play className="h-4 w-4" /> },
      { title: txt(lang, "Keep getting better, not interrupted", "把变好的节奏继续下去"), icon: <Play className="h-4 w-4" /> },
      { title: txt(lang, "Capture one small good moment today", "留住今天一个小确幸"), icon: <BookOpen className="h-4 w-4" /> },
    ],
    [lang]
  );
  const weekLabel = profile?.pregnancyWeek || "24+3";
  const parsedWeek = useMemo(() => parseWeekDay(weekLabel), [weekLabel]);
  const displayWeekLabel = useMemo(() => toWeekLabel(displayWeek, parsedWeek.day), [displayWeek, parsedWeek.day]);
  const dueDateLabel = profile?.dueDate || "";

  const todayKey = toDateKey(new Date());
  const todayEntry = useMemo(() => checkIns.find((item) => item.date === todayKey), [checkIns, todayKey]);
  const streak = useMemo(() => calcCheckInStreak(checkIns), [checkIns]);
  const recentCheckIns = useMemo(() => checkIns.slice(0, 7), [checkIns]);
  const lastCheckIn = checkIns[0];

  const todayMoodLabel = todayEntry ? labels[todayEntry.mood] : txt(lang, "Not checked in yet", "今日未打卡");
  const sleepHoursDisplay = useMemo(() => {
    const normalized = normalizeSleepHours(sleepHours, 7.5);
    return Number.isInteger(normalized) ? String(normalized) : normalized.toFixed(1);
  }, [sleepHours]);
<<<<<<< HEAD
  const nutritionMiniText = useMemo(() => {
    const mealsLogged = todaySummary?.diet?.mealsLogged || 0;
    const proteinPercent = todaySummary?.diet?.nutrition?.protein?.percent || 0;
    if (mealsLogged === 0) {
      return txt(lang, "No meal logged yet. Open Care to record one meal and see today's guidance.", "今天还没有记录餐食，去关怀页记录一餐并查看今日建议。");
    }
    return txt(
      lang,
      `${mealsLogged} meals logged today. Protein target progress ${proteinPercent}%.`,
      `今天已记录 ${mealsLogged} 餐，蛋白目标完成 ${proteinPercent}%。`
    );
  }, [lang, todaySummary]);
  const exerciseMainTask = exerciseAdvice?.todayTasks?.[0] || null;
  const exerciseMiniText = useMemo(() => {
    const completed = todaySummary?.exercise?.tasksCompleted || 0;
    if (!exerciseMainTask) {
      return txt(lang, "Open Care to review today's movement plan and weekly progress.", "去关怀页查看今天的运动任务和本周进度。");
    }
    if (completed === 0) {
      return txt(
        lang,
        `Today's first task is ${exerciseMainTask.name}. Open Care to complete a safe, gentle task.`,
        `今天建议先做“${exerciseMainTask.name}”，去关怀页完成一条安全、温和的运动任务。`
      );
    }
    return txt(
      lang,
      `${completed} task(s) completed today. Open Care to continue or review weekly progress.`,
      `今天已完成 ${completed} 项运动，去关怀页继续打卡或查看本周进度。`
    );
  }, [exerciseMainTask, lang, todaySummary]);
=======
>>>>>>> 356bd4d38d8b7f31d8a35a177e59ac40d7d6cf8a
  const pregnancyDay = parsedWeek.week * 7 + parsedWeek.day;
  const dueCountdownText = useMemo(() => {
    if (!dueDateLabel) return txt(lang, "No due date set", "未设置预产期");
    const due = dateLabel(dueDateLabel);
    const startDue = new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime();
    const now = new Date();
    const startNow = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const diff = Math.round((startDue - startNow) / 86400000);
    if (diff > 0) return txt(lang, `${diff} days to due date`, `距离预产期 ${diff} 天`);
    if (diff === 0) return txt(lang, "Due date is today", "今天是预产期");
    return txt(lang, `${Math.abs(diff)} days past due date`, `已过预产期 ${Math.abs(diff)} 天`);
  }, [dueDateLabel, lang]);

  useEffect(() => {
    if (hydratedToday) return;
    if (todayEntry) {
      setMood(todayEntry.mood);
      setSelectedTag(todayEntry.tag || null);
      setNote(todayEntry.note || "");
      const normalizedSleep = normalizeSleepHours(todayEntry.sleepHours, null);
      if (normalizedSleep !== null) setSleepHours(normalizedSleep);
    }
    setHydratedToday(true);
  }, [hydratedToday, todayEntry]);

  useEffect(() => {
    setDisplayWeek(clampWeek(parsedWeek.week));
  }, [parsedWeek.week]);

  useEffect(() => {
    let cancelled = false;
    const loadMovementData = async () => {
      try {
        const [summary, recordsData] = await Promise.all([fetchFetalMovementSummary(), fetchFetalMovementRecords(7)]);
        if (!cancelled) {
          setMovementSummary(summary);
          setMovementRecords(recordsData?.records || []);
        }
      } catch (error) {
        if (!cancelled) {
          setMovementSummary({ todayCount: 0, lastRecordedAt: null, status: "unknown" });
          setMovementRecords([]);
        }
      }
    };
    loadMovementData();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
<<<<<<< HEAD
=======
    const loadCbtOverview = async () => {
      setCbtLoading(true);
      try {
        const data = await fetchCbtOverview({
          lang,
          profile,
          checkIns,
        });
        if (!cancelled) {
          setCbtOverview(data);
        }
      } catch {
        if (!cancelled) {
          setCbtOverview(null);
        }
      } finally {
        if (!cancelled) {
          setCbtLoading(false);
        }
      }
    };

    loadCbtOverview();
    return () => {
      cancelled = true;
    };
  }, [cbtRefreshToken, checkIns, lang, profile]);

  useEffect(() => {
    let cancelled = false;
>>>>>>> 356bd4d38d8b7f31d8a35a177e59ac40d7d6cf8a
    const loadPartnerCard = async () => {
      setPartnerCardLoading(true);
      try {
        const data = await fetchPartnerHomeCard({
          lang,
          profile,
          checkIns,
        });
        if (!cancelled) {
          setPartnerHomeCard(data);
        }
      } catch {
        if (!cancelled) {
          setPartnerHomeCard(null);
        }
      } finally {
        if (!cancelled) {
          setPartnerCardLoading(false);
        }
      }
    };

    loadPartnerCard();
    return () => {
      cancelled = true;
    };
  }, [checkIns, lang, profile]);

<<<<<<< HEAD
=======
  // 新增：生成饮食和运动建议
  useEffect(() => {
    if (!profile) return;

    // 生成饮食建议
    const dietAdviceData = generateNutritionAdvice(profile);
    setDietAdvice(dietAdviceData);

    // 生成运动建议
    const dayNames = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
    const currentDay = dayNames[new Date().getDay()];
    const exerciseAdviceData = getTodayExerciseQuickView(profile);
    setExerciseAdvice(exerciseAdviceData);
  }, [profile]);

  // 新增：获取今日记录总结
  useEffect(() => {
    const summary = getTodaySummary();
    setTodaySummary(summary);
  }, []);

  // 新增：处理饮食记录
  const handleRecordMeal = useCallback((mealType) => {
    setSelectedMealType(mealType);
    setShowMealModal(true);
  }, []);

  const handleSaveDietRecord = useCallback((record) => {
    createDietRecord(record);
    setShowMealModal(false);
    setSelectedMealType(null);

    // 刷新今日记录
    const summary = getTodaySummary();
    setTodaySummary(summary);

    toast.success(
      lang === "zh" ? "饮食记录成功！" : "Meal recorded successfully!"
    );
  }, [lang, toast]);

  // 新增：处理运动打卡
  const handleCheckinExercise = useCallback((task) => {
    setSelectedExerciseTask(task);
    setShowExerciseModal(true);
  }, []);

  const handleSaveExerciseRecord = useCallback((record, hasDangerSymptom) => {
    createExerciseRecord(record);
    setShowExerciseModal(false);
    setSelectedExerciseTask(null);

    // 刷新今日记录
    const summary = getTodaySummary();
    setTodaySummary(summary);

    if (hasDangerSymptom) {
      toast.warning(
        lang === "zh" ? "请注意身体不适" : "Please monitor your symptoms"
      );
    } else {
      toast.success(
        lang === "zh" ? "运动打卡成功！" : "Exercise recorded successfully!"
      );
    }
  }, [lang, toast]);

>>>>>>> 356bd4d38d8b7f31d8a35a177e59ac40d7d6cf8a
  useEffect(() => {
    if (!movementFeedback) return undefined;
    const timer = window.setTimeout(() => setMovementFeedback(""), 2200);
    return () => window.clearTimeout(timer);
  }, [movementFeedback]);

  useEffect(() => {
    if (!noteFeedback) return undefined;
    const timer = window.setTimeout(() => setNoteFeedback(""), 2200);
    return () => window.clearTimeout(timer);
  }, [noteFeedback]);

  useEffect(() => {
    if (belowFoldReady || showMovementPage) return undefined;
    let timeoutId = null;
    let idleId = null;
    const activate = () => setBelowFoldReady(true);
    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      idleId = window.requestIdleCallback(activate, { timeout: 650 });
    } else {
      timeoutId = window.setTimeout(activate, 220);
    }
    return () => {
      if (timeoutId) window.clearTimeout(timeoutId);
      if (idleId && typeof window !== "undefined" && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(idleId);
      }
    };
  }, [belowFoldReady, showMovementPage]);

  // 表单验证函数
  const validateMood = useCallback((mood) => {
    if (!mood) {
      setMoodErrors(prev => ({ ...prev, mood: "请选择心情状态" }));
      return false;
    }
    setMoodErrors(prev => ({ ...prev, mood: null }));
    return true;
  }, []);

  const validateNotes = useCallback((notes) => {
    if (!notes.trim()) {
      setNotesErrors(prev => ({ ...prev, notes: null }));
      return true;
    }
    if (notes.length > 200) {
      setNotesErrors(prev => ({ ...prev, notes: "备注最多200字符" }));
      return false;
    }
    setNotesErrors(prev => ({ ...prev, notes: null }));
    return true;
  }, []);

  const submitCheckIn = useCallback(() => {
    const moodValid = validateMood(mood);
    const notesValid = validateNotes(note);

    if (!moodValid || !notesValid) {
      return;
    }
    const entry = {
      date: todayKey,
      mood,
      tag: selectedTag || "",
      note: note.trim(),
      sleepHours: normalizeSleepHours(sleepHours, 7.5),
      sleepSource: CHECKIN_SLEEP_SOURCE_MANUAL,
      updatedAt: Date.now(),
    };

    setCheckIns((prev) => {
      const withoutToday = prev.filter((item) => item.date !== todayKey);
      return [entry, ...withoutToday].sort((a, b) => b.date.localeCompare(a.date));
    });
    setSavedTick(Date.now());
    toast.success(txt(lang, "Check-in saved successfully", "打卡成功"));
  }, [mood, note, selectedTag, setCheckIns, sleepHours, todayKey, toast, validateMood, validateNotes]);

  const handleRecordMovement = useCallback(async (source = "home_card") => {
    if (movementBusy) return;
    setMovementBusy(true);
    try {
      await createFetalMovementRecord({
        source,
        weekLabel: displayWeekLabel,
      });
      const [summary, recordsData] = await Promise.all([fetchFetalMovementSummary(), fetchFetalMovementRecords(7)]);
      setMovementSummary(summary);
      setMovementRecords(recordsData?.records || []);
      setMovementFeedback(txt(lang, "Saved", "已记录"));
      toast.success(txt(lang, "Fetal movement recorded", "胎动记录成功"));
    } catch (error) {
      setMovementFeedback(txt(lang, "Save failed", "记录失败"));
      toast.error(txt(lang, "Failed to record fetal movement", "胎动记录失败"));
    } finally {
      setMovementBusy(false);
    }
  }, [displayWeekLabel, lang, movementBusy, toast]);

  const handleSaveMovementNote = useCallback(async (recordId, noteValue) => {
    if (!recordId || savingMovementNoteId) return;
    setSavingMovementNoteId(recordId);
    try {
      await patchFetalMovementRecord(recordId, { note: noteValue.trim() });
      const recordsData = await fetchFetalMovementRecords(7);
      setMovementRecords(recordsData?.records || []);
      setNoteFeedback(txt(lang, "Note saved", "备注已保存"));
    } catch (error) {
      setNoteFeedback(txt(lang, "Save failed", "保存失败"));
    } finally {
      setSavingMovementNoteId("");
    }
  }, [lang, savingMovementNoteId]);

  const handleExportWeekly = useCallback(() => {
    const lines = [];
    lines.push(txt(lang, "Rihea Weekly Movement Report (Placeholder)", "Rihea 胎动周报（占位）"));
    lines.push(`${txt(lang, "Week", "孕周")}: ${weekLabel}`);
    lines.push(`${txt(lang, "Generated at", "生成时间")}: ${new Date().toLocaleString()}`);
    lines.push("----");
    const sorted = [...movementRecords].sort((a, b) => (a.recordedAt < b.recordedAt ? 1 : -1));
    if (sorted.length === 0) {
      lines.push(txt(lang, "No movement records in the selected period.", "选定周期暂无胎动记录。"));
    } else {
      sorted.forEach((item, index) => {
        lines.push(
          `${index + 1}. ${item.recordedAt} | ${txt(lang, "Source", "来源")}: ${item.source} | ${txt(lang, "Note", "备注")}: ${item.note || "-"}`
        );
      });
    }
    const content = lines.join("\n");
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rihea-movement-weekly-${toDateKey(new Date())}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
    setNoteFeedback(txt(lang, "Weekly report exported", "周报已导出"));
  }, [lang, movementRecords, weekLabel]);

  const scrollToSection = useCallback((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  const openMovementDetail = useCallback(() => setShowMovementPage(true), []);
  const closeMovementDetail = useCallback(() => setShowMovementPage(false), []);
  const goPrevWeek = useCallback(() => setDisplayWeek((prev) => clampWeek(prev - 1)), []);
  const goNextWeek = useCallback(() => setDisplayWeek((prev) => clampWeek(prev + 1)), []);

  useEffect(() => {
    if (!focusRequest?.targetId) return;
    let timer = null;
    const { targetId } = focusRequest;
    const runScroll = () => {
      scrollToSection(targetId);
      if (onFocusConsumed) onFocusConsumed();
    };
    if (targetId === "rihea-trend-entry" && !belowFoldReady) {
      setBelowFoldReady(true);
      timer = window.setTimeout(runScroll, 120);
    } else {
      timer = window.setTimeout(runScroll, 0);
    }
    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, [belowFoldReady, focusRequest, onFocusConsumed, scrollToSection]);

  if (showMovementPage) {
    return (
      <Suspense
        fallback={
          <Card style={style}>
            <p className="text-sm font-semibold text-clay/70">{txt(lang, "Loading movement details...", "正在加载胎动详情...")}</p>
          </Card>
        }
      >
        <FetalMovementPage
          lang={lang}
          style={style}
          weekLabel={weekLabel}
          movementSummary={movementSummary}
          movementRecords={movementRecords}
          recording={movementBusy}
          onQuickRecord={() => handleRecordMovement("detail_page")}
          onSaveNote={handleSaveMovementNote}
          savingNoteId={savingMovementNoteId}
          noteFeedback={noteFeedback}
          onExportWeekly={handleExportWeekly}
          onBack={closeMovementDetail}
        />
      </Suspense>
    );
  }

  return (
    <div className="space-y-5 sm:space-y-5">
      <Card style={style}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between lg:grid lg:grid-cols-[minmax(0,1fr),440px] lg:items-stretch lg:gap-6">
          <div className="lg:flex lg:min-h-[370px] lg:flex-col lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-clay/58">
                {txt(lang, "Welcome back", "欢迎回来")}
              </p>
              <h2 className="mt-1 font-heading text-[2rem] font-bold leading-none text-clay sm:text-[2.2rem]">
                {profileName}
              </h2>
              <p className="mt-2 text-sm font-semibold text-clay/85">
                {txt(lang, "Steady first, and today will feel lighter.", "先把自己稳住，今天会好过很多。")}
              </p>
              <p className="mt-1 text-sm text-clay/78">
                {lang === "zh" ? `孕${weekLabel}` : `Week ${weekLabel}`}
                {dueDateLabel ? ` · ${txt(lang, "Due date", "预产期")} ${dueDateLabel}` : ""}
              </p>
            </div>

            <div className="mt-4 hidden lg:grid lg:grid-cols-3 lg:gap-3">
              <div className="rounded-2xl border border-sage/15 bg-[#fffaf3] px-3 py-2.5">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-clay/60">{txt(lang, "Today", "今天")}</p>
                <p className="mt-1 text-base font-bold text-clay">{todayMoodLabel}</p>
                <p className="mt-1 text-xs text-clay/62">{todayEntry ? txt(lang, "Already checked in", "已完成打卡") : txt(lang, "Tap check-in below", "可在下方快速打卡")}</p>
              </div>
              <div className="rounded-2xl border border-sage/15 bg-[#fffaf3] px-3 py-2.5">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-clay/60">{txt(lang, "Streak", "连续记录")}</p>
                <p className="mt-1 text-base font-bold text-clay">{streak} {txt(lang, "days", "天")}</p>
                <p className="mt-1 text-xs text-clay/62">{txt(lang, "Keep tiny steps daily", "每天一点点就很好")}</p>
              </div>
              <div className="rounded-2xl border border-sage/15 bg-[#fffaf3] px-3 py-2.5">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-clay/60">{txt(lang, "Progress", "孕期进度")}</p>
                <p className="mt-1 text-base font-bold text-clay">{txt(lang, `Day ${pregnancyDay}`, `第 ${pregnancyDay} 天`)}</p>
                <p className="mt-1 text-xs text-clay/62">{dueCountdownText}</p>
              </div>
            </div>

            <div className="mt-3 hidden lg:flex lg:flex-wrap lg:gap-2.5">
              <button
                type="button"
                onClick={() => scrollToSection("rihea-breathing-entry")}
                className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition hover:brightness-95"
                style={{ backgroundColor: style.primaryBg, color: style.primaryText }}
              >
                <Play className="h-4 w-4" />
                {txt(lang, "Start 3-min reset", "先做3分钟稳态")}
              </button>
              <button
                type="button"
                onClick={() => scrollToSection("rihea-checkin-entry")}
                className="inline-flex items-center gap-2 rounded-full border border-sage/20 bg-[#fffaf2] px-4 py-2 text-sm font-semibold text-clay transition hover:bg-sage/10"
              >
                <CalendarCheck2 className="h-4 w-4" />
                {todayEntry ? txt(lang, "Update check-in", "更新今日打卡") : txt(lang, "Do check-in", "完成今日打卡")}
              </button>
            </div>
          </div>
          <Suspense
            fallback={
              <div className="w-full sm:w-[360px] lg:w-full">
                <div className="rounded-[1.5rem] border border-sage/20 bg-[#fffaf3] p-3.5">
                  <p className="text-sm font-semibold text-clay/70">
                    {txt(lang, "Loading baby growth card...", "正在加载宝宝成长卡片...")}
                  </p>
                </div>
              </div>
            }
          >
            <FetalBondCard
              lang={lang}
              style={style}
              motionEnabled={motionEnabled}
              weekLabel={displayWeekLabel}
              currentWeekLabel={weekLabel}
              mood={mood}
              canPrev={displayWeek > 4}
              canNext={displayWeek < 42}
              onPrevWeek={goPrevWeek}
              onNextWeek={goNextWeek}
              movementSummary={movementSummary}
              movementBusy={movementBusy}
              onRecordMovement={handleRecordMovement}
              movementFeedback={movementFeedback}
              onOpenDetail={openMovementDetail}
            />
          </Suspense>
        </div>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[1.25fr,1fr]">
        <div id="rihea-checkin-entry">
        <Card style={style}>
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-xl font-bold text-clay sm:text-2xl">{txt(lang, "Say where you are in 30 seconds", "先花30秒，说出你现在的状态")}</h3>
            <CalendarCheck2 className="h-5 w-5 text-clay/70" />
          </div>
          <p className="mt-1 text-sm text-clay/78">
            {txt(lang, "Once logged, we'll tell you only the next best step for today.", "记录后，我们只给你今天最值得做的下一步。")}
          </p>

          <div className="mt-3 flex flex-wrap gap-3 text-sm font-semibold">
            <span
              className="rounded-full px-3 py-1.5"
              style={{ backgroundColor: todayEntry ? style.pillBg : "#F7EEE1", color: todayEntry ? style.pillText : "#9B755C" }}
            >
              {todayEntry ? txt(lang, "Checked in today", "今日已打卡") : txt(lang, "Not checked in today", "今日未打卡")}
            </span>
            <span className="rounded-full px-3 py-1.5" style={{ backgroundColor: style.pillBg, color: style.pillText }}>
              {txt(lang, "Streak", "连续天数")} {streak} {txt(lang, "days", "天")}
            </span>
            {lastCheckIn && (
              <span className="rounded-full px-3 py-1.5" style={{ backgroundColor: style.pillBg, color: style.pillText }}>
              {txt(lang, "Last check-in", "最近打卡")} {formatShortDate(lastCheckIn.date, lang)}
            </span>
          )}
          </div>

          <div className="mt-4 flex flex-wrap items-end gap-3">
            {moodEmoji.map((emoji, index) => {
              const active = mood === index;
              return (
                <motion.button
                  key={`${emoji}-${index}`}
                  type="button"
                  onClick={() => {
                    setMood(index);
                    setSelectedTag(null);
                  }}
                  whileTap={{ scale: 0.95 }}
                  animate={active ? { scale: 1.12, y: -4 } : { scale: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 380, damping: 14 }}
                  className={`rounded-2xl border px-3 py-2 text-center ${
                    active ? "border-coral/60 bg-coral/20 shadow-soft" : "border-sage/20 bg-[#fffaf2]"
                  }`}
                >
                  <span className="block text-2xl leading-none">{emoji}</span>
                  <span className="mt-1 block text-xs font-semibold text-clay/80">{labels[index]}</span>
                </motion.button>
              );
            })}
          </div>

          <div className="mt-4">
            {moodErrors.mood && (
              <p className="mb-2 text-sm text-red-500 font-medium">
                {moodErrors.mood}
              </p>
            )}
            <p className="mb-2 text-sm font-semibold text-clay/75">
              {txt(lang, "What's influencing your mood?", "是什么影响了你的心情？")}
            </p>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                  className={`rounded-full border px-3 py-2 text-sm transition ${
                    selectedTag === tag
                      ? "border-sage bg-sage/20 text-clay font-bold"
                      : "border-sage/20 bg-white text-clay/70 hover:bg-sage/10"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-semibold text-clay/75">
                {txt(lang, "How many hours did you sleep last night?", "昨晚大概睡了几个小时？")}
              </p>
              <span className="rounded-full bg-[#fffaf2] px-2.5 py-1 text-xs font-semibold text-clay/75">
                {sleepHoursDisplay}h
              </span>
            </div>
            <input
              type="range"
              min={CHECKIN_SLEEP_HOURS_MIN}
              max={CHECKIN_SLEEP_HOURS_MAX}
              step={CHECKIN_SLEEP_HOURS_STEP}
              value={sleepHours}
              onChange={(event) => setSleepHours(normalizeSleepHours(event.target.value, sleepHours))}
              className="w-full accent-[#93A89B]"
            />
            <div className="mt-1 grid grid-cols-[auto,1fr,auto] items-start gap-2 text-[11px] text-clay/58">
              <span className="whitespace-nowrap">{CHECKIN_SLEEP_HOURS_MIN}h</span>
              <span className="text-center leading-4">{txt(lang, "Manual now. HealthKit/Google Fit later.", "当前手动记录，后续可接 HealthKit/Google Fit。")}</span>
              <span className="whitespace-nowrap">{CHECKIN_SLEEP_HOURS_MAX}h</span>
            </div>
          </div>

          <div className="mt-4">
            {notesErrors.notes && (
              <p className="mb-2 text-sm text-red-500 font-medium">
                {notesErrors.notes}
              </p>
            )}
            <p className="mb-2 text-sm font-semibold text-clay/75">{txt(lang, "One-line note", "一句话记录")}</p>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value.slice(0, 80))}
              rows={2}
              placeholder={txt(lang, "What do you need most today?", "今天你最需要的支持是什么？")}
              className="w-full resize-none rounded-2xl border border-sage/20 bg-white/85 px-3 py-2 text-sm text-clay outline-none transition placeholder:text-clay/45 focus:border-sage/45"
            />
            <div className="mt-1 text-right text-xs text-clay/55">{note.length}/80</div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={submitCheckIn}
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition hover:brightness-95"
              style={{ backgroundColor: style.primaryBg, color: style.primaryText }}
            >
              <CalendarCheck2 className="h-4 w-4" />
              {todayEntry ? txt(lang, "Update and refresh plan", "更新并刷新建议") : txt(lang, "Save and get suggestions", "保存并生成建议")}
            </button>
            {savedTick > 0 && (
              <span className="text-sm font-semibold text-sage">
                {txt(lang, "Saved. You're now more in control.", "已保存，你已经更可控了一步。")}
              </span>
            )}
          </div>

          <div className="mt-4">
            <p className="mb-2 text-sm font-semibold text-clay/75">{txt(lang, "Recent check-ins", "最近打卡")}</p>
            {recentCheckIns.length === 0 ? (
              <p className="rounded-2xl bg-[#fffaf2] px-3 py-2 text-sm text-clay/70">
                {txt(lang, "No records yet. Start now and build your steady trend.", "还没有记录，现在开始建立你的稳定曲线。")}
              </p>
            ) : (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {recentCheckIns.map((item) => (
                  <div
                    key={`${item.date}-${item.updatedAt}`}
                    className="min-w-[96px] rounded-2xl border border-sage/20 bg-[#fffaf2] px-3 py-3 text-center"
                  >
                    <div className="text-lg leading-none">{moodEmoji[item.mood]}</div>
                    <div className="mt-1 text-sm font-semibold text-clay/75">{formatShortDate(item.date, lang)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
        </div>

        <div id="rihea-breathing-entry">
          <Card style={style}>
            <h3 className="font-heading text-xl font-bold text-clay sm:text-2xl">{txt(lang, "Stabilize your body first", "现在先稳住身体信号")}</h3>
            <div className="mt-3 space-y-3">
              <StressRing lang={lang} style={style} mood={mood} sleepHours={sleepHours} />
              <BreathingWidget
                lang={lang}
                style={style}
                soundEnabled={soundEnabled}
                motionEnabled={motionEnabled}
              />
            </div>
          </Card>
        </div>
      </div>

      <div id="rihea-trend-entry">
        {belowFoldReady ? (
          <Suspense
            fallback={
              <Card style={style}>
                <div className="rounded-2xl border border-sage/15 bg-[#fffaf3] p-4">
                  <p className="text-sm font-semibold text-clay/72">
                    {txt(lang, "Loading trend module...", "正在加载趋势模块...")}
                  </p>
                </div>
              </Card>
            }
          >
            <WeeklyMoodChart lang={lang} style={style} checkIns={checkIns} motionEnabled={motionEnabled} />
          </Suspense>
        ) : (
          <Card style={style}>
            <div className="rounded-2xl border border-sage/15 bg-[#fffaf3] p-4">
              <p className="text-sm font-semibold text-clay/72">
                {txt(lang, "Preparing your weekly trend...", "正在准备你的情绪趋势...")}
              </p>
            </div>
          </Card>
        )}
      </div>

      <HomePartnerCard
        lang={lang}
        style={style}
        card={partnerHomeCard}
        loading={partnerCardLoading}
        onOpen={onOpenPartnerCenter}
      />

<<<<<<< HEAD
      <HomeCareMiniCard
        style={style}
        badge={txt(lang, "Supportive Self-Care", "支持性自我照护")}
        meta={dietAdvice ? txt(lang, `Week ${dietAdvice.pregnancyWeek}`, `孕${dietAdvice.pregnancyWeek}周`) : ""}
        title={txt(lang, "Nutrition support moved to Care", "饮食照护已转到关怀页")}
        desc={nutritionMiniText}
        buttonLabel={txt(lang, "Open Care nutrition", "去关怀页看饮食建议")}
        onOpen={() => onOpenCareSection?.("nutrition")}
      />

      <HomeCareMiniCard
        style={style}
        badge={txt(lang, "Supportive Self-Care", "支持性自我照护")}
        meta={exerciseAdvice?.weeklyProgress ? txt(lang, `${exerciseAdvice.weeklyProgress.percent || 0}% this week`, `本周完成 ${exerciseAdvice.weeklyProgress.percent || 0}%`) : ""}
        title={txt(lang, "Movement plan moved to Care", "运动照护已转到关怀页")}
        desc={exerciseMiniText}
        buttonLabel={txt(lang, "Open Care movement", "去关怀页打卡运动")}
        onOpen={() => onOpenCareSection?.("exercise")}
      />
=======
      {/* 新增：饮食建议卡片 */}
      {dietAdvice && (
        <DietAdviceCard
          advice={dietAdvice}
          onRecordMeal={handleRecordMeal}
        />
      )}

      {/* 新增：运动建议卡片 */}
      {exerciseAdvice && (
        <ExerciseAdviceCard
          advice={exerciseAdvice}
          onCheckin={handleCheckinExercise}
        />
      )}
>>>>>>> 356bd4d38d8b7f31d8a35a177e59ac40d7d6cf8a

      <HomeCbtCard
        lang={lang}
        style={style}
        overview={cbtOverview}
        loading={cbtLoading}
        onOpen={onOpenCbtCenter}
      />

      <Card style={style}>
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-heading text-2xl font-bold text-clay">{txt(lang, "Your next best step", "接下来先做这一步")}</h3>
          <span className="rounded-full bg-coral/20 px-3 py-1 text-xs font-semibold text-clay">
            {txt(lang, "Based on today", "基于你今天的状态")}
          </span>
        </div>
        <div className="mt-3 space-y-3">
          <motion.article
            whileHover={{ x: 4 }}
            className="flex flex-col gap-3 rounded-3xl border border-coral/35 bg-[#fffaf3] p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="font-semibold text-clay">{dynamicComfort[mood].title}</p>
              {selectedTag && (
                <p className="mt-1 text-xs text-clay/70">
                  {txt(lang, "Focus trigger:", "重点触发因素：")} {selectedTag}
                </p>
              )}
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition hover:brightness-95"
              style={{ backgroundColor: style.primaryBg, color: style.primaryText }}
            >
              {dynamicComfort[mood].icon}
              {txt(lang, "Start", "开始")}
            </button>
          </motion.article>
          <motion.article
            whileHover={{ x: 4 }}
            className="cursor-pointer rounded-3xl border border-sage/25 bg-[#fffaf3] p-4 transition hover:bg-sage/5"
          >
            <p className="font-semibold text-clay">
              {txt(lang, "Why anxiety happens: read and feel less self-blame", "为什么会焦虑：看完会少一些自责")}
            </p>
          </motion.article>
        </div>
      </Card>

      <Card style={style}>
<<<<<<< HEAD
        <button type="button" onClick={() => onOpenCareSection?.("support")} className="flex w-full items-center justify-between">
=======
        <button type="button" className="flex w-full items-center justify-between">
>>>>>>> 356bd4d38d8b7f31d8a35a177e59ac40d7d6cf8a
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-clay">
            <span
              className="grid h-8 w-8 place-items-center rounded-full"
              style={{ backgroundColor: style.pillBg, color: style.pillText }}
            >
              <HeartPulse className="h-4 w-4" />
            </span>
            {txt(lang, "Stress keeps high? Book support in one tap", "情绪连续偏高？一键预约专业支持")}
          </span>
          <ChevronRight className="h-4 w-4 text-clay/60" />
        </button>
      </Card>
<<<<<<< HEAD
=======

      {/* 新增：饮食记录弹窗 */}
      {showMealModal && (
        <MealRecordModal
          isOpen={showMealModal}
          onClose={() => setShowMealModal(false)}
          onSave={handleSaveDietRecord}
          mealType={selectedMealType}
        />
      )}

      {/* 新增：运动打卡弹窗 */}
      {showExerciseModal && selectedExerciseTask && (
        <ExerciseCheckinModal
          isOpen={showExerciseModal}
          onClose={() => setShowExerciseModal(false)}
          onSave={handleSaveExerciseRecord}
          task={selectedExerciseTask}
        />
      )}
>>>>>>> 356bd4d38d8b7f31d8a35a177e59ac40d7d6cf8a
    </div>
  );
}

export default memo(HomeTab);
