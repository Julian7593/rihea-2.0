import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchCbtOverview } from "../api/cbt";
import { getTodayExerciseQuickView } from "../utils/fitnessRecommender";
import { generateNutritionAdvice } from "../utils/nutritionCalculator";
import { createDietRecord, createExerciseRecord, getTodaySummary } from "../utils/recordStorage";
import { ALERT_LEVELS, assessEmotionalRisk } from "../utils/riskAssessment";
import { txt } from "../utils/txt";

function getLatestCheckIn(checkIns = []) {
  return Array.isArray(checkIns) && checkIns.length > 0 ? checkIns[0] : null;
}

function getMoodLabel(lang, mood) {
  const labels =
    lang === "zh"
      ? ["压力很大", "有点低落", "比较平稳", "逐渐变好", "心情晴朗"]
      : ["Overwhelmed", "Low", "Steady", "Better", "Bright"];
  return labels[mood] || (lang === "zh" ? "今日未打卡" : "No check-in yet");
}

function buildMainAction({ lang, riskAssessment, todaySummary, exerciseAdvice, cbtOverview }) {
  const urgent = riskAssessment?.alert?.level === ALERT_LEVELS.URGENT || cbtOverview?.intakeAssessment?.selfHarmRisk;
  if (urgent) {
    return {
      id: "support-now",
      target: "support",
      title: txt(lang, "Get support now", "现在先连接支持"),
      desc: txt(
        lang,
        "Your recent signals suggest it is safer to prioritize professional support and a structured review first.",
        "你最近的状态提示现在更适合优先获得专业支持，并完成更稳妥的安全评估。"
      ),
      cta: txt(lang, "Open support", "打开支持"),
    };
  }

  if ((todaySummary?.diet?.mealsLogged || 0) === 0) {
    return {
      id: "nutrition-first",
      target: "nutrition",
      title: txt(lang, "Record one meal first", "先记录一餐"),
      desc: txt(
        lang,
        "A quick meal record is the lowest-friction self-care step today and helps make the rest of the plan more concrete.",
        "先记录一餐是今天门槛最低的一步支持性自我照护，也能让后续建议更具体。"
      ),
      cta: txt(lang, "Record meal", "记录这一餐"),
    };
  }

  if ((todaySummary?.exercise?.tasksCompleted || 0) === 0 && exerciseAdvice?.todayTasks?.[0]) {
    return {
      id: "exercise-next",
      target: "exercise",
      title: txt(lang, "Finish one gentle movement task", "完成一条温和运动任务"),
      desc: txt(
        lang,
        "Gentle, pregnancy-safe movement can support routine, energy, and emotional steadiness, but it should stay supportive rather than replace care.",
        "孕期安全的温和运动可以支持节律、精力和情绪稳定，但它应当作为支持性自我照护，而不是替代专业照护。"
      ),
      cta: txt(lang, "Open exercise", "查看运动建议"),
    };
  }

  return {
    id: "cbt-follow-up",
    target: "support",
    title: cbtOverview?.intakeCompleted
      ? txt(lang, "Review this week's support plan", "查看本周支持计划")
      : txt(lang, "Complete your structured support intake", "完成结构化支持筛查"),
    desc: cbtOverview?.intakeCompleted
      ? txt(
          lang,
          "You have already done the essentials today. Continue with your CBT or support follow-up for a more complete care loop.",
          "你今天已经完成了关键照护动作，可以继续 CBT 或支持随访，让整个关怀闭环更完整。"
        )
      : txt(
          lang,
          "The next best step is to complete a structured screening so the app can tailor support more safely.",
          "下一步更合适的是完成结构化筛查，让系统能更稳妥地匹配支持方案。"
        ),
    cta: txt(lang, "Open support plan", "打开支持计划"),
  };
}

