import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, CalendarClock, CalendarHeart, ChevronLeft, HeartPulse, UserRound, X } from "lucide-react";
import { txt } from "../../utils/txt";

const STAGE_OPTIONS = [
  { id: "t1", en: "Early stage (1-12 weeks)", zh: "早孕阶段（1-12周）" },
  { id: "t2", en: "Middle stage (13-27 weeks)", zh: "中孕阶段（13-27周）" },
  { id: "t3", en: "Late stage (28+ weeks)", zh: "晚孕阶段（28周以上）" },
  { id: "unknown", en: "Not sure yet", zh: "暂时不确定" },
];

const PRIORITY_OPTIONS = [
  {
    id: "checkin",
    Icon: CalendarHeart,
    enTitle: "Quick mood check-in",
    zhTitle: "先做情绪签到",
    enDesc: "Capture today's state in 30 seconds.",
    zhDesc: "30秒记录今天状态。",
  },
  {
    id: "breathe",
    Icon: HeartPulse,
    enTitle: "Calm my body first",
    zhTitle: "先稳住身体信号",
    enDesc: "Start 3-minute breathing reset.",
    zhDesc: "开始3分钟呼吸稳态。",
  },
  {
    id: "trend",
    Icon: CalendarClock,
    enTitle: "See weekly trend",
    zhTitle: "先看每周趋势",
    enDesc: "Open week progress and trend section.",
    zhDesc: "查看孕周进度和趋势模块。",
  },
];

const REMINDER_OPTIONS = [
  { id: "on", en: "Enable daily reminder", zh: "开启每日提醒" },
  { id: "off", en: "No reminder for now", zh: "暂不开启提醒" },
];

const STEP_COUNT = 4;

const defaultAnswers = {
  nickname: "",
  stage: "",
  priority: "",
  reminder: "on",
};

const fallbackStyle = {
  bg: "radial-gradient(circle at 14% 9%, rgba(230,170,196,.22), transparent 32%), radial-gradient(circle at 86% 14%, rgba(156,176,163,.24), transparent 38%), linear-gradient(180deg, #fdfaf4 0%, #f7f2e8 100%)",
  panel: "linear-gradient(165deg, rgba(255,255,255,.72), rgba(248,243,234,.58))",
  line: "rgba(156,176,163,.32)",
  tabBg: "rgba(156,176,163,.24)",
  tabText: "#55675D",
  primaryBg: "#E6AAC4",
  primaryText: "#4E3B45",
  cardShadow: "0 20px 40px -28px rgba(104, 118, 110, .5)",
};

const chooseText = (lang, en, zh) => (lang === "zh" ? zh : en);

