import { useState, useEffect } from "react";
import { Shield, TrendingUp, TrendingDown, Activity, Moon, ChevronRight, AlertTriangle } from "lucide-react";
import Card from "../ui/Card";
<<<<<<< HEAD
import { ALERT_LEVELS, assessEmotionalRisk, getRiskLevelConfig } from "../../utils/riskAssessment";
import { readCheckIns } from "../../utils/checkin";
import { txt } from "../../utils/txt";

export default function RiskAssessment({
  lang,
  style,
  checkIns = [],
  cbtAssessment = null,
  riskAssessment: riskAssessmentProp = null,
  onNavigateToSupport,
}) {
=======
import { assessEmotionalRisk, shouldTriggerEmergencyAlert, getRiskLevelConfig } from "../../utils/riskAssessment";
import { readCheckIns } from "../../utils/checkin";
import { txt } from "../../utils/txt";

export default function RiskAssessment({ lang, style }) {
>>>>>>> 356bd4d38d8b7f31d8a35a177e59ac40d7d6cf8a
  const [riskAssessment, setRiskAssessment] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
<<<<<<< HEAD
    if (riskAssessmentProp) {
      setRiskAssessment(riskAssessmentProp);
      return;
    }
    const source = Array.isArray(checkIns) && checkIns.length > 0 ? checkIns : readCheckIns();
    const assessment = assessEmotionalRisk({ checkIns: source, cbtAssessment, lang });
    setRiskAssessment(assessment);
  }, [cbtAssessment, checkIns, lang, riskAssessmentProp]);
=======
    const checkIns = readCheckIns();
    const assessment = assessEmotionalRisk({ checkIns, lang });
    setRiskAssessment(assessment);
  }, [lang]);
>>>>>>> 356bd4d38d8b7f31d8a35a177e59ac40d7d6cf8a

  if (!riskAssessment) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Activity className="mx-auto h-8 w-8 animate-pulse text-sage-400" />
          <p className="mt-2 text-sm text-clay/60">
            {txt(lang, "Loading assessment...", "加载评估中...")}
          </p>
        </div>
      </div>
    );
  }

  const riskConfig = getRiskLevelConfig(riskAssessment.level, lang);
<<<<<<< HEAD
  const shouldAlert = riskAssessment?.alert?.triggered === true;
  const helpTarget =
    cbtAssessment?.selfHarmRisk || riskAssessment?.alert?.level === ALERT_LEVELS.URGENT ? "cbt" : "experts";
=======
  const shouldAlert = shouldTriggerEmergencyAlert({ checkIns: readCheckIns() });
