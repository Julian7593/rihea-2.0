<<<<<<< HEAD
import { useCallback, useEffect, useMemo } from "react";
import { ArrowRight, ClipboardList, HeartHandshake, ShieldAlert } from "lucide-react";
import Card from "../ui/Card";
import CbtCarePanel from "../cbt/CbtCarePanel";
import DietAdviceCard from "../nutrition/DietAdviceCard";
import MealRecordModal from "../nutrition/MealRecordModal";
import ExerciseAdviceCard from "../fitness/ExerciseAdviceCard";
import ExerciseCheckinModal from "../fitness/ExerciseCheckinModal";
import { useToast } from "../../contexts/ToastContext";
import { getCareCategories } from "../../data/content";
import { getRiskLevelConfig } from "../../utils/riskAssessment";
import { txt } from "../../utils/txt";

const CARE_SECTION_IDS = {
  nutrition: "rihea-care-nutrition",
  exercise: "rihea-care-exercise",
  support: "rihea-care-support",
};

function CareStat({ label, value, hint, style }) {
  return (
    <div className="rounded-[1.25rem] border bg-[#fffaf2] p-4" style={{ borderColor: style.line }}>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-clay/58">{label}</p>
      <p className="mt-2 font-heading text-2xl font-bold text-clay">{value}</p>
      <p className="mt-1 text-xs text-clay/64">{hint}</p>
    </div>
  );
}

