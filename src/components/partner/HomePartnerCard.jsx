import { BellRing, CalendarDays, ChevronRight, HeartHandshake, Link2, ShieldCheck } from "lucide-react";
import Card from "../ui/Card";
import { txt } from "../../utils/txt";
import { PARTNER_SHARING_LEVEL, PARTNER_SYNC_STATUS } from "../../utils/partnerSync";

const formatAppointment = (dateTime, lang) => {
  if (!dateTime) return "";
  const date = new Date(dateTime);
  if (Number.isNaN(date.getTime())) return dateTime;
  if (lang === "zh") {
    return `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  }
  return date.toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
};

export default function HomePartnerCard({
  lang,
  style,
  card,
  loading = false,
  onOpen,
}) {
  const disabled = card?.status === PARTNER_SYNC_STATUS.DISABLED;
  const paused = card?.sharingLevel === PARTNER_SHARING_LEVEL.OFF;
  const showMainTask = card?.mainTask && !paused;

  return (
    <Card style={style}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-clay/58">
            {txt(lang, "Partner Loop", "伴侣联动")}
          </p>
          <h3 className="mt-1 font-heading text-2xl font-bold text-clay">
            {loading ? txt(lang, "Loading partner card...", "正在读取伴侣卡片...") : card?.title || txt(lang, "Partner Sync", "伴侣同步")}
          </h3>
          <p className="mt-1 text-sm text-clay/78">
            {loading
              ? txt(lang, "Preparing the latest partner summary.", "正在准备最新伴侣摘要。")
              : card?.desc || txt(lang, "Share just enough so support becomes easier today.", "共享刚刚好的内容，让支持在今天更容易发生。")}
          </p>
        </div>
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#fffaf2] text-clay">
          {disabled ? <Link2 className="h-6 w-6" /> : <HeartHandshake className="h-6 w-6" />}
        </div>
      </div>

      {!loading && (
        <>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: style.pillBg, color: style.pillText }}>
              {disabled
                ? txt(lang, "Not enabled", "未开启")
                : paused
                  ? txt(lang, "Paused", "已暂停")
                  : card?.status === PARTNER_SYNC_STATUS.PENDING
                    ? txt(lang, "Pending join", "待加入")
                    : txt(lang, "Connected", "已连接")}
            </span>
            {card?.riskLabel && (
              <span className="rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: style.pillBg, color: style.pillText }}>
                <ShieldCheck className="mr-1 inline h-3 w-3" />
                {card.riskLabel}
              </span>
            )}
          </div>

          {showMainTask && (
            <div className="mt-4 rounded-[1.35rem] border border-sage/20 bg-[#fffaf2] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-clay/58">{txt(lang, "Partner task", "伴侣任务")}</p>
              <p className="mt-2 text-sm font-semibold text-clay">{card.mainTask.title}</p>
              <p className="mt-1 text-sm text-clay/75">{card.mainTask.desc}</p>
            </div>
          )}

          {card?.riskNotice && (
            <div className={`mt-3 rounded-[1.3rem] border p-4 ${card.riskNotice.level === "high" ? "border-[#e8c5b4] bg-[#fff5ef]" : "border-sage/20 bg-[#fffaf2]"}`}>
              <div className="flex items-start gap-3">
                <BellRing className={`mt-0.5 h-5 w-5 ${card.riskNotice.level === "high" ? "text-[#A35E38]" : "text-clay/65"}`} />
                <div>
                  <p className={`text-sm font-semibold ${card.riskNotice.level === "high" ? "text-[#A35E38]" : "text-clay"}`}>
                    {card.riskNotice.title}
                  </p>
                  <p className={`mt-1 text-sm ${card.riskNotice.level === "high" ? "text-[#A35E38]/85" : "text-clay/75"}`}>
                    {card.riskNotice.desc}
                  </p>
                </div>
              </div>
            </div>
          )}

          {card?.appointment && (
            <div className="mt-3 rounded-[1.3rem] border border-sage/20 bg-[#fffaf2] p-4">
              <div className="flex items-start gap-3">
                <CalendarDays className="mt-0.5 h-5 w-5 text-clay/65" />
                <div>
                  <p className="text-sm font-semibold text-clay">{card.appointment.title}</p>
                  <p className="mt-1 text-sm text-clay/75">{formatAppointment(card.appointment.dateTime, lang)}</p>
                  {card.appointment.location && <p className="mt-1 text-xs text-clay/62">{card.appointment.location}</p>}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <button
        type="button"
        onClick={onOpen}
        className="mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition hover:brightness-95"
        style={{ backgroundColor: style.primaryBg, color: style.primaryText }}
      >
        {card?.ctaLabel || txt(lang, "Open partner center", "打开伴侣中心")}
        <ChevronRight className="h-4 w-4" />
      </button>
    </Card>
  );
}
