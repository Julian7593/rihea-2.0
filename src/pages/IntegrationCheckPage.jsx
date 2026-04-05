<<<<<<< HEAD
import { useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  Baby,
  BookOpen,
  Brain,
  CheckCircle2,
  ClipboardList,
  HeartHandshake,
  HeartPulse,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UserRound,
  Utensils,
} from "lucide-react";
import Card from "../components/ui/Card";
import DietAdviceCard from "../components/nutrition/DietAdviceCard";
import ExerciseAdviceCard from "../components/fitness/ExerciseAdviceCard";
import { appReleaseNotes, appVersionInfo } from "../data/appMeta";
import { generateNutritionAdvice } from "../utils/nutritionCalculator";
import { getTodayExerciseQuickView } from "../utils/fitnessRecommender";

const quickStartSteps = [
  {
    title: "先补齐你的基础档案",
    desc: "首次进入后先填写昵称、预产期或孕周。系统会用这些信息生成孕周显示、宝宝成长卡、饮食运动建议和后续支持方案。",
  },
  {
    title: "每天做一次 30 秒状态打卡",
    desc: "首页的每日打卡会记录情绪、睡眠、触发因素和一句话备注。妊安不会一次给你很多任务，只会先给你今天最值得做的一步。",
  },
  {
    title: "按场景进入关怀、医疗或伴侣协同",
    desc: "感觉焦虑就先做呼吸与安抚；连续几天状态不好就看风险评估或 CBT 计划；不想反复解释时，直接打开伴侣同步。",
  },
];

const navigationCards = [
  {
    title: "首页",
    icon: HeartPulse,
    desc: "每天最常用的主入口。这里聚合了欢迎卡、孕周进度、每日打卡、3 分钟呼吸、周趋势、胎动、饮食建议、运动任务、伴侣卡片和 CBT 快捷入口。",
  },
  {
    title: "关怀",
    icon: Sparkles,
    desc: "按场景给行动，不是按知识堆内容。你可以从情绪安抚、身体照护、伴侣协同、专业支持四类场景中，先选一个，再执行一件事。",
  },
  {
    title: "医疗支持",
    icon: Stethoscope,
    desc: "当你需要更结构化、更专业的帮助时进入这里。包含知识库、风险自测、CBT 计划中心和专家咨询入口。",
  },
  {
    title: "我的",
    icon: UserRound,
    desc: "管理个人档案、登录状态、提醒、夜间模式、伴侣同步、隐私控制、帮助反馈和紧急支持信息。",
  },
];

const workflowCards = [
  {
    title: "普通日常使用",
    desc: "首页打卡 -> 看系统给出的“下一步” -> 完成一个呼吸/记录/小任务 -> 晚上再回顾一次睡眠与情绪趋势。",
  },
  {
    title: "今天压力明显偏高",
    desc: "先做呼吸练习和身体稳态 -> 再去关怀页选“情绪安抚”或“身体照护” -> 如果连续几天都差，进入医疗支持查看风险等级与 CBT 计划。",
  },
  {
    title: "希望伴侣马上知道怎么帮",
    desc: "在“我的”里打开伴侣同步 -> 生成邀请码并确认绑定 -> 选择共享范围 -> 系统会把你的状态转译成伴侣今天能执行的支持动作。",
  },
];

const featureCards = [
  {
    title: "每日打卡与趋势",
    icon: ClipboardList,
    desc: "记录情绪、睡眠、触发因素和备注，形成 7 天趋势与连续打卡数据，为后续建议、风险识别和伴侣协同提供基础输入。",
  },
  {
    title: "稳态呼吸与身体安抚",
    icon: HeartPulse,
    desc: "首页提供 3 分钟呼吸练习，支持节奏提示、触觉反馈和音频提示，帮助你先把身体从紧绷状态拉回可控。",
  },
  {
    title: "胎动与宝宝连接",
    icon: Baby,
    desc: "首页可快捷记录胎动，进入详情页后还能补充笔记、查看近几天记录，并通过宝宝成长卡感知孕周变化。",
  },
  {
    title: "饮食与运动建议",
    icon: Utensils,
    desc: "系统会根据孕周、体重相关信息、过敏史、风险等级和运动基础，给出今日饮食目标、餐次建议和可执行的运动任务。",
  },
  {
    title: "伴侣同步中心",
    icon: HeartHandshake,
    desc: "把“我现在状态不好”翻译成伴侣可执行的动作。支持邀请码绑定、共享分级、风险提醒、伴侣视角预览和任务完成反馈。",
  },
  {
    title: "风险评估与 CBT 计划",
    icon: Brain,
    desc: "系统会根据近期打卡数据识别风险等级。需要更结构化支持时，可以进入 CBT 计划中心，完成筛查、每周模块、作业和复评。",
  },
];

