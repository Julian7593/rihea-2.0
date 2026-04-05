import { useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Brain,
  CheckCircle2,
  ClipboardList,
  HeartHandshake,
  HeartPulse,
  Layers3,
  LockKeyhole,
  Sparkles,
  Stethoscope,
  UserRound,
  Utensils,
} from "lucide-react";
import DocsArchitectureDiagram from "../components/docs/DocsArchitectureDiagram";
import DocsBackToTopButton from "../components/docs/DocsBackToTopButton";
import DocsCover from "../components/docs/DocsCover";
import DocsSectionHeader from "../components/docs/DocsSectionHeader";
import DocsSectionNav from "../components/docs/DocsSectionNav";
import Card from "../components/ui/Card";
import DietAdviceCard from "../components/nutrition/DietAdviceCard";
import ExerciseAdviceCard from "../components/fitness/ExerciseAdviceCard";
import { appGuideContent } from "../data/appGuideContent";
import { appReleaseNotes, appVersionInfo } from "../data/appMeta";
import useActiveSection from "../hooks/useActiveSection";
import { generateNutritionAdvice } from "../utils/nutritionCalculator";
import { getTodayExerciseQuickView } from "../utils/fitnessRecommender";

const releaseSectionMeta = {
  added: { label: "新增", tone: "bg-[#edf5ef] text-[#4f6158]", dot: "bg-[#7f9a89]", border: "border-[#d9e6dc]" },
  improved: { label: "优化", tone: "bg-[#f6efe6] text-[#8c684b]", dot: "bg-[#c89a6b]", border: "border-[#eadcc8]" },
  fixed: { label: "修复", tone: "bg-[#f8ebeb] text-[#9a5a5a]", dot: "bg-[#d28c8c]", border: "border-[#efd7d7]" },
};

const moduleIconMap = {
  home: HeartPulse,
  care: Sparkles,
  medical: Stethoscope,
  partner: HeartHandshake,
  "diet-exercise": Utensils,
  ai: Brain,
  settings: UserRound,
};

const navigationIconMap = {
  首页: HeartPulse,
  关怀: Sparkles,
  医疗支持: Stethoscope,
  我的: UserRound,
};

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

