import { useState, useEffect } from "react";
import { ArrowLeft, HeartPulse, Brain, Users, BookOpen, ClipboardList } from "lucide-react";
import Card from "../ui/Card";
import KnowledgeLibrary from "./KnowledgeLibrary";
import RiskAssessment from "./RiskAssessment";
import ExpertConsultation from "./ExpertConsultation";
import CbtProgramCenter from "../cbt/CbtProgramCenter";
<<<<<<< HEAD
import { fetchCbtOverview } from "../../api/cbt";
=======
>>>>>>> 356bd4d38d8b7f31d8a35a177e59ac40d7d6cf8a
import { assessEmotionalRisk } from "../../utils/riskAssessment";
import { readCheckIns } from "../../utils/checkin";
import { txt } from "../../utils/txt";

export default function MedicalSupportCenter({
  lang,
  style,
  pregnancyWeek,
  profile = {},
  checkIns = [],
  onClose,
  pageRequest,
  onPageRequestConsumed,
  cbtRefreshToken = 0,
  onCbtUpdated,
}) {
  const [activeTab, setActiveTab] = useState("knowledge");
  const [riskAssessment, setRiskAssessment] = useState(null);
<<<<<<< HEAD
  const [cbtAssessment, setCbtAssessment] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const source = Array.isArray(checkIns) && checkIns.length > 0 ? checkIns : readCheckIns();
    const requestContext = {
      lang,
      profile: {
        pregnancyWeek: profile?.pregnancyWeek || pregnancyWeek || "24+0",
        dueDate: profile?.dueDate || "",
      },
      checkIns: source,
    };

    fetchCbtOverview(requestContext)
      .then((overview) => {
        if (cancelled) return;
        setCbtAssessment(overview?.intakeAssessment || null);
      })
      .catch(() => {
        if (!cancelled) {
          setCbtAssessment(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [checkIns, lang, pregnancyWeek, profile?.dueDate, profile?.pregnancyWeek, cbtRefreshToken]);

  useEffect(() => {
    const source = Array.isArray(checkIns) && checkIns.length > 0 ? checkIns : readCheckIns();
    const assessment = assessEmotionalRisk({ checkIns: source, cbtAssessment, lang });
    setRiskAssessment(assessment);
  }, [cbtAssessment, checkIns, lang]);
=======

  // Calculate risk assessment on mount
  useEffect(() => {
    const source = Array.isArray(checkIns) && checkIns.length > 0 ? checkIns : readCheckIns();
    const assessment = assessEmotionalRisk({ checkIns: source, lang });
    setRiskAssessment(assessment);
  }, [checkIns, lang]);
>>>>>>> 356bd4d38d8b7f31d8a35a177e59ac40d7d6cf8a

  const tabs = [
    {
      id: "knowledge",
      icon: BookOpen,
      label: { zh: "知识库", en: "Knowledge" },
      description: { zh: "医疗科普文章", en: "Medical Articles" }
    },
    {
      id: "assessment",
      icon: Brain,
      label: { zh: "风险自测", en: "Risk Assessment" },
      description: { zh: "情绪风险评估", en: "Emotional Risk Check" }
    },
    {
      id: "cbt",
      icon: ClipboardList,
      label: { zh: "CBT计划", en: "CBT Plan" },
      description: { zh: "筛查分层、作业执行与临床协作", en: "Screening, plan execution and clinical follow-up" }
    },
    {
      id: "experts",
      icon: Users,
      label: { zh: "专家咨询", en: "Expert Consult" },
      description: { zh: "专业医生咨询", en: "Professional Help" }
    }
  ];

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
  };

<<<<<<< HEAD
  const handleNavigateToSupport = (target) => {
    if (target === "cbt") {
      setActiveTab("cbt");
      return;
    }
    if (target === "experts") {
      setActiveTab("experts");
    }
  };

=======
>>>>>>> 356bd4d38d8b7f31d8a35a177e59ac40d7d6cf8a
  useEffect(() => {
    if (!pageRequest?.pageId) return;
    if (pageRequest.pageId === "cbt") {
      setActiveTab("cbt");
    }
    if (onPageRequestConsumed) {
      onPageRequestConsumed();
    }
  }, [onPageRequestConsumed, pageRequest]);

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 transition-colors hover:bg-cream/60"
          >
            <ArrowLeft className="h-5 w-5 text-clay/70" />
          </button>
        )}
        <div>
          <h1 className="font-heading text-2xl font-bold text-clay">
            {txt(lang, "Medical Support Center", "医疗支持中心")}
          </h1>
          <p className="text-sm text-clay/70">
            {txt(lang, "Professional guidance for your journey", "专业陪伴您的孕产之旅")}
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <Card style={style} className="overflow-hidden p-0">
        <div className="flex gap-1 overflow-x-auto border-b px-4 py-3 sm:px-5" style={{ borderColor: style.line }}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const buttonStyle = isActive
              ? {
                  backgroundColor: "#6F8579",
                  borderColor: "#6F8579",
                  color: "#FFFDF8",
                  boxShadow: "0 10px 22px -14px rgba(79, 97, 88, 0.55)",
                }
              : {
                  backgroundColor: "#FFFAF2",
                  borderColor: style?.line || "rgba(79, 97, 88, 0.18)",
                  color: "#4F6158",
                };
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className="shrink-0 flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all hover:brightness-[0.98]"
                style={buttonStyle}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {tab.id === "assessment" && riskAssessment?.level === "high" && "⚠️ "}
                  {tab.label[lang]}
                  {tab.id === "assessment" && riskAssessment?.level && (
                    <span className="ml-1 text-xs opacity-70">
                      ({txt(lang, `Risk: ${riskAssessment.level.toUpperCase()}`, `风险：${riskAssessment.level.toUpperCase()}`)})
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>

        <div className="px-4 py-3 sm:px-5">
          <p className="text-sm text-clay/70">
            {tabs.find(t => t.id === activeTab)?.description[lang]}
          </p>
        </div>
      </Card>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === "knowledge" && (
          <KnowledgeLibrary
            lang={lang}
            style={style}
            pregnancyWeek={pregnancyWeek}
            riskLevel={riskAssessment?.level}
<<<<<<< HEAD
            alert={riskAssessment?.alert}
=======
>>>>>>> 356bd4d38d8b7f31d8a35a177e59ac40d7d6cf8a
          />
        )}

        {activeTab === "assessment" && (
          <RiskAssessment
            lang={lang}
            style={style}
<<<<<<< HEAD
            checkIns={Array.isArray(checkIns) ? checkIns : []}
            cbtAssessment={cbtAssessment}
            riskAssessment={riskAssessment}
            onNavigateToSupport={handleNavigateToSupport}
=======
>>>>>>> 356bd4d38d8b7f31d8a35a177e59ac40d7d6cf8a
          />
        )}

        {activeTab === "cbt" && (
          <CbtProgramCenter
            lang={lang}
            style={style}
            profile={{
              ...profile,
              pregnancyWeek,
            }}
            checkIns={Array.isArray(checkIns) ? checkIns : []}
            refreshToken={cbtRefreshToken}
            onProgramUpdated={onCbtUpdated}
          />
        )}

        {activeTab === "experts" && (
          <ExpertConsultation
            lang={lang}
            style={style}
            pregnancyWeek={pregnancyWeek}
<<<<<<< HEAD
            riskAssessment={riskAssessment}
=======
>>>>>>> 356bd4d38d8b7f31d8a35a177e59ac40d7d6cf8a
          />
        )}
      </div>

      {/* Footer Info */}
      <Card style={style} className="bg-gradient-to-r from-sage-50 to-cream/40">
        <div className="flex items-start gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-sage-100">
            <HeartPulse className="h-6 w-6 text-sage-600" />
          </div>
          <div>
            <h4 className="font-heading text-base font-bold text-clay">
              {txt(lang, "About Medical Support", "关于医疗支持")}
            </h4>
            <p className="mt-1 text-sm text-clay/75">
              {txt(
                lang,
                "This center provides general health information and connects you with verified healthcare professionals. For medical emergencies, please call emergency services or go to the nearest hospital.",
                "本中心提供一般健康信息，并为您连接经过验证的医疗专业人员。如有医疗紧急情况，请拨打急救电话或前往最近医院。"
              )}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