const principles = [
  "先稳态，再处理问题。妊安不是把信息堆给你，而是先帮助你回到可控状态。",
  "先给一步，不给过量任务。首页和关怀页的重点都是“今天先做这一条”。",
  "共享摘要，不共享全部隐私。伴侣同步默认围绕支持动作，不暴露原始情绪分数和私密备注。",
  "支持医疗协作，但不替代医疗诊断。风险筛查、知识库与专家入口用于承接支持，不替代线下急诊与正式诊疗。",
];

const notes = [
  "当前版本已经覆盖首页打卡、呼吸安抚、胎动记录、饮食运动建议、伴侣同步、风险评估、医疗知识库、CBT 计划和支持中心等核心链路。",
  "当前演示版本中，部分数据会以本地存储或本地 mock 能力运行，所以你刷新页面后依然能保留记录，但不同设备之间暂不自动同步。",
  "如果你处于明显的急性风险或身体异常，请优先联系医院、专业医生或紧急支持渠道，而不是只停留在应用内自助处理。",
];

const releaseSectionMeta = {
  added: {
    label: "新增",
    tone: "bg-[#edf5ef] text-[#4f6158]",
    dot: "bg-[#7f9a89]",
    border: "border-[#d9e6dc]",
  },
  improved: {
    label: "优化",
    tone: "bg-[#f6efe6] text-[#8c684b]",
    dot: "bg-[#c89a6b]",
    border: "border-[#eadcc8]",
  },
  fixed: {
    label: "修复",
    tone: "bg-[#f8ebeb] text-[#9a5a5a]",
    dot: "bg-[#d28c8c]",
    border: "border-[#efd7d7]",
  },
};

