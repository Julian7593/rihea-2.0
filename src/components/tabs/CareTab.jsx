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
  onMainAction,
  onBackupAction,
  profile,
  checkIns = [],
  cbtRefreshToken = 0,
  onCbtUpdated,
  onOpenCbtCenter,
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
              </button>
            ))}
          </div>
        </Card>

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
    </div>
  );
}
