import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BookHeart,
  CalendarClock,
  ClipboardList,
  HeartHandshake,
  Hospital,
  RefreshCcw,
  ShieldAlert,
} from "lucide-react";
import Card from "../ui/Card";
import { useToast } from "../../contexts/ToastContext";
import {
  createCbtReferral,
  fetchCbtCareTeam,
  fetchCbtModule,
  fetchCbtOverview,
  patchCbtHomework,
  submitCbtIntake,
  submitCbtReassessment,
} from "../../api/cbt";
import { CBT_HOMEWORK_STATUS } from "../../utils/cbtProgram";
import { txt } from "../../utils/txt";

const createDefaultAssessment = () => ({
  epdsScore: 9,
  gad7Score: 8,
  isi7Score: 10,
  selfHarmRisk: false,
  childbirthFear: {
    uncertainty: 1,
    painLossOfControl: 1,
  },
  source: "self_report",
});

function ScoreField({ label, hint, min, max, value, onChange }) {
  return (
    <div className="rounded-2xl border border-sage/20 bg-[#fffaf2] p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-clay">{label}</p>
          <p className="mt-1 text-xs text-clay/62">{hint}</p>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-sm font-bold text-clay">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-3 w-full accent-[#93A89B]"
      />
      <div className="mt-1 flex items-center justify-between text-[11px] text-clay/50">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}

function AssessmentForm({ lang, values, onChange, onSubmit, submitting, submitLabel }) {
  return (
    <div className="space-y-3">
      <div className="grid gap-3 md:grid-cols-3">
        <ScoreField
          label="EPDS"
          hint={txt(lang, "Total score 0-30", "总分 0-30")}
          min={0}
          max={30}
          value={values.epdsScore}
          onChange={(next) => onChange({ ...values, epdsScore: next })}
        />
        <ScoreField
          label="GAD-7"
          hint={txt(lang, "Total score 0-21", "总分 0-21")}
          min={0}
          max={21}
          value={values.gad7Score}
          onChange={(next) => onChange({ ...values, gad7Score: next })}
        />
        <ScoreField
          label="ISI-7"
          hint={txt(lang, "Total score 0-28", "总分 0-28")}
          min={0}
          max={28}
          value={values.isi7Score}
          onChange={(next) => onChange({ ...values, isi7Score: next })}
        />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <ScoreField
          label={txt(lang, "Fear of uncertainty in labor", "对分娩不确定性的恐惧")}
          hint={txt(lang, "0-3", "0-3")}
          min={0}
          max={3}
          value={values.childbirthFear.uncertainty}
          onChange={(next) =>
            onChange({
              ...values,
              childbirthFear: {
                ...values.childbirthFear,
                uncertainty: next,
              },
            })
          }
        />
        <ScoreField
          label={txt(lang, "Fear of pain / losing control", "对疼痛或失控的恐惧")}
          hint={txt(lang, "0-3", "0-3")}
          min={0}
          max={3}
          value={values.childbirthFear.painLossOfControl}
          onChange={(next) =>
            onChange({
              ...values,
              childbirthFear: {
                ...values.childbirthFear,
                painLossOfControl: next,
              },
            })
          }
        />
      </div>

      <div className="rounded-2xl border border-sage/20 bg-[#fffaf2] p-3">
        <p className="text-sm font-semibold text-clay">
          {txt(lang, "Safety gate", "安全闸门")}
        </p>
        <p className="mt-1 text-xs text-clay/62">
          {txt(
            lang,
            "Switch this on if there is any recent self-harm thought or acute safety concern.",
            "如果最近存在任何自伤想法或急性安全风险，请打开。"
          )}
        </p>
        <div className="mt-3 flex gap-2">
          {[false, true].map((choice) => (
            <button
              key={String(choice)}
              type="button"
              onClick={() => onChange({ ...values, selfHarmRisk: choice })}
              className="rounded-full px-4 py-2 text-sm font-semibold"
              style={
                values.selfHarmRisk === choice
                  ? { backgroundColor: choice ? "#e8c5b4" : "#dbe8df", color: choice ? "#a35e38" : "#4f6158" }
                  : { backgroundColor: "#fffaf2", color: "#5d6a61" }
              }
            >
              {choice ? txt(lang, "Yes, immediate review", "是，需要立即评估") : txt(lang, "No current safety issue", "否，目前没有")}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={onSubmit}
        disabled={submitting}
        className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
        style={{ backgroundColor: "#6f8579", color: "#fffdf8" }}
      >
        <ClipboardList className="h-4 w-4" />
        {submitLabel}
      </button>
    </div>
  );
}

export default function CbtProgramCenter({
  lang,
  style,
  profile = {},
  checkIns = [],
  refreshToken = 0,
  onProgramUpdated,
}) {
  const toast = useToast();
  const [overview, setOverview] = useState(null);
  const [moduleDetail, setModuleDetail] = useState(null);
  const [careTeam, setCareTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [assessment, setAssessment] = useState(createDefaultAssessment);
  const [showReassessmentForm, setShowReassessmentForm] = useState(false);
  const [homeworkDraft, setHomeworkDraft] = useState({
    summary: "",
    action: "",
    reflection: "",
  });
  const [selectedSlotId, setSelectedSlotId] = useState("");
  const [referralNote, setReferralNote] = useState("");

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

  const loadProgram = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [overviewData, careTeamData] = await Promise.all([
        fetchCbtOverview(requestContext),
        fetchCbtCareTeam(requestContext),
      ]);
      setOverview(overviewData);
      setCareTeam(careTeamData);
      if (overviewData?.weeklyModule?.weekNumber) {
        const moduleData = await fetchCbtModule(overviewData.weeklyModule.weekNumber, requestContext);
        setModuleDetail(moduleData);
        setHomeworkDraft({
          summary: moduleData?.homework?.response?.summary || "",
          action: moduleData?.homework?.response?.action || "",
          reflection: moduleData?.homework?.response?.reflection || "",
        });
      } else {
        setModuleDetail(null);
      }
      if (overviewData?.intakeAssessment) {
        setAssessment({
          epdsScore: overviewData.intakeAssessment.epdsScore,
          gad7Score: overviewData.intakeAssessment.gad7Score,
          isi7Score: overviewData.intakeAssessment.isi7Score,
          selfHarmRisk: overviewData.intakeAssessment.selfHarmRisk,
          childbirthFear: {
            uncertainty: overviewData.intakeAssessment.childbirthFear?.uncertainty || 0,
            painLossOfControl: overviewData.intakeAssessment.childbirthFear?.painLossOfControl || 0,
          },
          source: overviewData.intakeAssessment.source || "self_report",
        });
      }
      setSelectedSlotId(careTeamData?.careTeamStatus?.slots?.[0]?.id || "");
    } catch (loadError) {
      setError(loadError?.message || txt(lang, "Failed to load CBT program.", "CBT 计划加载失败。"));
    } finally {
      setLoading(false);
    }
  }, [lang, requestContext]);

  useEffect(() => {
    loadProgram();
  }, [loadProgram, refreshToken]);

  const emitUpdated = useCallback(() => {
    if (onProgramUpdated) {
      onProgramUpdated();
    }
  }, [onProgramUpdated]);

  const handleIntake = useCallback(async () => {
    setSubmitting(true);
    setError("");
    try {
      await submitCbtIntake(assessment, requestContext);
      toast.success(txt(lang, "CBT plan created", "CBT 计划已生成"));
      emitUpdated();
      await loadProgram();
    } catch (submitError) {
      const message = submitError?.message || txt(lang, "Failed to create program.", "创建计划失败。");
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }, [assessment, emitUpdated, lang, loadProgram, requestContext, toast]);

  const handleReassessment = useCallback(async () => {
    setSubmitting(true);
    setError("");
    try {
      await submitCbtReassessment(assessment, requestContext);
      toast.success(txt(lang, "Reassessment saved", "复评已保存"));
      setShowReassessmentForm(false);
      emitUpdated();
      await loadProgram();
    } catch (submitError) {
      const message = submitError?.message || txt(lang, "Failed to save reassessment.", "复评保存失败。");
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }, [assessment, emitUpdated, lang, loadProgram, requestContext, toast]);

  const handleSaveHomework = useCallback(
    async (status = moduleDetail?.homework?.status || CBT_HOMEWORK_STATUS.IN_PROGRESS) => {
      if (!moduleDetail?.homework?.id) return;
      setSubmitting(true);
      setError("");
      try {
        await patchCbtHomework(moduleDetail.homework.id, {
          status,
          response: homeworkDraft,
        });
        toast.success(
          status === CBT_HOMEWORK_STATUS.DONE
            ? txt(lang, "Homework completed", "作业已完成")
            : txt(lang, "Homework saved", "作业已保存")
        );
        emitUpdated();
        await loadProgram();
      } catch (saveError) {
        const message = saveError?.message || txt(lang, "Failed to save homework.", "保存作业失败。");
        setError(message);
        toast.error(message);
      } finally {
        setSubmitting(false);
      }
    },
    [emitUpdated, homeworkDraft, lang, loadProgram, moduleDetail?.homework?.id, moduleDetail?.homework?.status, toast]
  );

  const handleReferral = useCallback(async () => {
    setSubmitting(true);
    setError("");
    try {
      await createCbtReferral(
        {
          channel: overview?.crisisState?.active ? "crisis" : "psychology",
          slotId: selectedSlotId,
          note: referralNote,
        },
        requestContext
      );
      toast.success(txt(lang, "Referral intent saved", "转介/预约意向已记录"));
      emitUpdated();
      await loadProgram();
    } catch (referralError) {
      const message = referralError?.message || txt(lang, "Failed to save referral.", "记录转介失败。");
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }, [emitUpdated, lang, loadProgram, overview?.crisisState?.active, referralNote, requestContext, selectedSlotId, toast]);

  if (loading && !overview) {
    return (
      <Card style={style}>
        <p className="text-sm font-semibold text-clay/72">
          {txt(lang, "Loading CBT program center...", "正在加载 CBT 计划中心...")}
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <Card style={style} className="border border-[#e8c5b4] bg-[#fff5ef]">
          <p className="text-sm font-semibold text-[#a35e38]">{error}</p>
        </Card>
      )}

      <Card style={style}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-clay/58">
              {txt(lang, "CBT Program Center", "CBT 计划中心")}
            </p>
            <h3 className="mt-1 font-heading text-2xl font-bold text-clay">
              {overview?.intakeCompleted
                ? overview?.careLevel?.label || txt(lang, "Program Active", "计划进行中")
                : txt(lang, "Start your intake and get a structured plan", "先完成筛查，再生成结构化计划")}
            </h3>
            <p className="mt-1 text-sm text-clay/78">
              {overview?.intakeCompleted
                ? overview?.careLevel?.desc
                : txt(
                    lang,
                    "Record your screening scores, and the app will generate daily, weekly, partner, and referral actions.",
                    "录入筛查结果后，系统会生成你的每日练习、本周作业、伴侣支持和临床协作建议。"
                  )}
            </p>
          </div>
          <div
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full"
            style={{ backgroundColor: style.pillBg, color: style.pillText }}
          >
            <BookHeart className="h-5 w-5" />
          </div>
        </div>

        {!overview?.intakeCompleted && (
          <div className="mt-4">
            <AssessmentForm
              lang={lang}
              values={assessment}
              onChange={setAssessment}
              onSubmit={handleIntake}
              submitting={submitting}
              submitLabel={txt(lang, "Generate my CBT plan", "生成我的 CBT 计划")}
            />
          </div>
        )}
      </Card>

      {overview?.intakeCompleted && (
        <>
          {overview?.crisisState?.active && (
            <Card style={style} className="border border-[#e8c5b4] bg-[#fff5ef]">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[#a35e38]" />
                <div>
                  <h4 className="font-heading text-xl font-bold text-[#a35e38]">
                    {overview.crisisState.title}
                  </h4>
                  <p className="mt-1 text-sm text-[#8e5737]">{overview.crisisState.desc}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {overview.crisisState.actions.map((item) => (
                      <span
                        key={item.id}
                        className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#8e5737]"
                      >
                        {item.label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          )}

          <div className="grid gap-4 xl:grid-cols-[1.15fr,.85fr]">
            <Card style={style}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h4 className="font-heading text-xl font-bold text-clay">
                    {txt(lang, "Today and this week", "今天与本周")}
                  </h4>
                  <p className="mt-1 text-sm text-clay/75">
                    {txt(lang, "Keep the plan small and executable.", "保持计划足够小、足够可执行。")}
                  </p>
                </div>
                <ClipboardList className="h-5 w-5 text-clay/65" />
              </div>

              <div className="mt-4 space-y-3">
                <div className="rounded-[1.35rem] border border-sage/20 bg-[#fffaf2] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-clay/58">
                    {txt(lang, "Today task", "今日任务")}
                  </p>
                  <p className="mt-1 text-base font-semibold text-clay">{overview?.todayTask?.title}</p>
                  <p className="mt-1 text-sm text-clay/72">{overview?.todayTask?.desc}</p>
                  {overview?.todayTask?.meta && (
                    <span className="mt-3 inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold text-clay/72">
                      {overview.todayTask.meta}
                    </span>
                  )}
                </div>

                {moduleDetail && (
                  <div className="rounded-[1.35rem] border border-sage/20 bg-[#fffaf2] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-clay/58">
                      {txt(lang, "Current module", "当前模块")}
                    </p>
                    <p className="mt-1 text-base font-semibold text-clay">
                      {txt(lang, "Week", "第")} {moduleDetail.weekNumber} · {moduleDetail.title}
                    </p>
                    <p className="mt-1 text-sm text-clay/72">{moduleDetail.summary}</p>

                    <div className="mt-4 rounded-2xl bg-white/90 p-3">
                      <p className="text-sm font-semibold text-clay">{moduleDetail?.microPractice?.title}</p>
                      <p className="mt-1 text-sm text-clay/72">{moduleDetail?.microPractice?.desc}</p>
                      <p className="mt-2 text-xs font-semibold text-clay/58">
                        {moduleDetail?.microPractice?.durationLabel}
                      </p>
                    </div>

                    {moduleDetail?.homework && (
                      <div className="mt-4 space-y-3">
                        <div>
                          <p className="text-sm font-semibold text-clay">{moduleDetail.homework.title}</p>
                          <p className="mt-1 text-sm text-clay/72">{moduleDetail.homework.prompt}</p>
                          <p className="mt-1 text-xs text-clay/58">{moduleDetail.homework.helper}</p>
                        </div>
                        <textarea
                          value={homeworkDraft.summary}
                          onChange={(event) => setHomeworkDraft((prev) => ({ ...prev, summary: event.target.value.slice(0, 180) }))}
                          rows={2}
                          placeholder={txt(lang, "What happened? What triggered it?", "发生了什么？触发点是什么？")}
                          className="w-full resize-none rounded-2xl border border-sage/20 bg-white px-3 py-2 text-sm text-clay outline-none"
                        />
                        <textarea
                          value={homeworkDraft.action}
                          onChange={(event) => setHomeworkDraft((prev) => ({ ...prev, action: event.target.value.slice(0, 180) }))}
                          rows={2}
                          placeholder={txt(lang, "What is the next small action?", "下一步的小行动是什么？")}
                          className="w-full resize-none rounded-2xl border border-sage/20 bg-white px-3 py-2 text-sm text-clay outline-none"
                        />
                        <textarea
                          value={homeworkDraft.reflection}
                          onChange={(event) => setHomeworkDraft((prev) => ({ ...prev, reflection: event.target.value.slice(0, 180) }))}
                          rows={2}
                          placeholder={txt(lang, "What did you learn from this?", "你从这次练习里看到了什么？")}
                          className="w-full resize-none rounded-2xl border border-sage/20 bg-white px-3 py-2 text-sm text-clay outline-none"
                        />
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => handleSaveHomework(CBT_HOMEWORK_STATUS.IN_PROGRESS)}
                            disabled={submitting}
                            className="rounded-full border border-sage/20 bg-white px-4 py-2 text-sm font-semibold text-clay transition hover:bg-sage/10"
                          >
                            {txt(lang, "Save draft", "保存草稿")}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveHomework(CBT_HOMEWORK_STATUS.DONE)}
                            disabled={submitting}
                            className="rounded-full px-4 py-2 text-sm font-bold transition hover:brightness-95"
                            style={{ backgroundColor: style.primaryBg, color: style.primaryText }}
                          >
                            {txt(lang, "Mark homework done", "标记作业完成")}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>

            <div className="space-y-4">
              <Card style={style}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h4 className="font-heading text-xl font-bold text-clay">
                      {txt(lang, "Partner support", "伴侣支持")}
                    </h4>
                    <p className="mt-1 text-sm text-clay/75">
                      {txt(lang, "Share only what helps action.", "只共享能帮助行动的内容。")}
                    </p>
                  </div>
                  <HeartHandshake className="h-5 w-5 text-clay/65" />
                </div>
                <div className="mt-4 rounded-[1.35rem] border border-sage/20 bg-[#fffaf2] p-4">
                  <p className="text-sm font-semibold text-clay">{overview?.partnerTaskSummary?.title}</p>
                  <p className="mt-1 text-sm text-clay/72">{overview?.partnerTaskSummary?.desc}</p>
                  {overview?.partnerTaskSummary?.helper && (
                    <p className="mt-2 text-xs text-clay/58">{overview.partnerTaskSummary.helper}</p>
                  )}
                </div>
              </Card>

              <Card style={style}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h4 className="font-heading text-xl font-bold text-clay">
                      {txt(lang, "Reassessment cadence", "复评节奏")}
                    </h4>
                    <p className="mt-1 text-sm text-clay/75">
                      {txt(lang, "Biweekly check keeps level changes visible.", "双周复评让分层变化可见。")}
                    </p>
                  </div>
                  <CalendarClock className="h-5 w-5 text-clay/65" />
                </div>
                <div className="mt-4 rounded-[1.35rem] border border-sage/20 bg-[#fffaf2] p-4">
                  <p className="text-sm font-semibold text-clay">
                    {overview?.reassessmentDueInDays === 0
                      ? txt(lang, "Reassessment is due today", "今天需要完成复评")
                      : txt(
                          lang,
                          `${overview?.reassessmentDueInDays ?? 0} days until reassessment`,
                          `${overview?.reassessmentDueInDays ?? 0} 天后复评`
                        )}
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowReassessmentForm((prev) => !prev)}
                    className="mt-3 inline-flex items-center gap-2 rounded-full border border-sage/20 bg-white px-4 py-2 text-sm font-semibold text-clay transition hover:bg-sage/10"
                  >
                    <RefreshCcw className="h-4 w-4" />
                    {showReassessmentForm
                      ? txt(lang, "Hide reassessment", "收起复评")
                      : txt(lang, "Open reassessment", "打开复评")}
                  </button>
                </div>
                {showReassessmentForm && (
                  <div className="mt-4">
                    <AssessmentForm
                      lang={lang}
                      values={assessment}
                      onChange={setAssessment}
                      onSubmit={handleReassessment}
                      submitting={submitting}
                      submitLabel={txt(lang, "Save reassessment", "保存复评")}
                    />
                  </div>
                )}
              </Card>

              <Card style={style}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h4 className="font-heading text-xl font-bold text-clay">
                      {txt(lang, "Clinical follow-up", "临床协作")}
                    </h4>
                    <p className="mt-1 text-sm text-clay/75">
                      {careTeam?.summary || txt(lang, "Referral, follow-up and crisis routing.", "转介、随访与危机转介。")}
                    </p>
                  </div>
                  {overview?.crisisState?.active ? (
                    <ShieldAlert className="h-5 w-5 text-[#a35e38]" />
                  ) : (
                    <Hospital className="h-5 w-5 text-clay/65" />
                  )}
                </div>
                <div className="mt-4 space-y-3">
                  <div className="rounded-[1.35rem] border border-sage/20 bg-[#fffaf2] p-4">
                    <p className="text-sm font-semibold text-clay">
                      {careTeam?.careTeamStatus?.referralRecommended
                        ? txt(lang, "Referral recommended", "建议转介/随访")
                        : txt(lang, "Self-guided stage", "当前以自助为主")}
                    </p>
                    <p className="mt-1 text-sm text-clay/72">{careTeam?.careTeamStatus?.note}</p>
                  </div>
                  {Array.isArray(careTeam?.careTeamStatus?.slots) && careTeam.careTeamStatus.slots.length > 0 && (
                    <div className="space-y-2">
                      {careTeam.careTeamStatus.slots.map((slot) => (
                        <button
                          key={slot.id}
                          type="button"
                          onClick={() => setSelectedSlotId(slot.id)}
                          className="w-full rounded-2xl border px-4 py-3 text-left text-sm transition"
                          style={
                            selectedSlotId === slot.id
                              ? { borderColor: style.tabBg, backgroundColor: style.tabBg, color: style.tabText }
                              : { borderColor: style.line, backgroundColor: "#fffaf2", color: "#5d6a61" }
                          }
                        >
                          {slot.label}
                        </button>
                      ))}
                    </div>
                  )}
                  <textarea
                    value={referralNote}
                    onChange={(event) => setReferralNote(event.target.value.slice(0, 160))}
                    rows={2}
                    placeholder={txt(lang, "Optional note for referral or follow-up", "可选：补充本次转介/随访说明")}
                    className="w-full resize-none rounded-2xl border border-sage/20 bg-white px-3 py-2 text-sm text-clay outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleReferral}
                    disabled={submitting || !careTeam?.careTeamStatus?.referralRecommended}
                    className="rounded-full px-4 py-2 text-sm font-bold transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
                    style={{ backgroundColor: style.primaryBg, color: style.primaryText }}
                  >
                    {txt(lang, "Save referral intent", "记录转介/预约意向")}
                  </button>
                </div>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