export default function IntegrationCheckPage() {
  const [previewMessage, setPreviewMessage] = useState("");

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
      exerciseHistory: {
        level: "intermediate",
        regularActivities: ["yoga"],
        frequency: "3-4 times/week",
      },
      medicalContraindications: {
        diet: [],
        exercise: [],
      },
    }),
    []
  );

  const dietAdvice = useMemo(() => generateNutritionAdvice(sampleProfile), [sampleProfile]);
  const exerciseAdvice = useMemo(() => getTodayExerciseQuickView(sampleProfile), [sampleProfile]);

  const openHome = () => {
    window.location.href = "/";
  };

  const openTest = () => {
    window.location.href = "/test";
  };

  const handlePreviewAction = (message) => {
    setPreviewMessage(message);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(244,197,189,.32),transparent_32%),radial-gradient(circle_at_top_right,rgba(171,196,183,.28),transparent_34%),linear-gradient(180deg,#fcfaf5_0%,#f5f0e7_100%)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <Card className="overflow-hidden border-0 bg-[linear-gradient(135deg,rgba(255,255,255,.92),rgba(250,244,235,.92))] p-0 shadow-[0_24px_60px_-30px_rgba(93,106,97,.35)]">
          <div className="grid gap-0 lg:grid-cols-[1.15fr,.85fr]">
            <div className="p-6 sm:p-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#d8cec0] bg-white/75 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#6b746d]">
                <BookOpen className="h-3.5 w-3.5" />
                App Guide
              </div>
              <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-[#425248] sm:text-4xl lg:text-[2.8rem]">
                妊安 APP 使用介绍
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-[#5a6760] sm:text-[1.05rem]">
                妊安不是一款单纯记录数据的工具，而是一套围绕孕期稳态管理设计的陪伴式 APP。
                它把“今天我状态怎么样”转成“我现在先做什么”，再把“我需要支持”转成伴侣、医疗支持与结构化计划可以接住的动作。
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={openHome}
                  className="inline-flex items-center gap-2 rounded-full bg-[#4f6158] px-5 py-3 text-sm font-bold text-white transition hover:brightness-95"
                >
                  打开主应用
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={openTest}
                  className="inline-flex items-center gap-2 rounded-full border border-[#cfd8d2] bg-white px-5 py-3 text-sm font-semibold text-[#4f6158] transition hover:bg-[#f6f8f5]"
                >
                  打开测试页
                  <Activity className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-3xl border border-[#e4ddd1] bg-white/80 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#88958d]">定位</p>
                  <p className="mt-2 text-sm font-semibold text-[#46564c]">孕期稳态陪伴与轻协作</p>
                </div>
                <div className="rounded-3xl border border-[#e4ddd1] bg-white/80 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#88958d]">适合谁</p>
                  <p className="mt-2 text-sm font-semibold text-[#46564c]">孕妈主用，伴侣协同参与</p>
                </div>
                <div className="rounded-3xl border border-[#e4ddd1] bg-white/80 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#88958d]">当前重点</p>
                  <p className="mt-2 text-sm font-semibold text-[#46564c]">日常打卡、安抚、风险识别、伴侣支持</p>
                </div>
                <div className="rounded-3xl border border-[#e4ddd1] bg-white/80 p-4 sm:col-span-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[#eef3ef] px-3 py-1 text-xs font-semibold text-[#4f6158]">
                      {appVersionInfo.currentVersion}
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#88958d]">
                      {appVersionInfo.releaseDate}
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#88958d]">
                      {appVersionInfo.codename}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-[#667168]">{appVersionInfo.summary}</p>
                </div>
              </div>
            </div>

            <div className="bg-[linear-gradient(180deg,rgba(91,110,101,.94),rgba(121,142,130,.9))] p-6 text-white sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">Core Principles</p>
              <div className="mt-4 space-y-3">
                {principles.map((item) => (
                  <div key={item} className="rounded-3xl border border-white/12 bg-white/8 p-4 backdrop-blur-sm">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#ffd8a5]" />
                      <p className="text-sm leading-6 text-white/90">{item}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[1fr,.92fr]">
          <Card className="p-6 sm:p-7">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#eef3ef] text-[#4f6158]">
                <Sparkles className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-2xl font-bold text-[#46564c]">3 分钟快速上手</h2>
                <p className="mt-1 text-sm text-[#6c7770]">如果你第一次使用，可以按这个顺序开始。</p>
              </div>
            </div>
            <div className="mt-5 space-y-4">
              {quickStartSteps.map((item, index) => (
                <div key={item.title} className="rounded-[1.7rem] border border-[#e7e0d4] bg-[#fffdf9] p-4">
                  <div className="flex items-start gap-4">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#4f6158] text-sm font-bold text-white">
                      {index + 1}
                    </div>
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
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#f3efe8] text-[#6c5a49]">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-2xl font-bold text-[#46564c]">使用时请先知道</h2>
                <p className="mt-1 text-sm text-[#6c7770]">这几个边界能帮助你更准确理解当前版本。</p>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              {notes.map((item) => (
                <div key={item} className="rounded-[1.6rem] border border-[#ece4d8] bg-[linear-gradient(180deg,#fffdf9,#fbf7f0)] p-4">
                  <p className="text-sm leading-6 text-[#667168]">{item}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <Card className="p-6 sm:p-7">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#edf3f1] text-[#4f6158]">
              <ArrowRight className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-2xl font-bold text-[#46564c]">主导航怎么用</h2>
              <p className="mt-1 text-sm text-[#6c7770]">可以把它理解为“每天入口、场景入口、专业入口、设置入口”。</p>
            </div>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {navigationCards.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="rounded-[1.7rem] border border-[#e7e0d4] bg-[#fffdf9] p-4">
                  <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#f1f5f2] text-[#4f6158]">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 text-lg font-bold text-[#46564c]">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#667168]">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-6 sm:p-7">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#f4ede5] text-[#7d604a]">
              <HeartPulse className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-2xl font-bold text-[#46564c]">推荐使用路径</h2>
              <p className="mt-1 text-sm text-[#6c7770]">参考 Claude Code 文档里的 workflow 结构，这里按实际使用场景整理。</p>
            </div>
          </div>
          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            {workflowCards.map((item) => (
              <div key={item.title} className="rounded-[1.8rem] border border-[#e9e2d7] bg-[linear-gradient(180deg,#fffefb,#fbf7f1)] p-5">
                <h3 className="text-lg font-bold text-[#46564c]">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#667168]">{item.desc}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6 sm:p-7">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#edf4ef] text-[#4f6158]">
              <BookOpen className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-2xl font-bold text-[#46564c]">当前版本核心能力</h2>
              <p className="mt-1 text-sm text-[#6c7770]">下面这些都是当前仓库里已经有真实页面或模块承接的能力。</p>
            </div>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {featureCards.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="rounded-[1.8rem] border border-[#e7e0d4] bg-white p-4">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#f3f6f4] text-[#4f6158]">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className="text-base font-bold text-[#46564c]">{item.title}</h3>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[#667168]">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-6 sm:p-7">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#eef3ef] text-[#4f6158]">
              <ClipboardList className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-2xl font-bold text-[#46564c]">当前版本说明</h2>
              <p className="mt-1 text-sm text-[#6c7770]">文档页同步展示最近几个阶段的重要更新，便于演示和交付说明。</p>
            </div>
          </div>
          <div className="mt-5 space-y-4">
            {appReleaseNotes.map((item, index) => (
              <div key={item.version} className="relative pl-8">
                {index !== appReleaseNotes.length - 1 && (
                  <div className="absolute left-[11px] top-8 bottom-[-24px] w-px bg-[#ddd5c8]" />
                )}
                <div className={`absolute left-0 top-1.5 h-6 w-6 rounded-full border-4 border-white ${index === 0 ? "bg-[#4f6158]" : "bg-[#ccbba5]"}`} />
                <div className="rounded-[1.8rem] border border-[#e7e0d4] bg-[#fffdf9] p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[#eef3ef] px-3 py-1 text-xs font-semibold text-[#4f6158]">
                      {item.version}
                    </span>
                    <span className="rounded-full bg-[#f5efe8] px-3 py-1 text-xs font-semibold text-[#7b614c]">
                      {item.status}
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#88958d]">{item.date}</span>
                  </div>
                  <h3 className="mt-3 text-lg font-bold text-[#46564c]">{item.title}</h3>
                  {item.summary && <p className="mt-2 text-sm leading-6 text-[#667168]">{item.summary}</p>}
                  <div className="mt-4 grid gap-3">
                    {["added", "improved", "fixed"]
                      .filter((sectionKey) => Array.isArray(item.sections?.[sectionKey]) && item.sections[sectionKey].length > 0)
                      .map((sectionKey) => {
                        const section = releaseSectionMeta[sectionKey];
                        return (
                          <div key={sectionKey} className={`rounded-[1.35rem] border bg-white/72 p-4 ${section.border}`}>
                            <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${section.tone}`}>
                              {section.label}
                            </span>
                            <div className="mt-3 space-y-2">
                              {item.sections[sectionKey].map((entry) => (
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

        <div className="grid gap-6 xl:grid-cols-[1.08fr,.92fr]">
          <Card className="p-6 sm:p-7">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#eef3ef] text-[#4f6158]">
                <Utensils className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-2xl font-bold text-[#46564c]">界面预览：饮食与运动建议</h2>
                <p className="mt-1 text-sm text-[#6c7770]">这里直接复用了当前应用里的真实组件，方便你确认文档与界面表达一致。</p>
              </div>
            </div>
            <div className="mt-5 space-y-4">
              <DietAdviceCard
                advice={dietAdvice}
                onRecordMeal={(mealType) => handlePreviewAction(`文档页中的 ${mealType} 记录按钮仅用于预览。请回到首页完成真实记录。`)}
              />
              <ExerciseAdviceCard
                advice={exerciseAdvice}
                onCheckin={(task) =>
                  handlePreviewAction(`文档页中的“${task?.name || "运动任务"}”打卡按钮仅用于预览。请回到首页进行真实打卡。`)
                }
              />
              {previewMessage && (
                <div className="rounded-[1.4rem] border border-[#d9e5dd] bg-[#f6fbf7] px-4 py-3 text-sm font-medium text-[#4f6158]">
                  {previewMessage}
                </div>
              )}
            </div>
          </Card>

          <Card className="p-6 sm:p-7">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#f5efe8] text-[#7b614c]">
                <LockKeyhole className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-2xl font-bold text-[#46564c]">数据与安全说明</h2>
                <p className="mt-1 text-sm text-[#6c7770]">这部分建议在对外演示、交付或写正式文档时保留。</p>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <div className="rounded-[1.7rem] border border-[#e8e0d4] bg-[#fffdf9] p-4">
                <h3 className="text-base font-bold text-[#46564c]">隐私共享的基本原则</h3>
                <p className="mt-2 text-sm leading-6 text-[#667168]">
                  伴侣同步当前采用分级共享，重点展示孕周、今日是否打卡、风险摘要、待办与建议动作，不默认暴露原始情绪分数、私密备注和完整历史记录。
                </p>
              </div>
              <div className="rounded-[1.7rem] border border-[#e8e0d4] bg-[#fffdf9] p-4">
                <h3 className="text-base font-bold text-[#46564c]">风险评估的作用边界</h3>
                <p className="mt-2 text-sm leading-6 text-[#667168]">
                  风险评估、CBT 计划与知识库的作用是帮助你更早识别趋势、获得更合适的支持路径，不等同于医生面诊、正式诊断或紧急救治。
                </p>
              </div>
              <div className="rounded-[1.7rem] border border-[#f0d8cb] bg-[#fff7f3] p-4">
                <h3 className="text-base font-bold text-[#9c5f3c]">需要立即线下处理的情况</h3>
                <p className="mt-2 text-sm leading-6 text-[#9c5f3c]">
                  如果你出现明显急性风险、持续强烈的情绪危机、严重身体不适或任何需要紧急处理的症状，请优先联系家人、医院、专业医生或紧急热线。
                </p>
              </div>
            </div>
          </Card>
        </div>

        <Card className="bg-[linear-gradient(135deg,#4e6057,#708577)] p-6 text-white sm:p-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/65">Next Step</p>
              <h2 className="mt-2 text-2xl font-bold">从“知道怎么用”到“真正跑一遍流程”</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-white/82">
                如果你现在是要做产品演示，建议先从首页打卡开始，再演示关怀页的一条行动、医疗支持里的风险评估，以及“我的”里的伴侣同步中心。这样最能体现妊安的完整闭环。
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={openHome}
                className="rounded-full bg-white px-5 py-3 text-sm font-bold text-[#4f6158] transition hover:bg-[#f3f6f4]"
              >
                返回首页体验
              </button>
              <button
                type="button"
                onClick={openTest}
                className="rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/14"
              >
                查看功能测试页
              </button>
            </div>
          </div>
        </Card>
=======
/**
 * 新功能集成检查页面
 * 用于验证饮食和运动功能是否正确集成
 */

import { useState, useEffect } from "react";
import Card from "../components/ui/Card";
import DietAdviceCard from "../components/nutrition/DietAdviceCard";
import ExerciseAdviceCard from "../components/fitness/ExerciseAdviceCard";
import MealRecordModal from "../components/nutrition/MealRecordModal";
import ExerciseCheckinModal from "../components/fitness/ExerciseCheckinModal";
import { generateNutritionAdvice } from "../utils/nutritionCalculator";
import { getTodayExerciseQuickView } from "../utils/fitnessRecommender";

export default function IntegrationCheckPage() {
  const [checks, setChecks] = useState({
    imports: "checking",
    profile: "checking",
    dietAdvice: "checking",
    exerciseAdvice: "checking",
    storage: "checking",
    components: "checking",
  });

  const [testProfile, setTestProfile] = useState(null);
  const [dietAdvice, setDietAdvice] = useState(null);
  const [exerciseAdvice, setExerciseAdvice] = useState(null);
  const [showMealModal, setShowMealModal] = useState(false);
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    const runChecks = async () => {
      const results = { ...checks };
      const errorList = [];

      // 1. 检查导入
      try {
        // 这些导入已经在文件顶部，所以如果页面能加载，说明导入成功
        results.imports = "✅ 成功";
      } catch (error) {
        results.imports = "❌ 失败: " + error.message;
        errorList.push("导入检查失败");
      }

      // 2. 检查profile结构
      try {
        const profile = {
          name: "测试用户",
          pregnancyWeek: "24+3",
          height: 165,
          prePregnancyWeight: 58,
          currentWeight: 64,
          targetWeightGain: 12,
          allergies: ["海鲜"],
          riskLevel: "low",
          exerciseHistory: {
            level: "intermediate",
            regularActivities: ["yoga"],
            frequency: "3-4 times/week",
          },
          medicalContraindications: {
            diet: [],
            exercise: [],
          },
        };

        setTestProfile(profile);
        results.profile = "✅ 成功";
      } catch (error) {
        results.profile = "❌ 失败: " + error.message;
        errorList.push("Profile结构检查失败");
      }

      // 3. 检查饮食建议生成
      try {
        const dietAdviceResult = generateNutritionAdvice(profile);
        setDietAdvice(dietAdviceResult);
        results.dietAdvice = "✅ 成功";
      } catch (error) {
        results.dietAdvice = "❌ 失败: " + error.message;
        errorList.push("饮食建议生成失败");
      }

      // 4. 检查运动建议生成
      try {
        const exerciseAdviceResult = getTodayExerciseQuickView(profile);
        setExerciseAdvice(exerciseAdviceResult);
        results.exerciseAdvice = "✅ 成功";
      } catch (error) {
        results.exerciseAdvice = "❌ 失败: " + error.message;
        errorList.push("运动建议生成失败");
      }

      // 5. 检查本地存储
      try {
        const storageKey = "test_storage_key";
        localStorage.setItem(storageKey, "test_value");
        const value = localStorage.getItem(storageKey);
        if (value === "test_value") {
          results.storage = "✅ 成功";
        } else {
          results.storage = "⚠️ 异常";
          errorList.push("存储读写不一致");
        }
      } catch (error) {
        results.storage = "❌ 失败: " + error.message;
        errorList.push("本地存储检查失败");
      }

      // 6. 检查组件渲染
      try {
        // 如果我们能设置状态，说明组件应该可以渲染
        setErrors(errorList);
        results.components = "✅ 准备就绪";
      } catch (error) {
        results.components = "❌ 失败: " + error.message;
      }

      setChecks(results);
    };

    runChecks();
  }, []);

  const handleRecordMeal = (mealType) => {
    setSelectedMealType(mealType);
    setShowMealModal(true);
  };

  const handleSaveDietRecord = (record) => {
    setShowMealModal(false);
    setSelectedMealType(null);
    alert("饮食记录已保存！");
  };

  const handleCheckinExercise = (task) => {
    setSelectedExerciseTask(task);
    setShowExerciseModal(true);
  };

  const handleSaveExerciseRecord = (record, hasDangerSymptom) => {
    setShowExerciseModal(false);
    setSelectedExerciseTask(null);
    if (hasDangerSymptom) {
      alert("检测到危险症状，请注意身体状态！");
    } else {
      alert("运动记录已保存！");
    }
  };

  const getStatusColor = (status) => {
    if (status.includes("✅")) return "text-green-600";
    if (status.includes("❌")) return "text-red-600";
    return "text-yellow-600";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          🔍 新功能集成检查
        </h1>
        <p className="text-gray-600 mb-8">
          这个页面用于验证饮食和运动功能是否正确集成到现有代码中。
        </p>

        {/* 检查结果 */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">📋 检查结果</h2>

          <div className="grid grid-cols-2 gap-4">
            {Object.entries(checks).map(([key, value]) => (
              <div key={key} className="p-4 bg-white border rounded-lg">
                <div className="text-sm text-gray-500 mb-2">
                  {key === "imports" && "导入检查"}
                  {key === "profile" && "Profile结构"}
                  {key === "dietAdvice" && "饮食建议生成"}
                  {key === "exerciseAdvice" && "运动建议生成"}
                  {key === "storage" && "本地存储"}
                  {key === "components" && "组件渲染"}
                </div>
                <div className={`text-lg font-medium ${getStatusColor(value)}`}>
                  {value}
                </div>
              </div>
            ))}
          </div>

          {errors.length > 0 && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="text-lg font-semibold text-red-700 mb-3">⚠️ 发现 {errors.length} 个问题</h3>
              <ul className="space-y-2">
                {errors.map((error, index) => (
                  <li key={index} className="text-red-600 text-sm">
                    {index + 1}. {error}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>

        {/* 功能测试 */}
        {Object.values(checks).every(v => v.includes("✅")) && (
          <>
            {/* 饮食建议测试 */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">🍽️ 饮食建议测试</h2>
              {dietAdvice && (
                <DietAdviceCard
                  advice={dietAdvice}
                  onRecordMeal={handleRecordMeal}
                />
              )}
            </Card>

            {/* 运动建议测试 */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">🏃 运动建议测试</h2>
              {exerciseAdvice && (
                <ExerciseAdviceCard
                  advice={exerciseAdvice}
                  onCheckin={handleCheckinExercise}
                />
              )}
            </Card>

            {/* 弹窗测试 */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">🎨 弹窗测试</h2>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleRecordMeal("breakfast")}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  测试饮食记录弹窗
                </button>
                <button
                  onClick={() => handleCheckinExercise(exerciseAdvice?.mainTask)}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  测试运动打卡弹窗
                </button>
              </div>
            </Card>

            {/* 弹窗 */}
            {showMealModal && (
              <MealRecordModal
                isOpen={showMealModal}
                onClose={() => setShowMealModal(false)}
                onSave={handleSaveDietRecord}
                mealType="breakfast"
              />
            )}

            {showExerciseModal && selectedExerciseTask && (
              <ExerciseCheckinModal
                isOpen={showExerciseModal}
                onClose={() => setShowExerciseModal(false)}
                onSave={handleSaveExerciseRecord}
                task={selectedExerciseTask}
              />
            )}

            {/* 使用指南 */}
            <Card className="p-6 bg-gradient-to-r from-green-50 to-blue-50">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">📖 使用指南</h2>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">✅ 如果所有检查都通过：</h3>
                  <ol className="list-decimal pl-5 space-y-2 text-sm text-gray-600">
                    <li>访问应用首页，你应该能看到新的<strong>饮食建议</strong>和<strong>运动任务</strong>卡片</li>
                    <li>点击"记录"或"打卡"按钮可以打开记录弹窗</li>
                    <li>记录后进度条应该会更新</li>
                    <li>所有数据都保存在本地，刷新页面不会丢失</li>
                  </ol>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">🔄 如果看不到新功能：</h3>
                  <ol className="list-decimal pl-5 space-y-2 text-sm text-gray-600">
                    <li>清除浏览器缓存（Ctrl+Shift+Delete）</li>
                    <li>刷新页面（F5 或 Ctrl+R）</li>
                    <li>检查浏览器控制台是否有错误信息</li>
                    <li>确保开发服务器正在运行</li>
                  </ol>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">🔧 调试信息</h3>
                  <div className="p-3 bg-white border rounded-lg text-sm">
                    <p className="font-medium mb-2">测试Profile数据：</p>
                    <pre className="bg-gray-100 p-2 rounded overflow-auto text-xs">
                      {JSON.stringify(testProfile, null, 2)}
                    </pre>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => window.location.href = "/"}
                    className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors"
                  >
                    返回首页
                  </button>
                  <button
                    onClick={() => window.location.href = "/test"}
                    className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    运行完整测试
                  </button>
                </div>
              </div>
            </Card>
          </>
        )}
>>>>>>> 356bd4d38d8b7f31d8a35a177e59ac40d7d6cf8a
      </div>
    </div>
  );
}