export default function CareTab({
  lang,
  style,
=======
import { ChevronRight, Play } from "lucide-react";
import Card from "../ui/Card";
import CbtCarePanel from "../cbt/CbtCarePanel";
import { getCareCategories } from "../../data/content";
import { txt } from "../../utils/txt";

export default function CareTab({
  lang,
  style,
  category,
  setCategory,
>>>>>>> 356bd4d38d8b7f31d8a35a177e59ac40d7d6cf8a
  onMainAction,
  onBackupAction,
  profile,
  checkIns = [],
  cbtRefreshToken = 0,
  onCbtUpdated,
  onOpenCbtCenter,
<<<<<<< HEAD
  focusRequest,
  onFocusConsumed,
  careWellness,
}) {
  const toast = useToast();
  const {
    dietAdvice,
    exerciseAdvice,
    todaySummary,
    careOverview,
    riskAssessment,
    mainAction,
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
  } = careWellness || {};

  const riskConfig = getRiskLevelConfig(riskAssessment?.level, lang) || {
    label: txt(lang, "Pending", "待判断"),
  };
  const supportCategories = useMemo(() => getCareCategories(lang), [lang]);

  const scrollToCareSection = useCallback((targetId) => {
    const resolvedId = CARE_SECTION_IDS[targetId] || targetId;
    const element = typeof document !== "undefined" ? document.getElementById(resolvedId) : null;
    if (!element) return;
    element.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  useEffect(() => {
    if (!focusRequest?.targetId) return;
    const timer = window.setTimeout(() => {
      scrollToCareSection(focusRequest.targetId);
      onFocusConsumed?.();
    }, 40);
    return () => window.clearTimeout(timer);
  }, [focusRequest, onFocusConsumed, scrollToCareSection]);

  const handlePrimaryAction = useCallback(() => {
    if (mainAction?.target === "nutrition") {
      scrollToCareSection("nutrition");
      openMealRecord();
      return;
    }
    if (mainAction?.target === "exercise") {
      scrollToCareSection("exercise");
      if (exerciseAdvice?.todayTasks?.[0]) {
        openExerciseCheckin(exerciseAdvice.todayTasks[0]);
      }
      return;
    }
    scrollToCareSection("support");
    onOpenCbtCenter?.();
  }, [exerciseAdvice?.todayTasks, mainAction?.target, onOpenCbtCenter, openExerciseCheckin, openMealRecord, scrollToCareSection]);

  const handleSupportShortcut = useCallback(
    (item) => {
      if (!item) return;
      const payload = {
        category: item.id,
        item: {
          title: item.focusTitle,
          desc: item.focusDesc,
          meta: item.focusTag,
        },
      };
      if (item.id === "pro") {
        scrollToCareSection("support");
      }
      if (item.id === "partner" || item.id === "pro") {
        onBackupAction?.(payload);
        return;
      }
      onMainAction?.(payload);
    },
    [onBackupAction, onMainAction, scrollToCareSection]
  );

  const handleSaveMeal = useCallback(
    (record) => {
      saveDietRecord(record);
      toast.success(txt(lang, "Meal recorded successfully", "饮食记录成功"));
    },
    [lang, saveDietRecord, toast]
  );

  const handleSaveExercise = useCallback(
    (record, hasDangerSymptom) => {
      const result = saveExerciseRecord(record, hasDangerSymptom);
      if (result?.hasDangerSymptom) {
        toast.warning(txt(lang, "Please monitor symptoms and seek support if needed", "请继续留意身体症状，必要时尽快寻求支持"));
        return;
      }
      toast.success(txt(lang, "Exercise recorded successfully", "运动打卡成功"));
    },
    [lang, saveExerciseRecord, toast]
  );

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <Card style={style}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-clay/58">{txt(lang, "Care Hub", "关怀中枢")}</p>
            <h2 className="mt-1 font-heading text-3xl font-bold text-clay">
              {txt(lang, "See today's state, then do the next best thing", "先看今天的状态，再做当前最合适的一步")}
            </h2>
            <p className="mt-2 max-w-3xl text-sm text-clay/76">
              {txt(
                lang,
                "Nutrition, movement and structured support stay visible here as supportive self-care. If risk rises, the page will prioritize safer escalation instead of asking you to handle it alone.",
                "饮食、运动和结构化支持都会在这里持续可见，它们属于支持性自我照护；如果风险升高，页面会优先给出更稳妥的升级路径，而不是让你独自判断。"
              )}
            </p>
          </div>
          {careOverview?.urgent ? <ShieldAlert className="h-6 w-6 text-[#a35e38]" /> : <ClipboardList className="h-6 w-6 text-clay/64" />}
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <CareStat
            style={style}
            label={txt(lang, "Mood", "情绪状态")}
            value={careOverview?.moodLabel || txt(lang, "Pending", "待记录")}
            hint={
              careOverview?.sleepHours !== null
                ? txt(lang, `${careOverview.sleepHours}h sleep logged`, `已记录睡眠 ${careOverview.sleepHours} 小时`)
                : txt(lang, "Log sleep in check-in for a steadier signal", "在打卡中记录睡眠，可获得更稳的状态判断")
            }
          />
          <CareStat
            style={style}
            label={txt(lang, "Nutrition", "饮食照护")}
            value={txt(lang, `${careOverview?.mealsLogged || 0} meal(s)`, `已记录 ${careOverview?.mealsLogged || 0} 餐`)}
            hint={txt(lang, "Use meal records to make today's support more concrete", "通过餐食记录让今天的支持建议更具体")}
          />
          <CareStat
            style={style}
            label={txt(lang, "Movement", "运动照护")}
            value={txt(lang, `${careOverview?.exerciseCount || 0} task(s)`, `已完成 ${careOverview?.exerciseCount || 0} 项`)}
            hint={txt(lang, `${careOverview?.exerciseMinutes || 0} min logged today`, `今日已记录 ${careOverview?.exerciseMinutes || 0} 分钟`)}
          />
          <CareStat
            style={style}
            label={txt(lang, "Support", "支持状态")}
            value={riskConfig.label}
            hint={careOverview?.cbtLabel || txt(lang, "Support plan pending", "支持计划待完善")}
          />
        </div>
      </Card>

      <Card style={style}>
        <div
          className="rounded-[1.45rem] border p-5"
          style={{
            borderColor: careOverview?.urgent ? "#e8c5b4" : style.line,
            background: careOverview?.urgent ? "linear-gradient(135deg, #fff3ed, #fffaf4)" : style.focusGradient,
          }}
        >
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="rounded-full px-3 py-1 text-xs font-semibold"
              style={{
                backgroundColor: careOverview?.urgent ? "#fff1eb" : style.pillBg,
                color: careOverview?.urgent ? "#a35e38" : style.pillText,
              }}
            >
              {careOverview?.urgent ? txt(lang, "Support first", "先做支持升级") : txt(lang, "Next best step", "当前最合适的一步")}
            </span>
            {riskAssessment?.alert?.triggered && (
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#a35e38]">
                {txt(lang, "Higher attention recommended", "建议提高关注强度")}
              </span>
            )}
          </div>
          <h3 className="mt-3 font-heading text-3xl font-bold text-clay">{mainAction?.title}</h3>
          <p className="mt-2 max-w-3xl text-sm text-clay/80">{mainAction?.desc}</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handlePrimaryAction}
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition hover:brightness-95"
              style={{ backgroundColor: style.primaryBg, color: style.primaryText }}
            >
              {mainAction?.cta}
              <ArrowRight className="h-4 w-4" />
            </button>
            <span className="text-sm text-clay/68">
              {careOverview?.urgent
                ? txt(lang, "Supportive self-care stays available below, but it should not replace timely escalation.", "下方的饮食和运动仍可作为支持性照护参考，但不应替代及时升级支持。")
                : txt(lang, "If you want, you can still browse nutrition, movement and structured support below.", "如果你愿意，也可以继续查看下方的饮食、运动与结构化支持。")}
            </span>
          </div>
        </div>
      </Card>

      <section id={CARE_SECTION_IDS.nutrition} className="space-y-4">
        <Card style={style}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-clay/58">{txt(lang, "Nutrition Care", "饮食照护")}</p>
              <h3 className="mt-1 font-heading text-2xl font-bold text-clay">
                {txt(lang, "Use meal records as supportive self-care", "把餐食记录作为支持性自我照护的一部分")}
              </h3>
              <p className="mt-1 text-sm text-clay/76">
                {txt(
                  lang,
                  "Meal guidance here supports energy, routine and day-to-day steadiness. It does not replace medical or mental health treatment when risk is higher.",
                  "这里的饮食建议主要帮助你维持能量、节律和日常稳定；当风险更高时，它不能替代医疗或心理专业支持。"
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={() => openMealRecord()}
              className="rounded-full px-4 py-2 text-sm font-semibold"
              style={{ backgroundColor: style.pillBg, color: style.pillText }}
            >
              {txt(lang, "Record a meal", "记录一餐")}
            </button>
          </div>
        </Card>

        <DietAdviceCard advice={dietAdvice} onRecordMeal={openMealRecord} />
      </section>

      <section id={CARE_SECTION_IDS.exercise} className="space-y-4">
        <Card style={style}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-clay/58">{txt(lang, "Movement Care", "运动照护")}</p>
              <h3 className="mt-1 font-heading text-2xl font-bold text-clay">
                {txt(lang, "Keep movement gentle, pregnancy-safe and supportive", "让运动保持温和、安全，并作为支持性照护")}
              </h3>
              <p className="mt-1 text-sm text-clay/76">
                {txt(
                  lang,
                  "Movement can support energy and emotional steadiness, but it should stay within pregnancy-safe guidance and never be the only response to acute distress.",
                  "运动有助于精力和情绪稳定，但应始终保持在孕期安全范围内，也不能作为急性情绪困扰时的唯一应对方式。"
                )}
              </p>
            </div>
            {exerciseAdvice?.todayTasks?.[0] && (
              <button
                type="button"
                onClick={() => openExerciseCheckin(exerciseAdvice.todayTasks[0])}
                className="rounded-full px-4 py-2 text-sm font-semibold"
                style={{ backgroundColor: style.pillBg, color: style.pillText }}
              >
                {txt(lang, "Start today's task", "开始今日任务")}
              </button>
            )}
          </div>
        </Card>

        <ExerciseAdviceCard advice={exerciseAdvice} onCheckin={openExerciseCheckin} />
      </section>

      <section id={CARE_SECTION_IDS.support} className="space-y-4">
        <Card style={style}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-clay/58">{txt(lang, "Support Escalation", "支持升级")}</p>
              <h3 className="mt-1 font-heading text-2xl font-bold text-clay">
                {txt(lang, "Keep stronger support within reach", "把更强的支持放在伸手可及的位置")}
              </h3>
              <p className="mt-1 text-sm text-clay/76">
                {riskAssessment?.alert?.triggered
                  ? txt(lang, "Recent signals suggest you may benefit from earlier, more structured support. You do not need to wait until things feel unmanageable.", "最近的状态提示你可能更适合更早进入结构化支持，不需要等到完全撑不住再处理。")
                  : txt(lang, "Structured support is still worth opening early, especially if mood, sleep or function keeps slipping.", "如果情绪、睡眠或日常功能持续下滑，尽早打开结构化支持依然是值得的。")}
              </p>
            </div>
            <HeartHandshake className="h-6 w-6 text-clay/64" />
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {supportCategories.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSupportShortcut(item)}
                className="rounded-[1.2rem] border bg-[#fffaf2] p-4 text-left transition hover:-translate-y-0.5"
                style={{ borderColor: style.line }}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-clay/58">{item.focusTag}</p>
                <p className="mt-2 text-base font-semibold text-clay">{item.focusTitle}</p>
                <p className="mt-1 text-sm text-clay/72">{item.focusDesc}</p>
                <span
                  className="mt-3 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
                  style={{ backgroundColor: style.pillBg, color: style.pillText }}
                >
                  {item.focusCta}
                </span>
=======
}) {
  const categories = getCareCategories(lang);
  const active = categories.find((item) => item.id === category) || categories[0];
  const primaryAction =
    active?.list?.[0] ||
    (lang === "zh"
      ? { title: "先做一次3分钟呼吸", desc: "把身体拉回可控，再处理事情。", meta: "3分钟" }
      : { title: "Do one 3-min breathing round", desc: "Regain control before handling tasks.", meta: "3 min" });
  const restActions = active?.list?.slice(1) || [];
  const emitMainAction = () => {
    if (!onMainAction) return;
    onMainAction({ category: active.id, item: primaryAction });
  };
  const emitBackupAction = (item) => {
    if (!onBackupAction) return;
    onBackupAction({ category: active.id, item });
  };

  return (
    <div className="space-y-4">
      <CbtCarePanel
        lang={lang}
        style={style}
        profile={profile}
        checkIns={checkIns}
        refreshToken={cbtRefreshToken}
        onProgramUpdated={onCbtUpdated}
        onOpenProgram={onOpenCbtCenter}
      />

      <Card style={style} className="overflow-hidden p-0 lg:hidden">
        <div className="px-4 pb-3 pt-4 sm:px-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-clay/60">{txt(lang, "Care", "关怀")}</p>
          <h3 className="mt-1 font-heading text-2xl font-bold text-clay">{txt(lang, "Pick scene first, do one thing now", "先选场景，再做一件事")}</h3>
          <p className="mt-1 text-sm text-clay/78">
            {txt(lang, "Do only one guided action first. Everything else can wait.", "先完成一条引导行动，其他内容都可以稍后。")}
          </p>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {categories.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setCategory(item.id)}
                className="shrink-0 rounded-full px-4 py-2 text-sm font-semibold"
                style={
                  category === item.id
                    ? { backgroundColor: style.tabBg, color: style.tabText }
                    : { backgroundColor: "#fffaf2", color: "#6E7F75" }
                }
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
        
        <div className="border-t px-4 py-4 sm:px-5" style={{ borderColor: style.line }}>
          <div className="rounded-[1.35rem] p-4" style={{ background: style.focusGradient }}>
            <p className="text-xs font-semibold uppercase tracking-wide text-clay/60">{txt(lang, "Now", "现在就做")}</p>
            <h4 className="mt-1 font-heading text-2xl font-bold text-clay">{primaryAction.title}</h4>
            <p className="mt-1 text-sm text-clay/80">{primaryAction.desc}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {active.quick.map((item) => (
                <span
                  key={item}
                  className="rounded-full px-3 py-1 text-xs font-semibold"
                  style={{ backgroundColor: style.pillBg, color: style.pillText }}
                >
                  {item}
                </span>
              ))}
            </div>
            <button
              type="button"
              onClick={emitMainAction}
              className="mt-4 inline-flex items-center gap-1 rounded-full px-3 py-2 text-sm font-semibold"
              style={{ backgroundColor: style.primaryBg, color: style.primaryText }}
            >
              {txt(lang, "Start this first", "先做这一条")}
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        <div className="border-t px-4 pb-2 pt-3 sm:px-5" style={{ borderColor: style.line }}>
          <div className="mb-1 flex items-center justify-between">
            <h4 className="font-heading text-xl font-bold text-clay">{txt(lang, "Optional backup actions", "备选行动（可选）")}</h4>
            <span className="text-xs font-semibold text-clay/65">
              {restActions.length} {txt(lang, "items", "项")}
            </span>
          </div>
          <div className="divide-y" style={{ borderColor: style.line }}>
            {restActions.map((item) => (
              <button
                key={item.title}
                type="button"
                onClick={() => emitBackupAction(item)}
                className="flex w-full items-start justify-between gap-3 py-3 text-left"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <span
                    className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full"
                    style={{ backgroundColor: style.pillBg, color: style.pillText }}
                  >
                    <Play className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-clay">{item.title}</span>
                    <span className="mt-1 block text-sm text-clay/75">{item.desc}</span>
                  </span>
                </div>
                <span
                  className="shrink-0 rounded-full px-2 py-1 text-[11px] font-semibold"
                  style={{ backgroundColor: style.pillBg, color: style.pillText }}
                >
                  {item.meta}
                </span>
              </button>
            ))}
          </div>
        </div>
      </Card>

      <div className="hidden gap-4 lg:grid lg:grid-cols-[220px,1fr]">
        <Card style={style} className="h-fit lg:sticky lg:top-24">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-clay/60">{txt(lang, "Care", "关怀")}</p>
          <h3 className="mt-1 font-heading text-2xl font-bold text-clay">{txt(lang, "Scene first, one action first", "场景优先，先做一件事")}</h3>
          <p className="mt-1 text-sm text-clay/78">{txt(lang, "Choose your scene and execute one guided step.", "先按场景定位，再执行一条引导步骤。")}</p>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-clay/60">
            {txt(lang, "Categories", "栏目分类")}
          </p>
          <div className="mt-3 space-y-2">
            {categories.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setCategory(item.id)}
                className="w-full rounded-2xl px-3 py-2 text-left text-sm font-semibold transition"
                style={
                  category === item.id
                    ? { backgroundColor: style.tabBg, color: style.tabText }
                    : { backgroundColor: "#fffaf2", color: "#6E7F75" }
                }
              >
                {item.label}
>>>>>>> 356bd4d38d8b7f31d8a35a177e59ac40d7d6cf8a
              </button>
            ))}
          </div>
        </Card>

<<<<<<< HEAD
        <CbtCarePanel
          lang={lang}
          style={style}
          profile={profile}
          checkIns={checkIns}
          refreshToken={cbtRefreshToken}
          onProgramUpdated={onCbtUpdated}
          onOpenProgram={onOpenCbtCenter}
        />
      </section>

      {showMealModal && (
        <MealRecordModal
          isOpen={showMealModal}
          onClose={closeMealRecord}
          onSave={handleSaveMeal}
          mealType={selectedMealType}
          profile={profile}
        />
      )}

      {showExerciseModal && selectedExerciseTask && (
        <ExerciseCheckinModal
          isOpen={showExerciseModal}
          onClose={closeExerciseCheckin}
          onSave={handleSaveExercise}
          task={selectedExerciseTask}
        />
      )}
=======
        <div className="space-y-4">
          <Card style={style}>
            <div className="rounded-[1.4rem] p-4" style={{ background: style.focusGradient }}>
              <p className="text-xs font-semibold uppercase tracking-wide text-clay/60">{txt(lang, "Main Action", "主行动")}</p>
              <h4 className="mt-1 font-heading text-2xl font-bold text-clay">{primaryAction.title}</h4>
              <p className="mt-1 text-sm text-clay/80">{primaryAction.desc}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {active.quick.map((item) => (
                  <span
                    key={item}
                    className="rounded-full px-3 py-1 text-xs font-semibold"
                    style={{ backgroundColor: style.pillBg, color: style.pillText }}
                  >
                    {item}
                  </span>
                ))}
              </div>
              <button
                type="button"
                onClick={emitMainAction}
                className="mt-4 inline-flex items-center gap-1 rounded-full px-3 py-2 text-sm font-semibold"
                style={{ backgroundColor: style.primaryBg, color: style.primaryText }}
              >
                {txt(lang, "Start this first", "先做这一条")}
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </Card>

          <Card style={style}>
            <div className="flex items-center justify-between">
              <h4 className="font-heading text-xl font-bold text-clay">{txt(lang, "Optional backup actions", "备选行动（可选）")}</h4>
              <span className="text-xs font-semibold text-clay/65">
                {restActions.length} {txt(lang, "items", "项")}
              </span>
            </div>
            <div className="mt-2 divide-y" style={{ borderColor: style.line }}>
              {restActions.map((item) => (
                <button
                  key={item.title}
                  type="button"
                  onClick={() => emitBackupAction(item)}
                  className="flex w-full items-start justify-between gap-3 py-3 text-left"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <span
                      className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full"
                      style={{ backgroundColor: style.pillBg, color: style.pillText }}
                    >
                      <Play className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-clay">{item.title}</span>
                      <span className="mt-1 block text-sm text-clay/75">{item.desc}</span>
                    </span>
                  </div>
                  <span
                    className="shrink-0 rounded-full px-2 py-1 text-[11px] font-semibold"
                    style={{ backgroundColor: style.pillBg, color: style.pillText }}
                  >
                    {item.meta}
                  </span>
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>
>>>>>>> 356bd4d38d8b7f31d8a35a177e59ac40d7d6cf8a
    </div>
  );
}
