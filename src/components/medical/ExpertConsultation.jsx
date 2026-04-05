import { useState } from "react";
import { User, Star, MessageCircle, Phone, Video, Filter, ChevronRight, Calendar } from "lucide-react";
import Card from "../ui/Card";
<<<<<<< HEAD
import { getAllExperts, matchExperts, EXPERT_TYPE_LABELS, EXPERT_TYPES } from "../../data/experts";
=======
import { matchExperts, EXPERT_TYPE_LABELS, EXPERT_TYPES } from "../../data/experts";
>>>>>>> 356bd4d38d8b7f31d8a35a177e59ac40d7d6cf8a
import { assessEmotionalRisk } from "../../utils/riskAssessment";
import { readCheckIns } from "../../utils/checkin";
import { txt } from "../../utils/txt";

<<<<<<< HEAD
export default function ExpertConsultation({ lang, style, pregnancyWeek, riskAssessment: riskAssessmentProp = null }) {
  const [selectedType, setSelectedType] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  const checkIns = readCheckIns();
  const riskAssessment = riskAssessmentProp || assessEmotionalRisk({ checkIns, lang });
  const fallbackExperts = getAllExperts(lang);
  const riskOrderedExperts = matchExperts(riskAssessment.level, pregnancyWeek || 24, lang);
  const prioritizedExperts =
    Array.isArray(riskAssessment?.expertTypes) && riskAssessment.expertTypes.length > 0
      ? [
          ...fallbackExperts.filter((expert) => riskAssessment.expertTypes.includes(expert.type)),
          ...fallbackExperts.filter((expert) => !riskAssessment.expertTypes.includes(expert.type)),
        ]
      : riskOrderedExperts;
  const recommendedExperts = prioritizedExperts.slice(0, 5);
  const allExperts = fallbackExperts;
=======
export default function ExpertConsultation({ lang, style, pregnancyWeek }) {
  const [selectedType, setSelectedType] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  // Get risk assessment to recommend experts
  const checkIns = readCheckIns();
  const riskAssessment = assessEmotionalRisk({ checkIns, lang });
  const recommendedExperts = matchExperts(
    riskAssessment.level,
    pregnancyWeek || 24,
    lang
  );
  const allExperts = matchExperts("low", pregnancyWeek || 24, lang);
>>>>>>> 356bd4d38d8b7f31d8a35a177e59ac40d7d6cf8a

  // Filter experts
  const filteredExperts = selectedType === "all"
    ? allExperts
    : allExperts.filter(exp => exp.type === selectedType);

  const expertTypes = Object.values(EXPERT_TYPES);

  const handleTypeClick = (type) => {
    setSelectedType(type);
    setShowFilters(false);
  };

  const handleBookClick = (expert) => {
    // In the future, this could link to a third-party platform or open a booking dialog
    console.log("Booking:", expert);
  };

  return (
    <div className="space-y-4">
      {/* Recommended Section */}
      {riskAssessment.hasData && (
        <Card style={style}>
          <div className="mb-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-clay/60">
              {txt(lang, "Recommended for You", "为您推荐")}
            </p>
            <p className="mt-1 text-sm text-clay/75">
              {txt(lang, "Based on your current emotional state, these experts may be most helpful:", "根据您当前的情绪状态，这些专家可能最有帮助：")}
            </p>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2">
            {recommendedExperts.slice(0, 3).map((expert) => (
              <div
                key={expert.id}
                className="shrink-0 rounded-xl border p-3 transition-colors hover:border-sage-300"
                style={{ borderColor: `${style.line}60`, minWidth: "200px" }}
              >
                <div className="flex items-start gap-2">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-cream/80">
                    <User className="h-5 w-5 text-clay/60" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-heading text-sm font-semibold text-clay">
                      {expert.name}
                    </h4>
                    <p className="text-xs text-clay/70">
                      {EXPERT_TYPE_LABELS[lang][expert.type]}
                    </p>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-1 text-xs text-yellow-600">
                  <Star className="h-3 w-3 fill-current" />
                  <span className="font-semibold">{expert.rating}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Filters */}
      <Card style={style} className="overflow-hidden p-0">
        <div className="border-b px-4 py-3 sm:px-5" style={{ borderColor: style.line }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-clay/60" />
              <p className="text-sm font-semibold text-clay">
                {txt(lang, "Filter by Expert Type", "按专家类型筛选")}
              </p>
            </div>
            <span className="text-xs font-semibold text-clay/60">
              {filteredExperts.length} {txt(lang, "experts", "位专家")}
            </span>
          </div>
        </div>

        <div className="px-4 py-3 sm:px-5">
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setSelectedType("all")}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
                selectedType === "all"
                  ? "bg-sage-600 text-white"
                  : "bg-[#fffaf2] text-clay/70"
              }`}
            >
              {txt(lang, "All Types", "全部类型")}
            </button>
            {expertTypes.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => handleTypeClick(type)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  selectedType === type
                    ? "bg-sage-600 text-white"
                    : "bg-[#fffaf2] text-clay/70"
                }`}
              >
                {EXPERT_TYPE_LABELS[lang][type]}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Expert List */}
      <div className="space-y-3">
        {filteredExperts.map((expert) => (
          <Card key={expert.id} style={style}>
            <div className="flex flex-col gap-4">
              {/* Expert Header */}
              <div className="flex items-start gap-4">
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-cream/80">
                  <User className="h-7 w-7 text-clay/60" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-heading text-xl font-bold text-clay">
                        {expert.name}
                      </h3>
                      <p className="text-sm font-semibold text-sage-600">
                        {EXPERT_TYPE_LABELS[lang][expert.type]}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-yellow-600">
                      <Star className="h-4 w-4 fill-current" />
                      <span className="font-bold">{expert.rating}</span>
                    </div>
                  </div>
                  <p className="mt-1 text-sm text-clay/75">
                    {expert.description}
                  </p>
                </div>
              </div>

              {/* Expert Details */}
              <div className="grid grid-cols-2 gap-2 rounded-xl bg-cream/40 p-3 sm:grid-cols-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-clay/60">
                    {txt(lang, "Experience", "经验")}
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-clay">
                    {expert.experience}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-clay/60">
                    {txt(lang, "Languages", "语言")}
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-clay">
                    {expert.languages.join(", ")}
                  </p>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-clay/60">
                    {txt(lang, "Specialties", "专长")}
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-clay">
                    {expert.specialties.slice(0, 2).join(", ")}
                  </p>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-clay/60">
                    {txt(lang, "Methods", "方式")}
                  </p>
                  <div className="mt-0.5 flex gap-1">
                    {expert.consultationMethods.includes("在线咨询") && (
                      <MessageCircle className="h-4 w-4 text-clay/60" />
                    )}
                    {expert.consultationMethods.includes("语音通话") && (
                      <Phone className="h-4 w-4 text-clay/60" />
                    )}
                    {expert.consultationMethods.includes("视频通话") && (
                      <Video className="h-4 w-4 text-clay/60" />
                    )}
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5">
                {expert.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                    style={{ backgroundColor: style.pillBg, color: style.pillText }}
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleBookClick(expert)}
                  className="inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors"
                  style={{ backgroundColor: style.primaryBg, color: style.primaryText }}
                >
                  <Calendar className="h-3.5 w-3.5" />
                  {txt(lang, "Book Consultation", "预约咨询")}
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-full border px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-cream/50"
                  style={{ borderColor: `${style.line}60` }}
                >
                  {txt(lang, "View Profile", "查看详情")}
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Third-Party Notice */}
      <div className="rounded-xl bg-cream/40 px-4 py-3">
        <p className="text-center text-[11px] text-clay/60">
          {txt(
            lang,
            "Consultation services are provided in partnership with verified healthcare platforms. Always verify credentials and follow up with your primary care provider.",
            "咨询服务与经过验证的医疗平台合作提供。请务必核实资质，并与您的初级保健医生跟进。"
          )}
        </p>
      </div>
    </div>
  );
}
