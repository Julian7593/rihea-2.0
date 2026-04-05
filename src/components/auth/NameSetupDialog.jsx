import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, CalendarDays, MapPin, Phone, ShieldCheck, UserRound, X } from "lucide-react";
import {
  PREGNANCY_DATING_METHOD,
  calcDueDateByMethod,
  calcPregnancyWeekByDueDate,
  isValidWeekLabel,
  normalizeWeekLabel,
  validateDueDatePlausible,
} from "../../utils/pregnancy";
import { txt } from "../../utils/txt";

const createDraft = (profile) => ({
  name: profile?.name || "",
  dueDate: profile?.dueDate || "",
  pregnancyWeek: profile?.pregnancyWeek || "",
  datingMethod: profile?.datingMethod || PREGNANCY_DATING_METHOD.DUE_DATE,
  lmpDate: profile?.lmpDate || "",
  cycleLength: String(Number(profile?.cycleLength) || 28),
  ivfTransferDate: profile?.ivfTransferDate || "",
  embryoAgeDays: Number(profile?.embryoAgeDays) === 3 ? 3 : 5,
  city: profile?.city || "",
  phone: profile?.phone || "",
});

export default function NameSetupDialog({ lang, style, initialProfile, canClose, onClose, onSubmit }) {
  const [form, setForm] = useState(() => createDraft(initialProfile));
  const [agreed, setAgreed] = useState(Boolean(initialProfile?.agreed));
  const [error, setError] = useState("");

  useEffect(() => {
    setForm(createDraft(initialProfile));
    setAgreed(Boolean(initialProfile?.agreed));
  }, [initialProfile]);

  const computedDueDate = useMemo(
    () =>
      calcDueDateByMethod({
        datingMethod: form.datingMethod,
        dueDate: form.dueDate,
        lmpDate: form.lmpDate,
        cycleLength: Number(form.cycleLength),
        ivfTransferDate: form.ivfTransferDate,
        embryoAgeDays: Number(form.embryoAgeDays),
      }),
    [form.datingMethod, form.dueDate, form.lmpDate, form.cycleLength, form.ivfTransferDate, form.embryoAgeDays]
  );

  const autoPregnancyWeek = useMemo(
    () => calcPregnancyWeekByDueDate(computedDueDate),
    [computedDueDate]
  );

  const submit = () => {
    const cleaned = form.name.trim();
    if (!cleaned) {
      setError(txt(lang, "Please enter your name first.", "请先填写你的名字。"));
      return;
    }
    if (cleaned.length > 20) {
      setError(txt(lang, "Name should be under 20 characters.", "名字请控制在20个字以内。"));
      return;
    }
    if (form.datingMethod === PREGNANCY_DATING_METHOD.DUE_DATE && !form.dueDate) {
      setError(txt(lang, "Please select due date.", "请先选择预产期。"));
      return;
    }
    if (form.datingMethod === PREGNANCY_DATING_METHOD.LMP && !form.lmpDate) {
      setError(txt(lang, "Please select your last menstrual period date.", "请先选择末次月经日期。"));
      return;
    }
    if (
      form.datingMethod === PREGNANCY_DATING_METHOD.LMP &&
      (!Number.isFinite(Number(form.cycleLength)) || Number(form.cycleLength) < 21 || Number(form.cycleLength) > 35)
    ) {
      setError(txt(lang, "Cycle length should be between 21 and 35 days.", "月经周期建议填写 21-35 天。"));
      return;
    }
    if (form.datingMethod === PREGNANCY_DATING_METHOD.IVF && !form.ivfTransferDate) {
      setError(txt(lang, "Please select embryo transfer date.", "请先选择胚胎移植日期。"));
      return;
    }
    if (form.phone.trim() && !/^[0-9+\-\s]{6,20}$/.test(form.phone.trim())) {
      setError(txt(lang, "Invalid phone format.", "手机号格式不正确。"));
      return;
    }
    if (!computedDueDate) {
      setError(txt(lang, "Unable to calculate due date. Please check inputs.", "无法计算预产期，请检查填写信息。"));
      return;
    }
    const plausible = validateDueDatePlausible(computedDueDate);
    if (!plausible.ok) {
      setError(
        txt(
          lang,
          "The estimated due date is outside normal onboarding range. Please verify with your clinician.",
          "该预产期超出常见范围，请结合医生评估后再确认。"
        )
      );
      return;
    }
    if (form.pregnancyWeek.trim() && !isValidWeekLabel(form.pregnancyWeek.trim())) {
      setError(txt(lang, "Week format should be like 24+3.", "孕周格式请填写为 24+3。"));
      return;
    }
    if (!agreed) {
      setError(txt(lang, "Please agree to privacy statement.", "请先勾选同意隐私说明。"));
      return;
    }

    const weekOverride = normalizeWeekLabel(form.pregnancyWeek.trim());
    const finalWeek = weekOverride || autoPregnancyWeek;

    setError("");
    onSubmit({
      name: cleaned,
      dueDate: computedDueDate,
      pregnancyWeek: finalWeek,
      datingMethod: form.datingMethod,
      lmpDate: form.lmpDate,
      cycleLength: Number(form.cycleLength) || 28,
      ivfTransferDate: form.ivfTransferDate,
      embryoAgeDays: Number(form.embryoAgeDays) === 3 ? 3 : 5,
      city: form.city.trim(),
      phone: form.phone.trim(),
      agreed: true,
    });
  };

  const datingHint =
    form.datingMethod === PREGNANCY_DATING_METHOD.DUE_DATE
      ? txt(lang, "Use this when your due date is already confirmed by clinician/scan.", "适用于医生或B超已给出预产期。")
      : form.datingMethod === PREGNANCY_DATING_METHOD.LMP
        ? txt(lang, "Calculated from LMP + cycle length. For irregular cycles, confirm with ultrasound.", "按末次月经+周期推算，周期不规律请以B超为准。")
        : txt(lang, "IVF estimate uses transfer date and embryo age (D3/D5).", "试管方案按移植日期和胚龄（D3/D5）推算。");

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[70] bg-[#314136]/36 backdrop-blur-[3px]"
      />

      <motion.section
        role="dialog"
        aria-modal="true"
        aria-labelledby="name-setup-title"
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.98 }}
        transition={{ type: "spring", stiffness: 300, damping: 26 }}
        className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-4"
      >
        <div className="flex w-full max-w-[620px] max-h-[calc(100dvh-1.5rem)] flex-col rounded-[2rem] border border-sage/25 bg-[#f8f4eb] p-5 shadow-soft sm:max-h-[calc(100dvh-2rem)] sm:p-7">
          <div className="flex shrink-0 items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-clay/60">{txt(lang, "Welcome", "欢迎使用")}</p>
              <h2 id="name-setup-title" className="mt-1 font-heading text-3xl font-bold text-clay">
                {txt(lang, "Sign in and complete profile", "登录并完善用户资料")}
              </h2>
              <p className="mt-2 text-sm text-clay/75">
                {txt(
                  lang,
                  "Profile supports smarter due-date estimation and auto week sync.",
                  "支持更智能的预产期推算，并自动同步孕周。"
                )}
              </p>
            </div>
            {canClose && (
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-sage/25 bg-white text-clay transition hover:bg-sage/10"
                aria-label={txt(lang, "Close", "关闭")}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="mt-5 min-h-0 overflow-y-auto overscroll-contain pr-1">
            <div className="grid gap-3 rounded-[1.5rem] border border-sage/20 bg-[#fffaf2] p-4">
              <label className="space-y-1">
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-clay/80">
                  <UserRound className="h-4 w-4" />
                  {txt(lang, "Your name", "你的名字")}
                </span>
                <input
                  id="rihea-name"
                  type="text"
                  value={form.name}
                  onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder={txt(lang, "e.g. Yiting", "例如：怡婷")}
                  className="w-full rounded-2xl border border-sage/25 bg-white px-4 py-3 text-base text-clay outline-none transition placeholder:text-clay/45 focus:border-sage/45"
                  autoFocus
                  maxLength={20}
                />
              </label>

              <div className="space-y-2 rounded-2xl border border-sage/15 bg-white/75 p-3">
                <p className="text-sm font-semibold text-clay/80">{txt(lang, "Dating method", "预产期计算方式")}</p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, datingMethod: PREGNANCY_DATING_METHOD.DUE_DATE }))}
                    className="rounded-xl px-3 py-2 text-xs font-semibold"
                    style={
                      form.datingMethod === PREGNANCY_DATING_METHOD.DUE_DATE
                        ? { backgroundColor: style.tabBg, color: style.tabText }
                        : { backgroundColor: "#fffaf2", color: "#6E7F75" }
                    }
                  >
                    {txt(lang, "Direct due date", "直接填预产期")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, datingMethod: PREGNANCY_DATING_METHOD.LMP }))}
                    className="rounded-xl px-3 py-2 text-xs font-semibold"
                    style={
                      form.datingMethod === PREGNANCY_DATING_METHOD.LMP
                        ? { backgroundColor: style.tabBg, color: style.tabText }
                        : { backgroundColor: "#fffaf2", color: "#6E7F75" }
                    }
                  >
                    {txt(lang, "By LMP", "按末次月经")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, datingMethod: PREGNANCY_DATING_METHOD.IVF }))}
                    className="rounded-xl px-3 py-2 text-xs font-semibold"
                    style={
                      form.datingMethod === PREGNANCY_DATING_METHOD.IVF
                        ? { backgroundColor: style.tabBg, color: style.tabText }
                        : { backgroundColor: "#fffaf2", color: "#6E7F75" }
                    }
                  >
                    {txt(lang, "By IVF transfer", "按移植日期")}
                  </button>
                </div>
                <p className="text-xs text-clay/65">{datingHint}</p>
              </div>

              {form.datingMethod === PREGNANCY_DATING_METHOD.DUE_DATE && (
                <label className="space-y-1">
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-clay/80">
                    <CalendarDays className="h-4 w-4" />
                    {txt(lang, "Due date", "预产期")}
                  </span>
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={(event) => setForm((prev) => ({ ...prev, dueDate: event.target.value }))}
                    className="w-full rounded-2xl border border-sage/25 bg-white px-4 py-3 text-base text-clay outline-none transition focus:border-sage/45"
                  />
                </label>
              )}

              {form.datingMethod === PREGNANCY_DATING_METHOD.LMP && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="space-y-1">
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-clay/80">
                      <CalendarDays className="h-4 w-4" />
                      {txt(lang, "First day of LMP", "末次月经首日")}
                    </span>
                    <input
                      type="date"
                      value={form.lmpDate}
                      onChange={(event) => setForm((prev) => ({ ...prev, lmpDate: event.target.value }))}
                      className="w-full rounded-2xl border border-sage/25 bg-white px-4 py-3 text-base text-clay outline-none transition focus:border-sage/45"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-sm font-semibold text-clay/80">{txt(lang, "Cycle length (days)", "月经周期（天）")}</span>
                    <input
                      type="number"
                      min={21}
                      max={35}
                      value={form.cycleLength}
                      onChange={(event) => setForm((prev) => ({ ...prev, cycleLength: event.target.value }))}
                      className="w-full rounded-2xl border border-sage/25 bg-white px-4 py-3 text-base text-clay outline-none transition focus:border-sage/45"
                    />
                  </label>
                </div>
              )}

              {form.datingMethod === PREGNANCY_DATING_METHOD.IVF && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="space-y-1">
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-clay/80">
                      <CalendarDays className="h-4 w-4" />
                      {txt(lang, "Embryo transfer date", "胚胎移植日期")}
                    </span>
                    <input
                      type="date"
                      value={form.ivfTransferDate}
                      onChange={(event) => setForm((prev) => ({ ...prev, ivfTransferDate: event.target.value }))}
                      className="w-full rounded-2xl border border-sage/25 bg-white px-4 py-3 text-base text-clay outline-none transition focus:border-sage/45"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-sm font-semibold text-clay/80">{txt(lang, "Embryo day", "移植胚龄")}</span>
                    <select
                      value={form.embryoAgeDays}
                      onChange={(event) => setForm((prev) => ({ ...prev, embryoAgeDays: Number(event.target.value) }))}
                      className="w-full rounded-2xl border border-sage/25 bg-white px-4 py-3 text-base text-clay outline-none transition focus:border-sage/45"
                    >
                      <option value={3}>{txt(lang, "Day 3 embryo", "D3 胚胎")}</option>
                      <option value={5}>{txt(lang, "Day 5 embryo", "D5 胚胎")}</option>
                    </select>
                  </label>
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1">
                  <span className="text-sm font-semibold text-clay/80">{txt(lang, "Estimated due date", "自动预产期")}</span>
                  <input
                    type="text"
                    value={computedDueDate || ""}
                    readOnly
                    placeholder={txt(lang, "Will auto-calculate", "将自动计算")}
                    className="w-full rounded-2xl border border-sage/25 bg-[#f7f6f3] px-4 py-3 text-base text-clay outline-none"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-sm font-semibold text-clay/80">{txt(lang, "Current week (auto)", "当前孕周（自动）")}</span>
                  <input
                    type="text"
                    value={autoPregnancyWeek || ""}
                    readOnly
                    placeholder={txt(lang, "Will auto-calculate", "将自动计算")}
                    className="w-full rounded-2xl border border-sage/25 bg-[#f7f6f3] px-4 py-3 text-base text-clay outline-none"
                  />
                </label>
              </div>

              <label className="space-y-1">
                <span className="text-sm font-semibold text-clay/80">
                  {txt(lang, "Week correction (optional, per ultrasound)", "孕周修正（可选，按B超）")}
                </span>
                <input
                  type="text"
                  value={form.pregnancyWeek}
                  onChange={(event) => setForm((prev) => ({ ...prev, pregnancyWeek: event.target.value }))}
                  placeholder={txt(lang, "e.g. 24+3", "例如：24+3")}
                  className="w-full rounded-2xl border border-sage/25 bg-white px-4 py-3 text-base text-clay outline-none transition placeholder:text-clay/45 focus:border-sage/45"
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1">
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-clay/80">
                    <MapPin className="h-4 w-4" />
                    {txt(lang, "City", "所在城市")}
                  </span>
                  <input
                    type="text"
                    value={form.city}
                    onChange={(event) => setForm((prev) => ({ ...prev, city: event.target.value }))}
                    placeholder={txt(lang, "e.g. Shenzhen", "例如：深圳")}
                    className="w-full rounded-2xl border border-sage/25 bg-white px-4 py-3 text-base text-clay outline-none transition placeholder:text-clay/45 focus:border-sage/45"
                  />
                </label>
                <label className="space-y-1">
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-clay/80">
                    <Phone className="h-4 w-4" />
                    {txt(lang, "Phone (optional)", "手机号（可选）")}
                  </span>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                    placeholder={txt(lang, "for urgent support sync", "用于紧急支持同步")}
                    className="w-full rounded-2xl border border-sage/25 bg-white px-4 py-3 text-base text-clay outline-none transition placeholder:text-clay/45 focus:border-sage/45"
                  />
                </label>
              </div>

              <label className="inline-flex cursor-pointer items-start gap-2 rounded-2xl border border-sage/20 bg-white/75 px-3 py-2 text-sm text-clay/80">
                <input type="checkbox" checked={agreed} onChange={(event) => setAgreed(event.target.checked)} className="mt-0.5" />
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-sage" />
                  {txt(
                    lang,
                    "I agree profile data can be used for personalized support and reminders.",
                    "我同意将资料用于个性化推荐、提醒与支持服务。"
                  )}
                </span>
              </label>

              <div className="mt-1 flex items-center justify-between">
                <p className="text-xs text-[#BA6B5E]">{error}</p>
                <p className="text-xs text-clay/55">{form.name.length}/20</p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={submit}
            className="mt-4 inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-bold transition hover:brightness-95"
            style={{ backgroundColor: style.primaryBg, color: style.primaryText }}
          >
            {txt(lang, "Continue to Rihea", "进入 Rihea")}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </motion.section>
    </>
  );
}