export default function AppSystemGuidePage() {
  const [previewMessage, setPreviewMessage] = useState("");
  const pageSections = appGuideContent.sections;
  const pageSectionIds = useMemo(() => pageSections.map((section) => section.id), [pageSections]);
  const activeSection = useActiveSection(pageSectionIds);
  const sampleProfile = useMemo(
    () => ({
      name: "体验用户",
      pregnancyWeek: "24+3",
      dueDate: "2026-06-08",
      riskLevel: "low",
      height: 165,
      prePregnancyWeight: 58,
      currentWeight: 64,
      targetWeightGain: 12,
      allergies: ["海鲜"],
      dietaryPreferences: [],
      foodDislikes: ["香菜"],
      exerciseHistory: { level: "intermediate", regularActivities: ["yoga"], frequency: "3-4 times/week" },
      medicalContraindications: { diet: [], exercise: [] },
    }),
    []
  );
  const dietAdvice = useMemo(() => generateNutritionAdvice(sampleProfile), [sampleProfile]);
  const exerciseAdvice = useMemo(() => getTodayExerciseQuickView(sampleProfile), [sampleProfile]);
  const navigateToSection = (sectionId) => {
    if (typeof document === "undefined") return;
    const target = document.getElementById(sectionId);
    if (!target) return;

    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `#${sectionId}`);
    }

    target.scrollIntoView({
      behavior: prefersReducedMotion() ? "auto" : "smooth",
      block: "start",
    });
  };
  const openHome = () => (window.location.href = "/");
  const openTest = () => (window.location.href = "/test");

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(244,197,189,.32),transparent_32%),radial-gradient(circle_at_top_right,rgba(171,196,183,.28),transparent_34%),linear-gradient(180deg,#fcfaf5_0%,#f5f0e7_100%)] px-4 py-6 sm:px-6 lg:px-8">
      <DocsBackToTopButton />

      <div className="mx-auto max-w-[1320px] space-y-6">
        <DocsCover
          cover={appGuideContent.cover}
          hero={appGuideContent.hero}
          versionInfo={appVersionInfo}
          activeSection={activeSection}
          onNavigate={navigateToSection}
          onOpenHome={openHome}
          onOpenTest={openTest}
        />

        <div className="sticky top-3 z-30 xl:hidden">
          <Card className="border border-[#e3ddd2] bg-[linear-gradient(180deg,rgba(255,255,255,.88),rgba(248,243,236,.94))] p-4 shadow-[0_18px_40px_-32px_rgba(88,100,93,.35)] backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#88958d]">On This Page</p>
                <h2 className="mt-1 text-lg font-bold text-[#46564c]">章节目录</h2>
              </div>
              <span className="rounded-full bg-[#eef3ef] px-3 py-1 text-xs font-semibold text-[#4f6158]">
                {pageSections.length} sections
              </span>
            </div>
            <div className="mt-4">
              <DocsSectionNav
                sections={pageSections}
                activeSection={activeSection}
                onNavigate={navigateToSection}
                variant="pills"
              />
            </div>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-[280px,minmax(0,1fr)]">
          <aside className="hidden xl:block">
            <div className="sticky top-6 space-y-4">
              <Card className="border border-[#dcd5c8] bg-[linear-gradient(180deg,rgba(255,255,255,.92),rgba(246,240,231,.95))] p-5 shadow-[0_18px_40px_-30px_rgba(88,100,93,.35)]">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#88958d]">Documentation</p>
                <h2 className="mt-2 text-xl font-bold text-[#46564c]">页面目录</h2>
                <div className="mt-4">
                  <DocsSectionNav sections={pageSections} activeSection={activeSection} onNavigate={navigateToSection} />
                </div>
              </Card>

              <Card className="border border-[#e5ddd0] bg-[#fffdf9] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#88958d]">Delivery Note</p>
                <p className="mt-3 text-sm leading-6 text-[#667168]">{appGuideContent.delivery.note}</p>
                <div className="mt-4 rounded-[1.4rem] border border-[#e7e0d4] bg-[#f8faf7] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#88958d]">当前阅读位置</p>
                  <p className="mt-2 text-sm font-semibold text-[#46564c]">
                    {pageSections.find((section) => section.id === activeSection)?.title || appGuideContent.cover.title}
                  </p>
                </div>
              </Card>
            </div>
          </aside>

          <div className="space-y-6">
        <div id="quick-start" className="scroll-mt-32 grid gap-6 xl:grid-cols-[1fr,.92fr]">
          <Card className="p-6 sm:p-7">
            <DocsSectionHeader icon={Sparkles} title="快速开始" desc="第一次使用时，建议先按这个顺序完成主链路。" />
            <div className="mt-5 space-y-4">
              {appGuideContent.quickStart.map((item, index) => (
                <div key={item.title} className="rounded-[1.7rem] border border-[#e7e0d4] bg-[#fffdf9] p-4">
                  <div className="flex items-start gap-4">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#4f6158] text-sm font-bold text-white">{index + 1}</div>
                    <div>
                      <h3 className="text-base font-bold text-[#46564c]">{item.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-[#667168]">{item.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-6 sm:p-7">
            <DocsSectionHeader icon={CheckCircle2} title="当前边界与注意事项" desc="这部分决定当前系统应该如何被理解和对外介绍。" tone="bg-[#f3efe8] text-[#6c5a49]" />
            <div className="mt-5 space-y-3">
              {appGuideContent.boundaries.map((item) => (
                <div key={item} className="rounded-[1.6rem] border border-[#ece4d8] bg-[linear-gradient(180deg,#fffdf9,#fbf7f0)] p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#b4845a]" />
                    <p className="text-sm leading-6 text-[#667168]">{item}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <Card id="main-flow" className="scroll-mt-32 p-6 sm:p-7">
          <DocsSectionHeader icon={ClipboardList} title="用户主流程与功能链路" desc="这一段对应 roadmap 里的当前产品能力总览和主链路。" />
          <div className="mt-5 grid gap-4 lg:grid-cols-5">
            {appGuideContent.mainFlow.map((item) => (
              <div key={item.step} className="rounded-[1.8rem] border border-[#e7e0d4] bg-[#fffdf9] p-4">
                <span className="rounded-full bg-[#eef3ef] px-2.5 py-1 text-xs font-bold text-[#4f6158]">{item.step}</span>
                <h3 className="mt-3 text-lg font-bold text-[#46564c]">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#667168]">{item.desc}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card id="navigation" className="scroll-mt-32 p-6 sm:p-7">
          <DocsSectionHeader icon={ArrowRight} title="四大导航如何协作" desc="可以把它理解成每天入口、场景入口、专业入口和系统入口的分工。" />
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {appGuideContent.navigation.map((item) => {
              const Icon = navigationIconMap[item.title] || BookOpen;
              return (
                <div key={item.title} className="rounded-[1.7rem] border border-[#e7e0d4] bg-[#fffdf9] p-4">
                  <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#f1f5f2] text-[#4f6158]"><Icon className="h-5 w-5" /></span>
                  <h3 className="mt-4 text-lg font-bold text-[#46564c]">{item.title}</h3>
                  <p className="mt-1 text-sm font-semibold text-[#55655b]">{item.role}</p>
                  <p className="mt-2 text-sm leading-6 text-[#667168]">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </Card>

        <Card id="modules" className="scroll-mt-32 p-6 sm:p-7">
          <DocsSectionHeader icon={BookOpen} title="核心模块逐项说明" desc="每个模块统一回答四件事：解决什么问题、从哪里进入、典型流程、依赖什么架构。" />
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {appGuideContent.modules.map((module) => {
              const Icon = moduleIconMap[module.key] || BookOpen;
              return (
                <div key={module.key} className="rounded-[1.8rem] border border-[#e7e0d4] bg-white p-5">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#f3f6f4] text-[#4f6158]"><Icon className="h-5 w-5" /></span>
                    <h3 className="text-lg font-bold text-[#46564c]">{module.title}</h3>
                  </div>
                  <div className="mt-4 space-y-3">
                    {[
                      ["它解决什么问题", module.problem],
                      ["用户从哪里进入", module.entry],
                      ["典型流程", module.flow],
                      ["架构依赖", module.dependencies],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-[1.2rem] border border-[#eae3d7] bg-[#fffdf9] p-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8b968f]">{label}</p>
                        <p className="mt-2 text-sm leading-6 text-[#667168]">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card id="architecture" className="scroll-mt-32 overflow-hidden p-6 sm:p-7">
          <DocsSectionHeader icon={Layers3} title="底层技术架构概览" desc="这里把产品入口、路由分发、检索工具、知识层和治理边界放到一张架构叙事图里。" />
          <div className="mt-4 rounded-[1.7rem] border border-[#e7e0d4] bg-[linear-gradient(180deg,#fffdf9,#faf6ef)] p-4">
            <p className="text-sm leading-7 text-[#667168]">{appGuideContent.architecture.summary}</p>
          </div>
          <div className="mt-5">
            <DocsArchitectureDiagram architecture={appGuideContent.architecture} />
          </div>
          <div className="mt-5 grid gap-4 xl:grid-cols-[1.08fr,.92fr]">
            <div className="rounded-[1.8rem] border border-[#e7e0d4] bg-white p-5">
              <h3 className="text-lg font-bold text-[#46564c]">Agent 全链路</h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {appGuideContent.architecture.agentFlow.map((item, index) => (
                  <div key={item} className="flex items-center gap-2">
                    <span className="rounded-full border border-[#dce5df] bg-[#f7faf8] px-3 py-1.5 text-xs font-semibold text-[#4f6158]">{item}</span>
                    {index !== appGuideContent.architecture.agentFlow.length - 1 && <ArrowRight className="h-3.5 w-3.5 text-[#93a097]" />}
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-[1.8rem] border border-[#e7e0d4] bg-white p-5">
              <h3 className="text-lg font-bold text-[#46564c]">知识优先级</h3>
              <div className="mt-4 space-y-3">
                {appGuideContent.architecture.knowledgePriority.map((item, index) => (
                  <div key={item} className="flex items-center gap-3">
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-[#4f6158] text-xs font-bold text-white">{index + 1}</span>
                    <p className="text-sm font-semibold text-[#667168]">{item}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-[1.2rem] border border-[#ebe4d8] bg-[#fffdf9] p-4">
                <p className="text-sm leading-6 text-[#667168]">
                  默认不是先联网，而是优先消化当前产品知识与同步后的内部知识，再在必要时做补查和外部搜索。
                </p>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[1.02fr,.98fr]">
        <Card id="ai-mechanism" className="scroll-mt-32 p-6 sm:p-7">
            <DocsSectionHeader icon={Brain} title="AI 助手工作机制" desc="重点不是能不能聊，而是为什么这条回答可信、可控、可解释。" />
            <div className="mt-5 rounded-[1.7rem] border border-[#e7e0d4] bg-[#fffdf9] p-4">
              <p className="text-sm leading-7 text-[#667168]">{appGuideContent.aiMechanism.summary}</p>
            </div>
            <div className="mt-4 space-y-3">
              {appGuideContent.aiMechanism.points.map((item) => (
                <div key={item} className="rounded-[1.4rem] border border-[#eae3d7] bg-white p-4">
                  <p className="text-sm leading-6 text-[#667168]">{item}</p>
                </div>
              ))}
            </div>
          </Card>
          <Card id="phase-mapping" className="scroll-mt-32 p-6 sm:p-7">
            <DocsSectionHeader icon={ClipboardList} title="当前阶段判断" desc="这一段直接对应 roadmap，说明当前系统已经到了哪一步、还缺什么。" tone="bg-[#f5efe8] text-[#7b614c]" />
            <div className="mt-5 rounded-[1.7rem] border border-[#eadcc8] bg-[#fff8ef] p-4">
              <p className="text-sm leading-7 text-[#7c6855]">{appGuideContent.phaseMapping.summary}</p>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="rounded-[1.5rem] border border-[#d9e6dc] bg-[#f6fbf7] p-4">
                <p className="text-sm font-bold text-[#4f6158]">已落地部分</p>
                <div className="mt-3 space-y-2">
                  {appGuideContent.phaseMapping.landed.map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-[#7f9a89]" />
                      <p className="text-sm leading-6 text-[#667168]">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-[1.5rem] border border-[#eadcc8] bg-[#fff8ef] p-4">
                <p className="text-sm font-bold text-[#8c684b]">未完全落地部分</p>
                <div className="mt-3 space-y-2">
                  {appGuideContent.phaseMapping.missing.map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-[#c89a6b]" />
                      <p className="text-sm leading-6 text-[#667168]">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>

        <Card id="release-notes" className="scroll-mt-32 p-6 sm:p-7">
          <DocsSectionHeader icon={ClipboardList} title="当前版本说明" desc="release notes 继续保留为版本透明度入口，不与系统说明主体混淆。" />
          <div className="mt-5 space-y-4">
            {appReleaseNotes.map((item, index) => (
              <div key={item.version} className="relative pl-8">
                {index !== appReleaseNotes.length - 1 && <div className="absolute left-[11px] top-8 bottom-[-24px] w-px bg-[#ddd5c8]" />}
                <div className={`absolute left-0 top-1.5 h-6 w-6 rounded-full border-4 border-white ${index === 0 ? "bg-[#4f6158]" : "bg-[#ccbba5]"}`} />
                <div className="rounded-[1.8rem] border border-[#e7e0d4] bg-[#fffdf9] p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[#eef3ef] px-3 py-1 text-xs font-semibold text-[#4f6158]">{item.version}</span>
                    <span className="rounded-full bg-[#f5efe8] px-3 py-1 text-xs font-semibold text-[#7b614c]">{item.status}</span>
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#88958d]">{item.date}</span>
                  </div>
                  <h3 className="mt-3 text-lg font-bold text-[#46564c]">{item.title}</h3>
                  {item.summary && <p className="mt-2 text-sm leading-6 text-[#667168]">{item.summary}</p>}
                  <div className="mt-4 grid gap-3">
                    {["added", "improved", "fixed"].filter((key) => Array.isArray(item.sections?.[key]) && item.sections[key].length > 0).map((key) => {
                      const section = releaseSectionMeta[key];
                      return (
                        <div key={key} className={`rounded-[1.35rem] border bg-white/72 p-4 ${section.border}`}>
                          <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${section.tone}`}>{section.label}</span>
                          <div className="mt-3 space-y-2">
                            {item.sections[key].map((entry) => (
                              <div key={entry} className="flex items-start gap-3">
                                <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${section.dot}`} />
                                <p className="text-sm leading-6 text-[#667168]">{entry}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div id="safety-boundary" className="scroll-mt-32 grid gap-6 xl:grid-cols-[1.08fr,.92fr]">
          <Card className="p-6 sm:p-7">
            <DocsSectionHeader icon={Utensils} title="真实界面预览：饮食与运动" desc={appGuideContent.previewNote} />
            <div className="mt-5 space-y-4">
              <DietAdviceCard advice={dietAdvice} onRecordMeal={(mealType) => setPreviewMessage(`文档页中的 ${mealType} 记录按钮仅用于预览。请回到首页完成真实记录。`)} />
              <ExerciseAdviceCard advice={exerciseAdvice} onCheckin={(task) => setPreviewMessage(`文档页中的“${task?.name || "运动任务"}”打卡按钮仅用于预览。请回到首页进行真实打卡。`)} />
              {previewMessage && <div className="rounded-[1.4rem] border border-[#d9e5dd] bg-[#f6fbf7] px-4 py-3 text-sm font-medium text-[#4f6158]">{previewMessage}</div>}
            </div>
          </Card>
          <Card className="p-6 sm:p-7">
            <DocsSectionHeader icon={LockKeyhole} title="数据、安全与协作边界" desc="这一组信息建议在对外演示、交付和产品介绍时一并保留。" tone="bg-[#f5efe8] text-[#7b614c]" />
            <div className="mt-5 space-y-4">
              {[
                ["数据来源与状态承接", "当前版本采用本地存储、mock API、本地服务状态文件和知识快照共同承接体验。这保证了演示与单设备连续体验，但尚不等同于完整的多端实时同步系统。"],
                ["伴侣共享的默认原则", "伴侣同步围绕“今日状态摘要 + 风险提示 + 可执行动作”组织，不默认暴露原始情绪分数、私密备注和全部历史记录，以保证协作与隐私之间的平衡。"],
                ["AI 为什么不是自由发挥", "当前 AI 先做风险与路由判断，再按知识优先级取证据，最后才调用模型生成回答。模型不是唯一决策者，而是整个受控链路中的一环。"],
              ].map(([title, desc]) => (
                <div key={title} className="rounded-[1.7rem] border border-[#e8e0d4] bg-[#fffdf9] p-4">
                  <h3 className="text-base font-bold text-[#46564c]">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#667168]">{desc}</p>
                </div>
              ))}
              <div className="rounded-[1.7rem] border border-[#f0d8cb] bg-[#fff7f3] p-4">
                <h3 className="text-base font-bold text-[#9c5f3c]">需要立即线下处理的情况</h3>
                <p className="mt-2 text-sm leading-6 text-[#9c5f3c]">如果出现明显急性风险、持续强烈的情绪危机、严重身体异常或任何需要紧急处理的症状，请优先联系家人、医院、专业医生或紧急热线，而不是只停留在应用内自助处理。</p>
              </div>
            </div>
          </Card>
        </div>

        <Card id="faq" className="scroll-mt-32 border border-[#e4ddd1] bg-[#fffdf9] p-6 sm:p-7">
          <DocsSectionHeader icon={BookOpen} title="FAQ" desc="更适合对外说明和演示讲解时直接引用的几个高频问题。" />
          <div className="mt-5 space-y-3">
            {appGuideContent.faq.map((item) => (
              <details key={item.question} className="rounded-[1.5rem] border border-[#e7e0d4] bg-white p-4">
                <summary className="cursor-pointer text-sm font-semibold text-[#46564c]">{item.question}</summary>
                <p className="mt-3 text-sm leading-6 text-[#667168]">{item.answer}</p>
              </details>
            ))}
          </div>
        </Card>

        <Card id="next-step" className="scroll-mt-32 bg-[linear-gradient(135deg,#4e6057,#708577)] p-6 text-white sm:p-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/65">Next Step</p>
              <h2 className="mt-2 text-2xl font-bold">下一步推荐路径</h2>
              <div className="mt-3 space-y-2">
                {appGuideContent.nextSteps.map((item) => <p key={item} className="max-w-3xl text-sm leading-6 text-white/82">{item}</p>)}
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={openHome} className="rounded-full bg-white px-5 py-3 text-sm font-bold text-[#4f6158] transition hover:bg-[#f3f6f4]">返回首页体验</button>
              <button type="button" onClick={openTest} className="rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/14">查看功能测试页</button>
            </div>
          </div>
        </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
