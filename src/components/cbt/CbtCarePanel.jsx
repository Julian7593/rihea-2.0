import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, ClipboardList, HeartHandshake } from "lucide-react";
import Card from "../ui/Card";
import { useToast } from "../../contexts/ToastContext";
import { fetchCbtModule, fetchCbtOverview, patchCbtHomework } from "../../api/cbt";
import { CBT_HOMEWORK_STATUS } from "../../utils/cbtProgram";
import { txt } from "../../utils/txt";

export default function CbtCarePanel({
  lang,
  style,
  profile = {},
  checkIns = [],
  refreshToken = 0,
  onProgramUpdated,
  onOpenProgram,
}) {
  const toast = useToast();
  const [overview, setOverview] = useState(null);
  const [moduleDetail, setModuleDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const overviewData = await fetchCbtOverview(requestContext);
      setOverview(overviewData);
      if (overviewData?.weeklyModule?.weekNumber) {
        const moduleData = await fetchCbtModule(overviewData.weeklyModule.weekNumber, requestContext);
        setModuleDetail(moduleData);
      } else {
        setModuleDetail(null);
      }
    } catch {
      setOverview(null);
      setModuleDetail(null);
    } finally {
      setLoading(false);
    }
  }, [requestContext]);

  useEffect(() => {
    refresh();
  }, [refresh, refreshToken]);

  const markDone = useCallback(async () => {
    if (!moduleDetail?.homework?.id) {
      onOpenProgram?.();
      return;
    }

    setSaving(true);
    try {
      await patchCbtHomework(moduleDetail.homework.id, {
        status: CBT_HOMEWORK_STATUS.DONE,
      });
      toast.success(txt(lang, "Homework marked done", "作业已标记完成"));
      if (onProgramUpdated) {
        onProgramUpdated();
      }
      await refresh();
    } catch (error) {
      toast.error(error?.message || txt(lang, "Failed to update homework", "更新作业失败"));
    } finally {
      setSaving(false);
    }
  }, [lang, moduleDetail?.homework?.id, onOpenProgram, onProgramUpdated, refresh, toast]);

  if (loading) {
    return (
      <Card style={style}>
        <p className="text-sm font-semibold text-clay/72">
          {txt(lang, "Loading CBT execution panel...", "正在加载 CBT 执行面板...")}
        </p>
      </Card>
    );
  }

  if (!overview) return null;

  return (
    <Card style={style}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-clay/58">
            {txt(lang, "CBT Execution", "CBT 执行面板")}
          </p>
          <h3 className="mt-1 font-heading text-2xl font-bold text-clay">
            {overview?.intakeCompleted
              ? txt(lang, "Do the plan before browsing more content", "先执行计划，再看更多内容")
              : txt(lang, "Complete intake first", "先完成 CBT 筛查")}
          </h3>
          <p className="mt-1 text-sm text-clay/78">
            {overview?.intakeCompleted
              ? txt(lang, "Start with today's one smallest CBT action.", "先从今天最小的一条 CBT 行动开始。")
              : txt(lang, "The CBT center will generate your daily and weekly actions.", "CBT 中心会生成你的每日与每周行动。")}
          </p>
        </div>
        <ClipboardList className="h-5 w-5 shrink-0 text-clay/65" />
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[1.1fr,.9fr]">
        <div className="rounded-[1.35rem] border border-sage/20 bg-[#fffaf2] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-clay/58">
            {txt(lang, "Today", "今天")}
          </p>
          <p className="mt-1 text-base font-semibold text-clay">{overview?.todayTask?.title}</p>
          <p className="mt-1 text-sm text-clay/72">{overview?.todayTask?.desc}</p>
          {moduleDetail?.microPractice?.title && (
            <div className="mt-3 rounded-2xl bg-white/90 p-3">
              <p className="text-sm font-semibold text-clay">{moduleDetail.microPractice.title}</p>
              <p className="mt-1 text-sm text-clay/72">{moduleDetail.microPractice.desc}</p>
              <p className="mt-2 text-xs text-clay/58">{moduleDetail.microPractice.durationLabel}</p>
            </div>
          )}
        </div>

        <div className="rounded-[1.35rem] border border-sage/20 bg-[#fffaf2] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-clay/58">
            {txt(lang, "This week", "本周")}
          </p>
          <p className="mt-1 text-base font-semibold text-clay">{moduleDetail?.title || overview?.weeklyModule?.title}</p>
          <p className="mt-1 text-sm text-clay/72">
            {moduleDetail?.homework?.prompt || overview?.weeklyModule?.homework?.prompt || txt(lang, "Open CBT center to see the structured homework.", "打开 CBT 中心查看结构化作业。")}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-clay/72">
              {overview?.careLevel?.label}
            </span>
            {overview?.partnerTaskSummary?.title && (
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-clay/72">
                <HeartHandshake className="mr-1 inline h-3.5 w-3.5" />
                {txt(lang, "Partner task ready", "伴侣任务已生成")}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={markDone}
          disabled={saving || !overview?.intakeCompleted}
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
          style={{ backgroundColor: style.primaryBg, color: style.primaryText }}
        >
          <CheckCircle2 className="h-4 w-4" />
          {txt(lang, "Mark this week's homework done", "标记本周作业完成")}
        </button>
        <button
          type="button"
          onClick={onOpenProgram}
          className="inline-flex items-center gap-2 rounded-full border border-sage/20 bg-[#fffaf2] px-4 py-2 text-sm font-semibold text-clay transition hover:bg-sage/10"
        >
          {txt(lang, "Open full CBT center", "打开完整 CBT 中心")}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </Card>
  );
}

