import { BellRing, CalendarDays, Copy, HeartHandshake, Link2, ShieldCheck, UserRound, Users, Zap } from "lucide-react";
import Card from "../ui/Card";
import ToggleRow from "../ui/ToggleRow";
import { txt } from "../../utils/txt";
import {
  getPartnerSharingOptions,
  getPartnerStatusLabel,
  PARTNER_SHARING_LEVEL,
  PARTNER_SYNC_STATUS,
} from "../../utils/partnerSync";

const formatAppointment = (dateTime, lang) => {
  if (!dateTime) return txt(lang, "Not set yet", "暂未设置");
  const date = new Date(dateTime);
  if (Number.isNaN(date.getTime())) return dateTime;
  if (lang === "zh") {
    return `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  }
  return date.toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
};

const getStatusStyle = (status) => {
  if (status === PARTNER_SYNC_STATUS.BOUND) {
    return {
      bg: "rgba(149,169,157,.18)",
      color: "#4F6158",
    };
  }
  if (status === PARTNER_SYNC_STATUS.PENDING) {
    return {
      bg: "rgba(216,155,107,.18)",
      color: "#A86C47",
    };
  }
  return {
    bg: "rgba(122,147,173,.16)",
    color: "#5A6C7E",
  };
};

export default function PartnerSyncCenter({
  lang,
  style,
  overview,
  onCreateInvite,
  onCopyInvite,
  onConfirmJoin,
  onChangeSharingLevel,
  onToggleRiskAlerts,
  onToggleTask,
  onUnbind,
}) {
  const status = overview?.status || PARTNER_SYNC_STATUS.DISABLED;
  const sharingLevel = overview?.sharingLevel || PARTNER_SHARING_LEVEL.OFF;
  const preview = overview?.preview || null;
  const sharingOptions = getPartnerSharingOptions(lang);
  const statusStyle = getStatusStyle(status);
  const isBound = status === PARTNER_SYNC_STATUS.BOUND;
  const isPending = status === PARTNER_SYNC_STATUS.PENDING;
  const sharingPaused = sharingLevel === PARTNER_SHARING_LEVEL.OFF;

  return (
    <div className="space-y-4">
      <Card style={style}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="rounded-full px-3 py-1 text-xs font-semibold"
                style={{ backgroundColor: statusStyle.bg, color: statusStyle.color }}
              >
                {getPartnerStatusLabel(status, lang)}
              </span>
              <span
                className="rounded-full px-3 py-1 text-xs font-semibold"
                style={{ backgroundColor: style.pillBg, color: style.pillText }}
              >
                {sharingOptions.find((item) => item.value === sharingLevel)?.label || txt(lang, "Off", "不共享")}
              </span>
            </div>
            <h3 className="mt-3 font-heading text-2xl font-bold text-clay">
              {txt(lang, "Partner Sync Center", "伴侣同步中心")}
            </h3>
            <p className="mt-1 text-sm text-clay/78">
              {txt(
                lang,
                "Turn your daily check-ins into one clear action your partner can do today.",
                "把你的每日状态转成伴侣今天能执行的一条支持动作。"
              )}
            </p>
            {isBound && preview?.partnerName && (
              <p className="mt-3 text-sm font-semibold text-clay/80">
                {txt(lang, "Connected partner", "已连接伴侣")} · {preview.partnerName}
              </p>
            )}
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:w-[320px]">
            <button
              type="button"
              onClick={onCreateInvite}
              className="inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold transition hover:brightness-95"
              style={{ backgroundColor: style.primaryBg, color: style.primaryText }}
            >
              <Link2 className="h-4 w-4" />
              {isPending
                ? txt(lang, "Refresh invite", "刷新邀请码")
                : isBound
                  ? txt(lang, "Re-send invite", "重新发送邀请")
                  : txt(lang, "Enable and invite", "开启并邀请")}
            </button>
            <button
              type="button"
              onClick={onUnbind}
              disabled={!isPending && !isBound}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#e8c5b4] bg-[#fff5ef] px-4 py-3 text-sm font-semibold text-[#A35E38] transition enabled:hover:bg-[#ffece2] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Users className="h-4 w-4" />
              {txt(lang, "Disconnect", "解除绑定")}
            </button>
          </div>
        </div>
      </Card>

      <Card style={style}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h4 className="font-heading text-xl font-bold text-clay">{txt(lang, "Binding", "绑定状态")}</h4>
            <p className="mt-1 text-sm text-clay/75">
              {txt(
                lang,
                "Use one invite code to connect with a single partner account.",
                "通过一个邀请码与一位伴侣账号建立连接。"
              )}
            </p>
          </div>
          <div
            className="grid h-11 w-11 place-items-center rounded-full"
            style={{ backgroundColor: style.pillBg, color: style.pillText }}
          >
            <UserRound className="h-5 w-5" />
          </div>
        </div>

        {isPending ? (
          <div className="mt-4 space-y-3">
            <div className="rounded-[1.45rem] border border-sage/20 bg-[#fffaf2] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-clay/58">
                {txt(lang, "Invite Code", "邀请码")}
              </p>
              <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="font-heading text-3xl font-bold tracking-[0.16em] text-clay">{overview?.inviteCode || "------"}</p>
                <button
                  type="button"
                  onClick={onCopyInvite}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-sage/20 bg-white px-4 py-2 text-sm font-semibold text-clay transition hover:bg-sage/10"
                >
                  <Copy className="h-4 w-4" />
                  {txt(lang, "Copy code", "复制邀请码")}
                </button>
              </div>
              <p className="mt-2 text-sm text-clay/72">
                {txt(
                  lang,
                  "After your partner enters this code, confirm the connection here.",
                  "伴侣输入邀请码后，回到这里确认连接。"
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={onConfirmJoin}
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition hover:brightness-95"
              style={{ backgroundColor: style.primaryBg, color: style.primaryText }}
            >
              <HeartHandshake className="h-4 w-4" />
              {txt(lang, "I confirm my partner joined", "我已确认伴侣加入")}
            </button>
          </div>
        ) : (
          <div className="mt-4 rounded-[1.45rem] border border-sage/20 bg-[#fffaf2] p-4 text-sm text-clay">
            {isBound ? (
              <>
                <p className="font-semibold text-clay">
                  {preview?.partnerName || txt(lang, "Partner", "伴侣")} · {preview?.partnerRelation || txt(lang, "Partner", "伴侣")}
                </p>
                <p className="mt-1 text-clay/72">
                  {txt(
                    lang,
                    "The connection is active. You can change what is shared at any time below.",
                    "连接已建立。你可以随时在下方调整共享范围。"
                  )}
                </p>
              </>
            ) : (
              <>
                <p className="font-semibold text-clay">{txt(lang, "No partner connected yet", "还没有连接伴侣")}</p>
                <p className="mt-1 text-clay/72">
                  {txt(
                    lang,
                    "Enable this when you want one partner to receive summarized status and suggested support actions.",
                    "当你希望一位伴侣收到状态摘要和支持建议时，再开启这里。"
                  )}
                </p>
              </>
            )}
          </div>
        )}
      </Card>

      <Card style={style}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h4 className="font-heading text-xl font-bold text-clay">{txt(lang, "Sharing controls", "共享控制")}</h4>
            <p className="mt-1 text-sm text-clay/75">
              {txt(
                lang,
                "Keep the shared view clear: summary first, then appointments only when useful.",
                "先共享最关键的摘要，再按需开放待办和产检准备。"
              )}
            </p>
          </div>
          <div
            className="grid h-11 w-11 place-items-center rounded-full"
            style={{ backgroundColor: style.pillBg, color: style.pillText }}
          >
            <ShieldCheck className="h-5 w-5" />
          </div>
        </div>

        <div className="mt-4 grid gap-2">
          {sharingOptions.map((item) => {
            const active = item.value === sharingLevel;
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => onChangeSharingLevel(item.value)}
                className="rounded-[1.3rem] border px-4 py-3 text-left transition"
                style={
                  active
                    ? { borderColor: style.tabBg, backgroundColor: style.tabBg, color: style.tabText }
                    : { borderColor: style.line, backgroundColor: "#fffaf2", color: "#5d6a61" }
                }
              >
                <span className="block text-sm font-semibold">{item.label}</span>
                <span className="mt-1 block text-xs opacity-80">{item.desc}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-3">
          <ToggleRow
            label={txt(lang, "Risk alerts to partner", "向伴侣发送风险提醒")}
            on={overview?.riskAlerts !== false}
            toggle={onToggleRiskAlerts}
          />
        </div>
      </Card>

      <Card style={style}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h4 className="font-heading text-xl font-bold text-clay">{txt(lang, "Partner view preview", "伴侣视角预览")}</h4>
            <p className="mt-1 text-sm text-clay/75">
              {txt(lang, "This is the condensed view your partner would see right now.", "这是伴侣此刻会看到的摘要视图。")}
            </p>
          </div>
          <div
            className="grid h-11 w-11 place-items-center rounded-full"
            style={{ backgroundColor: style.pillBg, color: style.pillText }}
          >
            <Zap className="h-5 w-5" />
          </div>
        </div>

        {sharingPaused ? (
          <div className="mt-4 rounded-[1.45rem] border border-dashed border-sage/25 bg-[#fffaf2] p-4 text-sm text-clay/72">
            {txt(
              lang,
              "Sharing is paused. Your partner stays connected, but no new summaries are visible.",
              "当前已暂停共享。伴侣关系仍保留，但不会看到新的摘要内容。"
            )}
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <div className="rounded-[1.45rem] border border-sage/20 bg-[#fffaf2] p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-clay/75">
                  {preview?.todayStatus?.checkedIn ? txt(lang, "Checked in today", "今天已打卡") : txt(lang, "No check-in yet", "今天未打卡")}
                </span>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-clay/75">
                  {preview?.risk?.label || txt(lang, "Low Risk", "低风险")}
                </span>
              </div>
              <h5 className="mt-3 font-heading text-2xl font-bold text-clay">{preview?.todayStatus?.title}</h5>
              <p className="mt-1 text-sm text-clay/78">{preview?.todayStatus?.desc}</p>
              {preview?.mainTask && (
                <div className="mt-4 rounded-[1.2rem] bg-white/90 p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-clay/58">{txt(lang, "Do this first", "先做这一条")}</p>
                  <p className="mt-1 text-sm font-semibold text-clay">{preview.mainTask.title}</p>
                  <p className="mt-1 text-sm text-clay/75">{preview.mainTask.desc}</p>
                </div>
              )}
            </div>

            {preview?.risk?.notice && (
              <div
                className={`rounded-[1.45rem] border p-4 ${
                  preview.risk.notice.level === "high"
                    ? "border-[#e8c5b4] bg-[#fff5ef]"
                    : "border-sage/20 bg-[#fffaf2]"
                }`}
              >
                <div className="flex items-start gap-3">
                  <BellRing className={`mt-0.5 h-5 w-5 ${preview.risk.notice.level === "high" ? "text-[#A35E38]" : "text-clay/70"}`} />
                  <div>
                    <p className={`text-sm font-semibold ${preview.risk.notice.level === "high" ? "text-[#A35E38]" : "text-clay"}`}>
                      {preview.risk.notice.title}
                    </p>
                    <p className={`mt-1 text-sm ${preview.risk.notice.level === "high" ? "text-[#A35E38]/85" : "text-clay/75"}`}>
                      {preview.risk.notice.desc}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {sharingLevel === PARTNER_SHARING_LEVEL.SUMMARY_PLUS && preview?.nextAppointment && (
              <div className="rounded-[1.45rem] border border-sage/20 bg-[#fffaf2] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-clay/58">
                      {txt(lang, "Next appointment", "下次产检")}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-clay">{preview.nextAppointment.title}</p>
                    <p className="mt-1 text-sm text-clay/75">{formatAppointment(preview.nextAppointment.dateTime, lang)}</p>
                    {preview.nextAppointment.location && (
                      <p className="mt-1 text-xs text-clay/62">{preview.nextAppointment.location}</p>
                    )}
                  </div>
                  <CalendarDays className="h-5 w-5 text-clay/65" />
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1.12fr,1fr]">
        <Card style={style}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h4 className="font-heading text-xl font-bold text-clay">{txt(lang, "Care tasks", "陪伴任务")}</h4>
              <p className="mt-1 text-sm text-clay/75">
                {txt(lang, "Keep it small and concrete. One task matters more than five promises.", "任务保持少而具体，一条完成比五条承诺更有用。")}
              </p>
            </div>
            <div
              className="grid h-11 w-11 place-items-center rounded-full"
              style={{ backgroundColor: style.pillBg, color: style.pillText }}
            >
              <HeartHandshake className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {(preview?.tasks || []).length > 0 ? (
              preview.tasks.map((task) => (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => onToggleTask(task.id, !task.done)}
                  className={`flex w-full items-start justify-between gap-3 rounded-[1.3rem] border px-4 py-3 text-left transition ${
                    task.done ? "border-sage/25 bg-sage/10" : "border-sage/20 bg-[#fffaf2] hover:bg-sage/10"
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-clay">{task.title}</span>
                    <span className="mt-1 block text-sm text-clay/75">{task.desc}</span>
                  </span>
                  <span
                    className="shrink-0 rounded-full px-3 py-1 text-xs font-semibold"
                    style={task.done ? { backgroundColor: style.pillBg, color: style.pillText } : { backgroundColor: "#fff", color: "#6E7F75" }}
                  >
                    {task.done ? txt(lang, "Done", "已完成") : task.meta || txt(lang, "To do", "待完成")}
                  </span>
                </button>
              ))
            ) : (
              <div className="rounded-[1.3rem] border border-dashed border-sage/25 bg-[#fffaf2] px-4 py-4 text-sm text-clay/72">
                {txt(
                  lang,
                  "Tasks will appear here when sharing is enabled and enough status has been logged.",
                  "开启共享并记录状态后，任务会出现在这里。"
                )}
              </div>
            )}
          </div>
        </Card>

        <Card style={style}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h4 className="font-heading text-xl font-bold text-clay">{txt(lang, "Communication guide", "沟通建议")}</h4>
              <p className="mt-1 text-sm text-clay/75">
                {txt(lang, "Help your partner avoid the classic mistake of talking too much too early.", "帮助伴侣避开“说太多、说太早”的常见错误。")}
              </p>
            </div>
            <div
              className="grid h-11 w-11 place-items-center rounded-full"
              style={{ backgroundColor: style.pillBg, color: style.pillText }}
            >
              <Users className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <div className="rounded-[1.3rem] border border-sage/20 bg-[#fffaf2] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-clay/58">{txt(lang, "Say this", "建议这样说")}</p>
              <p className="mt-2 text-sm font-semibold text-clay">{preview?.communication?.say}</p>
            </div>
            <div className="rounded-[1.3rem] border border-[#e8c5b4] bg-[#fff5ef] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#A35E38]/80">{txt(lang, "Avoid this", "不建议这样说")}</p>
              <p className="mt-2 text-sm font-semibold text-[#A35E38]">{preview?.communication?.avoid}</p>
            </div>
            <div className="rounded-[1.3rem] border border-sage/20 bg-[#fffaf2] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-clay/58">{txt(lang, "Ask this", "推荐问句")}</p>
              <p className="mt-2 text-sm font-semibold text-clay">{preview?.communication?.ask}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