>>>>>>> 356bd4d38d8b7f31d8a35a177e59ac40d7d6cf8a

  return (
    <div className="space-y-4">
      {/* Emergency Alert */}
      {shouldAlert && (
        <Card style={style} className="border-l-4 border-l-red-500 bg-red-50/30">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
            <div className="flex-1">
              <h4 className="font-heading text-lg font-bold text-red-600">
                {txt(lang, "Attention Needed", "需要关注")}
              </h4>
              <p className="mt-1 text-sm text-red-700/80">
                {txt(
                  lang,
                  "Your recent data suggests you may need additional support. Please consider connecting with a professional.",
                  "您的近期数据表明您可能需要额外支持。请考虑咨询专业人士。"
                )}
              </p>
              <button
                type="button"
<<<<<<< HEAD
                onClick={() => onNavigateToSupport?.(helpTarget)}
=======
>>>>>>> 356bd4d38d8b7f31d8a35a177e59ac40d7d6cf8a
                className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 transition-colors"
              >
                {txt(lang, "Get Help Now", "立即寻求帮助")}
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Risk Level Card */}
      <Card style={style}>
        <div className="flex items-start gap-4">
          <div
            className={`grid h-16 w-16 shrink-0 place-items-center rounded-2xl ${riskConfig.color}`}
          >
            <Shield className="h-8 w-8 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-clay/60">
              {txt(lang, "Current Risk Level", "当前风险等级")}
            </p>
            <h3 className={`mt-1 font-heading text-3xl font-bold ${riskConfig.textColor}`}>
              {riskConfig.label}
            </h3>
            <p className="mt-1 text-sm text-clay/75">
              {riskAssessment.recommendation}
            </p>
<<<<<<< HEAD
            {riskAssessment.provisional && (
              <p className="mt-2 text-xs font-semibold text-clay/62">
                {txt(
                  lang,
                  "This is a provisional trend signal. Keep recording at least 3 recent check-ins for a stable result.",
                  "当前结果仍是趋势提示。请继续完成至少 3 次近期打卡，以获得更稳定的判断。"
                )}
              </p>
            )}
=======
>>>>>>> 356bd4d38d8b7f31d8a35a177e59ac40d7d6cf8a
          </div>
        </div>

        {/* Score Visualization */}
        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="font-semibold text-clay/60">
              {txt(lang, "Risk Score", "风险分数")}
            </span>
            <span className={`font-bold ${riskConfig.textColor}`}>
              {riskAssessment.score}/100
            </span>
          </div>
          <div className="h-3 rounded-full bg-cream/60">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${riskAssessment.score}%`,
<<<<<<< HEAD
                backgroundColor: riskConfig.accent,
=======
                backgroundColor: riskConfig.color.replace("bg-", ""),
>>>>>>> 356bd4d38d8b7f31d8a35a177e59ac40d7d6cf8a
              }}
            />
          </div>
          <div className="mt-2 flex justify-between text-[10px] font-semibold text-clay/50">
            <span>{txt(lang, "Low", "低")}</span>
            <span>{txt(lang, "Medium", "中")}</span>
            <span>{txt(lang, "High", "高")}</span>
          </div>
        </div>
      </Card>

      {/* Data Status */}
      {!riskAssessment.hasData && (
        <Card style={style} className="bg-cream/40">
          <div className="flex items-start gap-3">
            <Activity className="mt-0.5 h-5 w-5 shrink-0 text-sage-500" />
            <div>
              <h4 className="font-heading text-base font-bold text-clay">
                {txt(lang, "Not Enough Data", "数据不足")}
              </h4>
              <p className="mt-1 text-sm text-clay/75">
                {txt(
                  lang,
                  "Complete daily check-ins for at least 3 days to get an accurate risk assessment.",
                  "请至少完成3天的每日打卡，以获得准确的风险评估。"
                )}
              </p>
            </div>
          </div>
        </Card>
      )}

<<<<<<< HEAD
      {riskAssessment.hasData && riskAssessment.provisional && (
        <Card style={style} className="bg-cream/40">
          <div className="flex items-start gap-3">
            <Activity className="mt-0.5 h-5 w-5 shrink-0 text-sage-500" />
            <div>
              <h4 className="font-heading text-base font-bold text-clay">
                {txt(lang, "Trend Only for Now", "当前仅显示趋势") }
              </h4>
              <p className="mt-1 text-sm text-clay/75">
                {txt(
                  lang,
                  "Recent entries are not yet stable enough for a strong conclusion. Treat this as an early signal and keep recording.",
                  "近期样本还不够稳定，请先把它当作早期信号，继续记录打卡与睡眠。"
                )}
              </p>
            </div>
          </div>
        </Card>
      )}

=======
>>>>>>> 356bd4d38d8b7f31d8a35a177e59ac40d7d6cf8a
      {/* Risk Factors Details */}
      {riskAssessment.hasData && (
        <Card style={style}>
          <div className="flex items-center justify-between">
            <h4 className="font-heading text-xl font-bold text-clay">
              {txt(lang, "Risk Factors", "风险因素")}
            </h4>
            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className="text-xs font-semibold text-sage-600 hover:text-sage-700 transition-colors"
            >
              {showDetails
                ? txt(lang, "Hide Details", "隐藏详情")
                : txt(lang, "Show Details", "显示详情")}
            </button>
          </div>

          {showDetails && (
            <div className="mt-4 space-y-3">
              {riskAssessment.factors.length === 0 ? (
                <div className="py-4 text-center text-sm text-clay/60">
                  {txt(lang, "No significant risk factors detected", "未检测到显著风险因素")}
                </div>
              ) : (
                riskAssessment.factors.map((factor, index) => (
                  <div
                    key={factor.type}
                    className="rounded-xl border p-3 transition-colors hover:bg-cream/30"
                    style={{ borderColor: `${style.line}60` }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 items-start gap-2">
                        {factor.type === "consecutive_low_mood" && (
                          <TrendingDown className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
                        )}
                        {factor.type === "low_average_mood" && (
                          <Activity className="mt-0.5 h-4 w-4 shrink-0 text-yellow-500" />
                        )}
                        {factor.type === "poor_sleep" && (
                          <Moon className="mt-0.5 h-4 w-4 shrink-0 text-purple-500" />
                        )}
<<<<<<< HEAD
                        {factor.type === "sleep_duration_out_of_range" && (
                          <Moon className="mt-0.5 h-4 w-4 shrink-0 text-purple-500" />
                        )}
                        {factor.type === "sleep_variability" && (
                          <Moon className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
                        )}
=======
>>>>>>> 356bd4d38d8b7f31d8a35a177e59ac40d7d6cf8a
                        {factor.type === "mood_extremes" && (
                          <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-clay">
                            {factor.description[lang]}
                          </p>
                          <p className="mt-0.5 text-xs text-clay/60">
                            {txt(lang, "Impact: +", "影响：+")}
                            {factor.weight}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold ${
                          factor.weight >= 30
                            ? "bg-red-100 text-red-600"
                            : factor.weight >= 20
                              ? "bg-yellow-100 text-yellow-600"
                              : "bg-green-100 text-green-600"
                        }`}
                      >
                        {factor.weight}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </Card>
      )}

      {/* Recommended Actions */}
      {riskAssessment.hasData && (
        <Card style={style}>
          <h4 className="font-heading text-xl font-bold text-clay">
            {txt(lang, "Recommended Actions", "建议行动")}
          </h4>

          <div className="mt-3 space-y-2">
            {riskAssessment.level === "low" && (
              <>
                <div className="flex items-start gap-3 rounded-xl bg-green-50/50 p-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600 text-xs font-bold">
                    1
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-clay">
                      {txt(lang, "Continue daily check-ins", "继续每日打卡")}
                    </p>
                    <p className="mt-0.5 text-xs text-clay/70">
                      {txt(lang, "Track your mood and sleep to monitor trends.", "记录您的情绪和睡眠以监测趋势。")}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-xl bg-green-50/50 p-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600 text-xs font-bold">
                    2
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-clay">
                      {txt(lang, "Practice self-care", "练习自我关怀")}
                    </p>
                    <p className="mt-0.5 text-xs text-clay/70">
                      {txt(lang, "Keep up with healthy sleep, nutrition, and moderate exercise.", "保持健康的睡眠、营养和适度运动。")}
                    </p>
                  </div>
                </div>
              </>
            )}

            {riskAssessment.level === "medium" && (
              <>
                <div className="flex items-start gap-3 rounded-xl bg-yellow-50/50 p-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-yellow-100 text-yellow-600 text-xs font-bold">
                    1
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-clay">
                      {txt(lang, "Increase check-in frequency", "增加打卡频率")}
                    </p>
                    <p className="mt-0.5 text-xs text-clay/70">
<<<<<<< HEAD
                      {txt(lang, "Track mood, triggers, and sleep more consistently.", "更持续地记录情绪、触发因素和睡眠。")}
=======
                      {txt(lang, "Track mood and triggers more consistently.", "更持续地记录情绪和触发因素。")}
>>>>>>> 356bd4d38d8b7f31d8a35a177e59ac40d7d6cf8a
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-xl bg-yellow-50/50 p-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-yellow-100 text-yellow-600 text-xs font-bold">
                    2
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-clay">
                      {txt(lang, "Try relaxation techniques", "尝试放松技巧")}
                    </p>
                    <p className="mt-0.5 text-xs text-clay/70">
                      {txt(lang, "Breathing exercises, meditation, or gentle movement.", "呼吸练习、冥想或轻柔运动。")}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-xl bg-yellow-50/50 p-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-yellow-100 text-yellow-600 text-xs font-bold">
                    3
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-clay">
                      {txt(lang, "Consider professional consultation", "考虑咨询专业人士")}
                    </p>
                    <p className="mt-0.5 text-xs text-clay/70">
<<<<<<< HEAD
                      {txt(lang, "Connect with a counselor, midwife, or CBT plan for guidance.", "联系咨询师、助产士或 CBT 计划获取指导。")}
=======
                      {txt(lang, "Connect with a counselor or midwife for guidance.", "联系咨询师或助产士获取指导。")}
>>>>>>> 356bd4d38d8b7f31d8a35a177e59ac40d7d6cf8a
                    </p>
                  </div>
                </div>
              </>
            )}

            {riskAssessment.level === "high" && (
              <>
                <div className="flex items-start gap-3 rounded-xl bg-red-50/50 p-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600 text-xs font-bold">
                    1
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-clay">
                      {txt(lang, "Seek professional help", "寻求专业帮助")}
                    </p>
                    <p className="mt-0.5 text-xs text-clay/70">
<<<<<<< HEAD
                      {txt(lang, "Contact a psychologist, obstetrician, or your CBT referral path now.", "立即联系心理医生、产科医生，或立刻进入 CBT 转介流程。")}
=======
                      {txt(lang, "Contact a psychologist or obstetrician immediately.", "立即联系心理医生或产科医生。")}
>>>>>>> 356bd4d38d8b7f31d8a35a177e59ac40d7d6cf8a
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-xl bg-red-50/50 p-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600 text-xs font-bold">
                    2
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-clay">
                      {txt(lang, "Share with support network", "与支持网络分享")}
                    </p>
                    <p className="mt-0.5 text-xs text-clay/70">
                      {txt(lang, "Let your partner, family, or close friends know how you feel.", "让伴侣、家人或密友知道您的感受。")}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-xl bg-red-50/50 p-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600 text-xs font-bold">
                    3
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-clay">
                      {txt(lang, "Use crisis resources", "使用危机资源")}
                    </p>
                    <p className="mt-0.5 text-xs text-clay/70">
                      {txt(lang, "24-hour mental health hotlines are available.", "24小时心理热线随时提供帮助。")}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </Card>
      )}

      {/* Disclaimer */}
      <div className="rounded-xl bg-cream/40 px-4 py-3 text-center">
        <p className="text-[11px] text-clay/60">
          {txt(
            lang,
            "This risk assessment is a screening tool and does not replace professional medical diagnosis. Always consult with healthcare providers for health concerns.",
            "此风险评估仅作为筛查工具，不能替代专业医疗诊断。如有健康问题，请咨询医疗专业人员。"
          )}
        </p>
      </div>
    </div>
  );
}
