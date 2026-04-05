import { Activity, ArrowRight, BookOpen, Compass, Sparkles } from "lucide-react";
import Card from "../ui/Card";

export default function DocsCover({
  cover,
  hero,
  versionInfo,
  activeSection,
  onNavigate,
  onOpenHome,
  onOpenTest,
}) {
  return (
    <Card className="overflow-hidden border-0 bg-[linear-gradient(135deg,rgba(255,255,255,.95),rgba(250,244,235,.92))] p-0 shadow-[0_24px_60px_-30px_rgba(93,106,97,.35)]">
      <div className="grid gap-0 lg:grid-cols-[1.18fr,.82fr]">
        <div className="relative overflow-hidden p-6 sm:p-8">
          <div className="absolute inset-y-10 right-[-2rem] hidden w-40 rounded-full bg-[radial-gradient(circle,rgba(208,177,168,.28),transparent_70%)] blur-3xl lg:block" />
          <div className="inline-flex items-center gap-2 rounded-full border border-[#d8cec0] bg-white/75 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#6b746d]">
            <BookOpen className="h-3.5 w-3.5" />
            {cover.eyebrow || hero.badge}
          </div>
          <h1 className="mt-4 max-w-4xl text-3xl font-extrabold tracking-tight text-[#425248] sm:text-4xl lg:text-[2.9rem]">
            {cover.title || hero.title}
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-[#5a6760] sm:text-[1.05rem]">{cover.subtitle}</p>

          <div className="mt-5 rounded-[1.8rem] border border-[#e4ddd1] bg-[#fffdf9] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#88958d]">Product Definition</p>
            <p className="mt-2 text-lg font-semibold text-[#46564c]">{cover.oneLiner}</p>
            <p className="mt-2 text-sm leading-6 text-[#667168]">{hero.definition}</p>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {cover.audience.map((item) => (
              <span
                key={item}
                className="rounded-full border border-[#dde5df] bg-white/80 px-3 py-1.5 text-xs font-semibold text-[#4f6158]"
              >
                {item}
              </span>
            ))}
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {cover.quickLinks.map((link) => {
              const active = activeSection === link.id;
              return (
                <button
                  key={link.id}
                  type="button"
                  onClick={() => onNavigate(link.id)}
                  className={`rounded-[1.45rem] border p-4 text-left transition ${
                    active
                      ? "border-[#c4d3ca] bg-[#f4faf6] shadow-[0_18px_35px_-30px_rgba(79,97,88,.45)]"
                      : "border-[#e6dfd3] bg-white/90 hover:bg-[#fbf8f2]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-[#46564c]">{link.label}</span>
                    <ArrowRight className="h-4 w-4 text-[#839189]" />
                  </div>
                  <p className="mt-2 text-xs leading-5 text-[#738078]">{link.hint}</p>
                </button>
              );
            })}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onOpenHome}
              className="inline-flex items-center gap-2 rounded-full bg-[#4f6158] px-5 py-3 text-sm font-bold text-white transition hover:brightness-95"
            >
              打开主应用
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onOpenTest}
              className="inline-flex items-center gap-2 rounded-full border border-[#cfd8d2] bg-white px-5 py-3 text-sm font-semibold text-[#4f6158] transition hover:bg-[#f6f8f5]"
            >
              打开测试页
              <Activity className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="bg-[linear-gradient(180deg,rgba(86,105,96,.96),rgba(114,131,120,.92))] p-6 text-white sm:p-8">
          <div className="rounded-[1.7rem] border border-white/12 bg-white/8 p-4 backdrop-blur-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white/14 px-3 py-1 text-xs font-semibold text-white">
                {versionInfo.currentVersion}
              </span>
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-white/68">
                {versionInfo.releaseDate}
              </span>
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-white/68">
                {versionInfo.codename}
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-white/88">{versionInfo.summary}</p>
          </div>

          <div className="mt-4 grid gap-3">
            {hero.highlights.map((item) => (
              <div key={item.label} className="rounded-[1.6rem] border border-white/12 bg-white/8 p-4 backdrop-blur-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/65">{item.label}</p>
                <p className="mt-2 text-sm font-semibold leading-6 text-white/92">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-[1.7rem] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,.12),rgba(255,255,255,.08))] p-4">
            <div className="flex items-center gap-2">
              <Compass className="h-4 w-4 text-white/82" />
              <p className="text-sm font-semibold text-white">阅读提示</p>
            </div>
            <div className="mt-3 space-y-2">
              {cover.readingTips.map((tip) => (
                <div key={tip} className="flex items-start gap-3">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-white/68" />
                  <p className="text-sm leading-6 text-white/82">{tip}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
