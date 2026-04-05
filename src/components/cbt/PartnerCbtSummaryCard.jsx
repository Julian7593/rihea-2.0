import { HeartHandshake, ShieldAlert } from "lucide-react";
import Card from "../ui/Card";
import { txt } from "../../utils/txt";

export default function PartnerCbtSummaryCard({ lang, style, summary, loading = false }) {
  if (loading) {
    return (
      <Card style={style}>
        <p className="text-sm font-semibold text-clay/72">
          {txt(lang, "Loading CBT partner summary...", "正在加载 CBT 伴侣摘要...")}
        </p>
      </Card>
    );
  }

  if (!summary) return null;

  return (
    <Card style={style}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="font-heading text-xl font-bold text-clay">
            {txt(lang, "CBT partner summary", "CBT 伴侣摘要")}
          </h4>
          <p className="mt-1 text-sm text-clay/75">
            {txt(lang, "Only action-focused items are shared here.", "这里只展示适合共享给伴侣的行动摘要。")}
          </p>
        </div>
        <div
          className="grid h-11 w-11 place-items-center rounded-full"
          style={{ backgroundColor: style.pillBg, color: style.pillText }}
        >
          <HeartHandshake className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-4 rounded-[1.35rem] border border-sage/20 bg-[#fffaf2] p-4">
        <p className="text-sm font-semibold text-clay">{summary?.headline}</p>
        <p className="mt-1 text-sm text-clay/72">{summary?.todayStatus?.desc}</p>
        {Array.isArray(summary?.tasks) &&
          summary.tasks.map((item) => (
            <div key={item.id} className="mt-3 rounded-2xl bg-white/90 p-3">
              <p className="text-sm font-semibold text-clay">{item.title}</p>
              <p className="mt-1 text-sm text-clay/72">{item.desc}</p>
              {item.helper && <p className="mt-1 text-xs text-clay/58">{item.helper}</p>}
            </div>
          ))}
        {summary?.clinicalReminder && (
          <div className="mt-3 flex items-start gap-2 rounded-2xl bg-[#fff5ef] p-3 text-sm text-[#a35e38]">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{summary.clinicalReminder}</span>
          </div>
        )}
      </div>
    </Card>
  );
}