export default function LaunchWelcome({
  lang,
  onComplete,
  onSkip,
  initialAnswers,
  style,
  glassTone = "rich",
  perfLite = false,
}) {
  const ui = style || fallbackStyle;
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState(() => ({
    ...defaultAnswers,
    ...(initialAnswers || {}),
  }));

  const stageList = useMemo(
    () => STAGE_OPTIONS.map((item) => ({ ...item, label: chooseText(lang, item.en, item.zh) })),
    [lang]
  );
  const priorityList = useMemo(
    () =>
      PRIORITY_OPTIONS.map((item) => ({
        ...item,
        title: chooseText(lang, item.enTitle, item.zhTitle),
        desc: chooseText(lang, item.enDesc, item.zhDesc),
      })),
    [lang]
  );
  const reminderList = useMemo(
    () => REMINDER_OPTIONS.map((item) => ({ ...item, label: chooseText(lang, item.en, item.zh) })),
    [lang]
  );

  const canProceed = useMemo(() => {
    if (step === 0) return true;
    if (step === 1) return Boolean(answers.stage);
    if (step === 2) return Boolean(answers.priority);
    if (step === 3) return Boolean(answers.reminder);
    return false;
  }, [answers.priority, answers.reminder, answers.stage, step]);

  const currentPriority = useMemo(
    () => priorityList.find((item) => item.id === answers.priority) || null,
    [answers.priority, priorityList]
  );

  const primaryLabel =
    step < STEP_COUNT - 1
      ? txt(lang, "Next", "下一步")
      : currentPriority
        ? txt(lang, "Start this path", "按该路径开始")
        : txt(lang, "Finish and start", "完成并开始");

  const goPrev = () => setStep((value) => Math.max(0, value - 1));

  const goNext = () => {
    if (!canProceed) return;
    if (step < STEP_COUNT - 1) {
      setStep((value) => value + 1);
      return;
    }
    if (onComplete) {
      onComplete({
        nickname: answers.nickname.trim().slice(0, 20),
        stage: answers.stage || "unknown",
        priority: answers.priority || "checkin",
        reminder: answers.reminder || "on",
      });
    } else {
      onSkip?.();
    }
  };

  const setNickname = (value) =>
    setAnswers((prev) => ({ ...prev, nickname: value.slice(0, 20) }));

  const wrapperToneClass = glassTone === "clear" ? "glass-tone-clear" : "glass-tone-rich";

  return (
    <motion.section
      role="dialog"
      aria-modal="true"
      aria-labelledby="launch-welcome-title"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`fixed inset-0 z-[120] overflow-y-auto ${wrapperToneClass} ${perfLite ? "perf-lite" : ""}`}
      style={{ background: ui.bg }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 10% 12%, rgba(255,255,255,.22), transparent 34%), radial-gradient(circle at 86% 9%, rgba(255,255,255,.18), transparent 32%)",
        }}
      />

      <main className="relative z-10 mx-auto flex min-h-full w-full max-w-6xl items-end px-3 pb-8 pt-5 sm:px-6 sm:pb-10 sm:pt-6">
        <div
          className="glass-surface glass-tier-soft w-full rounded-[1.65rem] border p-4 shadow-soft sm:rounded-[2.3rem] sm:p-5 lg:p-6"
          style={{
            "--glass-bg": ui.panel,
            "--glass-line": ui.line,
            "--glass-shadow": ui.cardShadow,
            "--glass-fallback": "rgba(255, 252, 247, 0.92)",
            "--glass-accessible": "rgba(255, 252, 247, 0.98)",
          }}
        >
          <header className="mb-3 flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-clay/70">
              {lang === "zh" ? `启动问答 ${step + 1}/${STEP_COUNT}` : `Launch Setup ${step + 1}/${STEP_COUNT}`}
            </p>
            <button
              type="button"
              onClick={onSkip}
              className="glass-control inline-flex h-10 w-10 items-center justify-center rounded-full text-clay transition"
              aria-label={txt(lang, "Skip welcome screen", "跳过欢迎页")}
            >
              <X className="h-5 w-5" />
            </button>
          </header>

          <div className="mb-4 grid grid-cols-4 gap-1.5">
            {[0, 1, 2, 3].map((value) => (
              <span
                key={value}
                className="h-1.5 rounded-full transition-all"
                style={step === value ? { backgroundColor: ui.primaryBg } : { backgroundColor: ui.tabBg }}
              />
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.section
              key={`launch-q-${step}`}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              {step === 0 && (
                <div>
                  <h1 id="launch-welcome-title" className="text-center font-heading text-[1.75rem] font-bold leading-tight text-clay sm:text-[2rem]">
                    {txt(lang, "How should we call you?", "我们该怎么称呼你？")}
                  </h1>
                  <p className="mt-2 text-center text-[0.95rem] text-clay/82 sm:text-base">
                    {txt(lang, "Optional, helps us personalize your home card.", "可选，用于个性化首页问候。")}
                  </p>
                  <label className="mx-auto mt-5 block max-w-[520px]">
                    <span className="mb-1.5 inline-flex items-center gap-1.5 text-sm font-semibold text-clay/78">
                      <UserRound className="h-4 w-4" />
                      {txt(lang, "Nickname", "昵称")}
                    </span>
                    <input
                      type="text"
                      value={answers.nickname}
                      onChange={(event) => setNickname(event.target.value)}
                      placeholder={txt(lang, "e.g. Yiting", "例如：怡婷")}
                      className="glass-input w-full rounded-2xl px-4 py-3 text-base text-clay outline-none transition"
                      autoFocus
                      maxLength={20}
                    />
                    <p className="mt-1 text-right text-xs text-clay/58">{answers.nickname.length}/20</p>
                  </label>
                </div>
              )}

              {step === 1 && (
                <div>
                  <h2 id="launch-welcome-title" className="text-center font-heading text-[1.65rem] font-bold leading-tight text-clay sm:text-[1.9rem]">
                    {txt(lang, "Which stage are you in now?", "你现在大约处于哪个阶段？")}
                  </h2>
                  <p className="mt-2 text-center text-[0.95rem] text-clay/82 sm:text-base">
                    {txt(lang, "Used to adapt content tone and pace.", "用于调整内容节奏与提示密度。")}
                  </p>
                  <div className="mx-auto mt-5 max-w-[560px] space-y-2.5">
                    {stageList.map((item) => {
                      const active = answers.stage === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setAnswers((prev) => ({ ...prev, stage: item.id }))}
                          className="glass-subcard flex w-full items-center justify-between rounded-2xl border px-3.5 py-3 text-left transition"
                          style={active ? { backgroundColor: ui.tabBg, borderColor: ui.line, color: ui.tabText } : undefined}
                        >
                          <span className="text-sm font-semibold">{item.label}</span>
                          {active && <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: ui.primaryBg }} />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div>
                  <h2 id="launch-welcome-title" className="text-center font-heading text-[1.65rem] font-bold leading-tight text-clay sm:text-[1.9rem]">
                    {txt(lang, "What do you need first today?", "你今天最想先做哪一步？")}
                  </h2>
                  <p className="mt-2 text-center text-[0.95rem] text-clay/82 sm:text-base">
                    {txt(lang, "We will take you there directly after onboarding.", "完成后会直接带你进入该模块。")}
                  </p>
                  <div className="mx-auto mt-5 max-w-[620px] space-y-2.5">
                    {priorityList.map((item) => {
                      const active = answers.priority === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setAnswers((prev) => ({ ...prev, priority: item.id }))}
                          className="glass-subcard flex w-full items-start gap-3 rounded-2xl border px-3.5 py-3 text-left transition"
                          style={active ? { backgroundColor: ui.tabBg, borderColor: ui.line, color: ui.tabText } : undefined}
                        >
                          <span
                            className="grid h-9 w-9 shrink-0 place-items-center rounded-full"
                            style={
                              active
                                ? { backgroundColor: ui.primaryBg, color: ui.primaryText }
                                : { backgroundColor: ui.tabBg, color: ui.tabText }
                            }
                          >
                            <item.Icon className="h-4 w-4" />
                          </span>
                          <span className="min-w-0">
                            <span className="block text-sm font-bold">{item.title}</span>
                            <span className="mt-0.5 block text-sm text-clay/74">{item.desc}</span>
                          </span>
                          {active && <span className="mt-1 h-2.5 w-2.5 rounded-full" style={{ backgroundColor: ui.primaryBg }} />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {step === 3 && (
                <div>
                  <h2 id="launch-welcome-title" className="text-center font-heading text-[1.65rem] font-bold leading-tight text-clay sm:text-[1.9rem]">
                    {txt(lang, "Enable daily reminder?", "是否开启每日提醒？")}
                  </h2>
                  <p className="mt-2 text-center text-[0.95rem] text-clay/82 sm:text-base">
                    {txt(lang, "Can be changed later in settings.", "之后可在设置中随时调整。")}
                  </p>
                  <div className="mx-auto mt-5 max-w-[560px] space-y-2.5">
                    {reminderList.map((item) => {
                      const active = answers.reminder === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setAnswers((prev) => ({ ...prev, reminder: item.id }))}
                          className="glass-subcard flex w-full items-center justify-between rounded-2xl border px-3.5 py-3 text-left transition"
                          style={active ? { backgroundColor: ui.tabBg, borderColor: ui.line, color: ui.tabText } : undefined}
                        >
                          <span className="text-sm font-semibold">{item.label}</span>
                          {active && <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: ui.primaryBg }} />}
                        </button>
                      );
                    })}
                  </div>

                  {currentPriority && (
                    <div className="glass-subcard mx-auto mt-4 max-w-[560px] rounded-2xl border p-3" style={{ borderColor: ui.line }}>
                      <p className="text-sm font-semibold text-clay">
                        {txt(lang, "Next destination:", "将跳转到：")} {currentPriority.title}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </motion.section>
          </AnimatePresence>

          <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
            {step > 0 && (
              <button
                type="button"
                onClick={goPrev}
                className="glass-control inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-3 text-sm font-bold text-clay transition"
              >
                <ChevronLeft className="h-4 w-4" />
                {txt(lang, "Back", "上一步")}
              </button>
            )}
            <button
              type="button"
              onClick={goNext}
              disabled={!canProceed}
              className={`inline-flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-extrabold transition ${canProceed ? "hover:brightness-95" : "cursor-not-allowed opacity-70"}`}
              style={
                canProceed
                  ? { backgroundColor: ui.primaryBg, color: ui.primaryText }
                  : { backgroundColor: ui.tabBg, color: ui.tabText }
              }
            >
              {primaryLabel}
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onSkip}
              className="glass-control inline-flex flex-1 items-center justify-center rounded-full px-4 py-3 text-sm font-bold text-clay transition"
            >
              {txt(lang, "Skip for now", "跳过，先进入首页")}
            </button>
          </div>
        </div>
      </main>
    </motion.section>
  );
}
