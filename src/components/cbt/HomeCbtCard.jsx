import { AlertTriangle, ArrowRight, ClipboardCheck, HeartHandshake, ShieldPlus } from "lucide-react";
import Card from "../ui/Card";
import { txt } from "../../utils/txt";

const getLevelTone = (level) => {
  if (level === "level3") {
    return {
      badgeBg: "#fff1eb",
      badgeColor: "#a35e38",
      border: "#e8c5b4",
      icon: AlertTriangle,
    };
  }
  if (level === "level2") {
    return {
      badgeBg: "#fff7e7",
      badgeColor: "#9f7b26",
      border: "rgba(216, 189, 112, .35)",
      icon: ShieldPlus,
    };
  }
  return {
    badgeBg: "rgba(149,169,157,.18)",
    badgeColor: "#4f6158",
    border: "rgba(149,169,157,.24)",
    icon: ClipboardCheck,
  };
};

export default function HomeCbtCard({ lang, style, overview, loading = false, onOpen }) {
  if (loading) {
    return (
      <Card style={style}>
        <p className="text-sm font-semibold text-clay/72">
          {txt(lang, "Loading CBT program...", "正在加载 CBT 计划...")}
        </p>
      </Card>
    );
  }

  if (!overview) return null;

  const levelTone = getLevelTone(overview?.careLevel?.code);
  const ToneIcon = levelTone.icon;
  const crisisActive = overview?.crisisState?.active;

  return (
    <Card style={style}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="rounded-full px-3 py-1 text-xs font-semibold"
              style={{ backgroundColor: levelTone.badgeBg, color: levelTone.badgeColor }}
            >
              {overview?.careLevel?.label || txt(lang, "CBT Program", "CBT计划")}
            </span>
            {overview?.reassessmentDueInDays !== null && overview?.reassessmentDueInDays !== undefined && (
              <span
                className="rounded-full px-3 py-1 text-xs font-semibold"
                style={{ backgroundColor: style.pillBg, color: style.pillText }}
              >
                {overview.reassessmentDueInDays === 0
                  ? txt(lang, "Reassessment due", "今天需要复评")
                  : txt(lang, `${overview.reassessmentDueInDays} days to reassessment`, `${overview.reassessmentDueInDays}天后复评`)}
              </span>
            )}
          </div>
          <h3 className="mt-3 font-heading text-2xl font-bold text-clay">
            {crisisActive
              ? txt(lang, "Safety first today", "今天先做安全与转介")
              : txt(lang, "Your CBT plan for today", "今天的 CBT 计划")}
          </h3>
          <p className="mt-1 text-sm text-clay/78">
            {crisisActive ? overview?.crisisState?.desc : overview?.todayTask?.desc}
          </p>
        </div>
        <div
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full"
          style={{ backgroundColor: levelTone.badgeBg, color: levelTone.badgeColor }}
        >
          <ToneIcon className="h-5 w-5" />
        </div>
      </div>

      <div
        className="mt-4 rounded-[1.35rem] border p-4"
        style={{
          borderColor: crisisActive ? "#e8c5b4" : levelTone.border,
          background: crisisActive ? "#fff5ef" : "#fffaf2",
        }}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-clay/72">
            {overview?.todayTask?.meta || txt(lang, "Daily task", "今日任务")}
          </span>
          {overview?.partnerTaskSummary?.title && (
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-clay/72">
              <HeartHandshake className="mr-1 inline h-3.5 w-3.5" />
              {txt(lang, "Partner linked", "伴侣联动")}
            </span>
          )}
        </div>
        <p className="mt-3 text-base font-semibold text-clay">
          {crisisActive ? overview?.crisisState?.title : overview?.todayTask?.title}
        </p>
        {overview?.weeklyModule?.title && !crisisActive && (
          <p className="mt-1 text-sm text-clay/72">
            {txt(lang, "This week", "本周模块")} · {overview.weeklyModule.title}
          </p>
        )}
        {overview?.partnerTaskSummary?.title && (
          <div className="mt-3 rounded-2xl bg-white/90 p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-clay/58">
              {txt(lang, "Partner support", "伴侣支持")}
            </p>
            <p className="mt-1 text-sm font-semibold text-clay">{overview.partnerTaskSummary.title}</p>
            <p className="mt-1 text-sm text-clay/72">{overview.partnerTaskSummary.desc}</p>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-clay/72">
          {txt(
            lang,
            `${overview?.progress?.completedModules || 0}/${overview?.progress?.totalModules || 0} modules completed`,
            `已完成 ${overview?.progress?.completedModules || 0}/${overview?.progress?.totalModules || 0} 个模块`
          )}
        </div>
        <button
          type="button"
          onClick={onOpen}
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition hover:brightness-95"
          style={{ backgroundColor: style.primaryBg, color: style.primaryText }}
        >
          {txt(lang, "Open CBT center", "打开 CBT 计划中心")}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </Card>
  );
}