export function useCareWellness({ lang, profile, checkIns = [], cbtRefreshToken = 0 }) {
  const [dietAdvice, setDietAdvice] = useState(null);
  const [exerciseAdvice, setExerciseAdvice] = useState(null);
  const [todaySummary, setTodaySummary] = useState(() => getTodaySummary());
  const [showMealModal, setShowMealModal] = useState(false);
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState(null);
  const [selectedExerciseTask, setSelectedExerciseTask] = useState(null);
  const [cbtOverview, setCbtOverview] = useState(null);
  const [cbtLoading, setCbtLoading] = useState(true);

  const requestContext = useMemo(
    () => ({
      lang,
      profile: {
        pregnancyWeek: profile?.pregnancyWeek || "24+3",
        dueDate: profile?.dueDate || "",
      },
      checkIns,
    }),
    [checkIns, lang, profile?.dueDate, profile?.pregnancyWeek]
  );

  const refreshTodaySummary = useCallback(() => {
    const nextSummary = getTodaySummary();
    setTodaySummary(nextSummary);
    return nextSummary;
  }, []);

  useEffect(() => {
    if (!profile) return;
    setDietAdvice(generateNutritionAdvice(profile));
    setExerciseAdvice(getTodayExerciseQuickView(profile));
  }, [profile]);

  useEffect(() => {
    refreshTodaySummary();
  }, [refreshTodaySummary]);

  useEffect(() => {
    let cancelled = false;
    const loadCbtOverview = async () => {
      setCbtLoading(true);
      try {
        const data = await fetchCbtOverview(requestContext);
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
  }, [cbtRefreshToken, requestContext]);

  const riskAssessment = useMemo(
    () =>
      assessEmotionalRisk({
        checkIns,
        cbtAssessment: cbtOverview?.intakeAssessment || null,
        lang,
      }),
    [cbtOverview?.intakeAssessment, checkIns, lang]
  );

  const latestCheckIn = useMemo(() => getLatestCheckIn(checkIns), [checkIns]);

  const careOverview = useMemo(
    () => ({
      moodLabel: latestCheckIn ? getMoodLabel(lang, latestCheckIn.mood) : txt(lang, "No check-in yet", "今日还没有打卡"),
      sleepHours:
        latestCheckIn && Number.isFinite(Number(latestCheckIn.sleepHours)) ? Number(latestCheckIn.sleepHours) : null,
      mealsLogged: todaySummary?.diet?.mealsLogged || 0,
      exerciseCount: todaySummary?.exercise?.tasksCompleted || 0,
      exerciseMinutes: todaySummary?.exercise?.totalDuration || 0,
      riskLevel: riskAssessment?.level || "low",
      urgent: riskAssessment?.alert?.level === ALERT_LEVELS.URGENT,
      cbtLabel: cbtOverview?.careLevel?.label || txt(lang, "Support plan pending", "支持计划待完善"),
    }),
    [cbtOverview?.careLevel?.label, lang, latestCheckIn, riskAssessment?.alert?.level, riskAssessment?.level, todaySummary]
  );

  const mainAction = useMemo(
    () => buildMainAction({ lang, riskAssessment, todaySummary, exerciseAdvice, cbtOverview }),
    [cbtOverview, exerciseAdvice, lang, riskAssessment, todaySummary]
  );

  const openMealRecord = useCallback((mealType = null) => {
    setSelectedMealType(mealType);
    setShowMealModal(true);
  }, []);

  const openExerciseCheckin = useCallback((task) => {
    setSelectedExerciseTask(task || null);
    setShowExerciseModal(true);
  }, []);

  const closeMealRecord = useCallback(() => {
    setShowMealModal(false);
    setSelectedMealType(null);
  }, []);

  const closeExerciseCheckin = useCallback(() => {
    setShowExerciseModal(false);
    setSelectedExerciseTask(null);
  }, []);

  const saveDietRecord = useCallback(
    (record) => {
      createDietRecord(record);
      closeMealRecord();
      return {
        summary: refreshTodaySummary(),
      };
    },
    [closeMealRecord, refreshTodaySummary]
  );

  const saveExerciseRecord = useCallback(
    (record, hasDangerSymptom) => {
      createExerciseRecord(record);
      closeExerciseCheckin();
      return {
        summary: refreshTodaySummary(),
        hasDangerSymptom: Boolean(hasDangerSymptom),
      };
    },
    [closeExerciseCheckin, refreshTodaySummary]
  );

  return {
    dietAdvice,
    exerciseAdvice,
    todaySummary,
    careOverview,
    riskAssessment,
    mainAction,
    cbtOverview,
    cbtLoading,
    showMealModal,
    showExerciseModal,
    selectedMealType,
    selectedExerciseTask,
    openMealRecord,
    openExerciseCheckin,
    closeMealRecord,
    closeExerciseCheckin,
    saveDietRecord,
    saveExerciseRecord,
    refreshTodaySummary,
  };
}
