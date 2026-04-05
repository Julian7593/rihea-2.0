import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Bell,
  BookOpen,
  CalendarDays,
  ChevronRight,
  CircleHelp,
  Clock3,
  Download,
  FileHeart,
  HeartHandshake,
  LogIn,
  LogOut,
  Phone,
  ShieldCheck,
  Siren,
  Sparkles,
  Stethoscope,
  UserRound,
  Volume2,
} from "lucide-react";
import Card from "../ui/Card";
import ToggleRow from "../ui/ToggleRow";
import PartnerCbtSummaryCard from "../cbt/PartnerCbtSummaryCard";
import PartnerSyncCenter from "../partner/PartnerSyncCenter";
import { appReleaseNotes, appVersionInfo } from "../../data/appMeta";
import { appGuideContent } from "../../data/appGuideContent";
import { txt } from "../../utils/txt";
import { calcCheckInStreak } from "../../utils/checkin";
import { useToast } from "../../contexts/ToastContext";
import { fetchCbtPartnerTasks } from "../../api/cbt";
import {
  confirmPartnerBinding,
  createPartnerInvite,
  fetchCounselingSlots,
  fetchEmergencyContacts,
  fetchHelpCenter,
  fetchPartnerSyncOverview,
  fetchPrivacySettings,
  fetchProfileOverview,
  fetchRecordSummary,
  patchPartnerSyncSettings,
  patchPartnerTaskState,
  patchPrivacySettings,
  unbindPartnerSync,
} from "../../api/profile";
import { PARTNER_SHARING_LEVEL, PARTNER_SYNC_STATUS, getPartnerSharingOptions } from "../../utils/partnerSync";

const moodEmoji = ["🌧️", "☁️", "🌤️", "🌸", "☀️"];

const formatDateShort = (dateText, lang) => {
  if (!dateText) return "-";
  const date = new Date(dateText);
  if (Number.isNaN(date.getTime())) return dateText;
  if (lang === "zh") {
    return `${date.getMonth() + 1}/${date.getDate()}`;
  }
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const COUNSELING_SLOT_DAY_ZH = {
  Today: "今天",
  Tomorrow: "明天",
  Monday: "周一",
  Tuesday: "周二",
  Wednesday: "周三",
  Thursday: "周四",
  Friday: "周五",
  Saturday: "周六",
  Sunday: "周日",
};

const COUNSELING_SLOT_SERVICE_ZH = {
  "Online counseling": "在线咨询",
  "Breathing coach": "呼吸指导",
  "Clinical follow-up": "临床随访",
};

const HELP_TITLE_ZH = {
  "How to check in daily": "如何进行每日打卡",
  "How partner sync works": "伴侣同步如何运作",
  "How to export report": "如何导出报告",
};

const HELP_DESC_ZH = {
  "Complete mood + sleep hours + trigger + one-line note.": "完成情绪 + 睡眠时长 + 触发因素 + 一句备注。",
  "Enable partner sync in quick settings.": "在快捷设置中开启伴侣同步。",
  "Use export button in health records page.": "在健康档案页面使用导出按钮。",
};

const EMERGENCY_TITLE_ZH = {
  "Primary emergency contact": "首要紧急联系人",
  "Hospital hotline": "医院热线",
};

const RELEASE_SECTION_META = {
  added: {
    label: { zh: "新增", en: "Added" },
    tone: "bg-[#edf5ef] text-[#4f6158]",
    border: "border-[#d9e6dc]",
    dot: "bg-[#7f9a89]",
  },
  improved: {
    label: { zh: "优化", en: "Improved" },
    tone: "bg-[#f6efe6] text-[#8c684b]",
    border: "border-[#eadcc8]",
    dot: "bg-[#c89a6b]",
  },
  fixed: {
    label: { zh: "修复", en: "Fixed" },
    tone: "bg-[#f8ebeb] text-[#9a5a5a]",
    border: "border-[#efd7d7]",
    dot: "bg-[#d28c8c]",
  },
};

const escapeRegExp = (value = "") => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const localizeCounselingSlotLabel = (label, lang) => {
  if (typeof label !== "string") return "";
  if (lang !== "zh") return label;

  let text = label.trim();
  text = text.replace(
    /\b(Today|Tomorrow|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b/g,
    (token) => COUNSELING_SLOT_DAY_ZH[token] || token
  );
  Object.entries(COUNSELING_SLOT_SERVICE_ZH).forEach(([en, zh]) => {
    text = text.replace(new RegExp(escapeRegExp(en), "gi"), zh);
  });
  return text;
};

const localizeHelpText = (text, lang, map) => {
  if (typeof text !== "string") return "";
  if (lang !== "zh") return text;
  return map[text] || text;
};

const localizeEmergencyTitle = (title, lang) => {
  if (typeof title !== "string") return "";
  if (lang !== "zh") return title;
  return EMERGENCY_TITLE_ZH[title] || title;
};

function SettingRow({ label, desc, Icon, onClick, style, danger = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-start justify-between gap-3 rounded-2xl border px-3 py-3 text-left transition ${
        danger ? "border-[#e8c5b4] bg-[#fff5ef] hover:bg-[#ffece2]" : "border-sage/20 bg-[#fffaf2] hover:bg-sage/10"
      }`}
    >
      <span className="flex min-w-0 items-start gap-3">
        <span
          className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full"
          style={{
            backgroundColor: danger ? "rgba(216,155,107,.2)" : style.pillBg,
            color: danger ? "#B36E46" : style.pillText,
          }}
        >
          <Icon className="h-4 w-4" />
        </span>
        <span className="min-w-0">
          <span className={`block text-sm font-semibold ${danger ? "text-[#A35E38]" : "text-clay"}`}>{label}</span>
          {desc && <span className="mt-1 block text-xs text-clay/72">{desc}</span>}
        </span>
      </span>
      <ChevronRight className={`mt-1 h-4 w-4 shrink-0 ${danger ? "text-[#BC7A53]" : "text-clay/55"}`} />
    </button>
  );
}

function SectionTitle({ title, subtitle }) {
  return (
    <div>
      <h3 className="font-heading text-2xl font-bold text-clay">{title}</h3>
      {subtitle && <p className="mt-1 text-sm text-clay/78">{subtitle}</p>}
    </div>
  );
}

export default function ProfileTab({
  lang,
  style,
  openSettings,
  reminder,
  setReminder,
  sounds,
  setSounds,
  profileName,
  profile,
  onEditProfile,
  isLoggedIn = false,
  loginAccount = "",
  onLogin,
  onRelogin = onLogin,
  onLogout,
  checkIns = [],
  pageRequest,
  onPageRequestConsumed,
  cbtRefreshToken = 0,
}) {
  const toast = useToast();
  const [partnerSync, setPartnerSync] = useState(true);
  const [privateMode, setPrivateMode] = useState(false);
  const [shareForResearch, setShareForResearch] = useState(false);
  const [activePage, setActivePage] = useState(null);

  const [profileOverview, setProfileOverview] = useState(null);
  const [partnerOverview, setPartnerOverview] = useState(null);
  const [recordSummary, setRecordSummary] = useState(null);
  const [counselingSlots, setCounselingSlots] = useState([]);
  const [helpCenter, setHelpCenter] = useState({ version: "v1.0.0", faqs: [] });
  const [emergencyContacts, setEmergencyContacts] = useState([]);
  const [pageLoading, setPageLoading] = useState(false);
  const [pageError, setPageError] = useState("");
  const [cbtPartnerSummary, setCbtPartnerSummary] = useState(null);
  const [cbtPartnerLoading, setCbtPartnerLoading] = useState(false);

  const normalizedCheckIns = Array.isArray(checkIns) ? checkIns : [];
  const checkInStreak = useMemo(() => calcCheckInStreak(normalizedCheckIns), [normalizedCheckIns]);
  const latestCheckIn = normalizedCheckIns[0];

  const monthCompletionsFallback = useMemo(() => {
    const monthKey = new Date().toISOString().slice(0, 7);
    return normalizedCheckIns.filter((item) => item.date?.slice(0, 7) === monthKey).length;
  }, [normalizedCheckIns]);

  const partnerProfileContext = useMemo(
    () => ({
      name: profile?.name || profileOverview?.name || profileName,
      pregnancyWeek: profile?.pregnancyWeek || profileOverview?.pregnancyWeek || "24+3",
      dueDate: profile?.dueDate || profileOverview?.dueDate || "2026-06-08",
      city: profile?.city || profileOverview?.city || "",
      phone: profile?.phone || profileOverview?.phone || "",
    }),
    [
      profile?.city,
      profile?.dueDate,
      profile?.name,
      profile?.phone,
      profile?.pregnancyWeek,
      profileName,
      profileOverview?.city,
      profileOverview?.dueDate,
      profileOverview?.name,
      profileOverview?.phone,
      profileOverview?.pregnancyWeek,
    ]
  );

  const overview = useMemo(() => {
    const progress = Number.isFinite(profileOverview?.progress) ? profileOverview.progress : 61;
    return {
      name: partnerProfileContext.name,
      pregnancyWeek: partnerProfileContext.pregnancyWeek,
      progress,
      dueDate: partnerProfileContext.dueDate,
      city: partnerProfileContext.city,
      phone: partnerProfileContext.phone,
      riskLevel: profileOverview?.riskLevel || "low",
    };
  }, [partnerProfileContext, profileOverview?.progress, profileOverview?.riskLevel]);

  const dueInDays = useMemo(() => {
    const dueDate = new Date(overview.dueDate);
    if (Number.isNaN(dueDate.getTime())) return 111;
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const due = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate()).getTime();
    return Math.max(0, Math.ceil((due - start) / 86400000));
  }, [overview.dueDate]);

  const refreshPartnerOverview = useCallback(async () => {
    const data = await fetchPartnerSyncOverview({
      lang,
      profile: partnerProfileContext,
      checkIns: normalizedCheckIns,
    });
    setPartnerOverview(data);
    setPartnerSync(
      data?.status !== PARTNER_SYNC_STATUS.DISABLED && data?.sharingLevel !== PARTNER_SHARING_LEVEL.OFF
    );
    return data;
  }, [lang, normalizedCheckIns, partnerProfileContext]);

  useEffect(() => {
    let canceled = false;

    const bootstrap = async () => {
      try {
        const [overviewData, privacyData, partnerData] = await Promise.all([
          fetchProfileOverview(),
          fetchPrivacySettings(),
          fetchPartnerSyncOverview({
            lang,
            profile: partnerProfileContext,
            checkIns: normalizedCheckIns,
          }),
        ]);
        if (canceled) return;
        setProfileOverview(overviewData);
        setPartnerOverview(partnerData);
        setPartnerSync(
          partnerData?.status !== PARTNER_SYNC_STATUS.DISABLED &&
            partnerData?.sharingLevel !== PARTNER_SHARING_LEVEL.OFF
        );
        setPrivateMode(Boolean(privacyData?.privateMode));
        setShareForResearch(Boolean(privacyData?.shareForResearch));
      } catch {
        // keep local fallback values
      }
    };

    bootstrap();
    return () => {
      canceled = true;
    };
  }, [lang, normalizedCheckIns, partnerProfileContext]);

  useEffect(() => {
    let canceled = false;

    const syncPartnerView = async () => {
      try {
        const data = await fetchPartnerSyncOverview({
          lang,
          profile: partnerProfileContext,
          checkIns: normalizedCheckIns,
        });
        if (canceled) return;
        setPartnerOverview(data);
        setPartnerSync(
          data?.status !== PARTNER_SYNC_STATUS.DISABLED &&
            data?.sharingLevel !== PARTNER_SHARING_LEVEL.OFF
        );
      } catch {
        // keep the previous preview when refresh fails
      }
    };

    syncPartnerView();
    return () => {
      canceled = true;
    };
  }, [lang, normalizedCheckIns, partnerProfileContext]);

  useEffect(() => {
    if (!profile?.name?.trim()) return;
    setProfileOverview((prev) =>
      prev
        ? {
            ...prev,
            name: profile.name.trim(),
            dueDate: profile.dueDate || prev.dueDate,
            pregnancyWeek: profile.pregnancyWeek || prev.pregnancyWeek,
            city: profile.city || prev.city || "",
            phone: profile.phone || prev.phone || "",
          }
        : prev
    );
  }, [profile]);

  useEffect(() => {
    if (!activePage) return;
    let canceled = false;

    const loadPageData = async () => {
      setPageLoading(true);
      setPageError("");
      try {
        if (activePage === "profile") {
          const data = await fetchProfileOverview();
          if (canceled) return;
          setProfileOverview(data);
          setPartnerSync(Boolean(data?.partnerSync));
        }

        if (activePage === "record") {
          const data = await fetchRecordSummary(normalizedCheckIns);
          if (canceled) return;
          setRecordSummary(data);
        }

        if (activePage === "privacy") {
          const data = await fetchPrivacySettings();
          if (canceled) return;
          setPrivateMode(Boolean(data?.privateMode));
          setShareForResearch(Boolean(data?.shareForResearch));
        }

        if (activePage === "partner") {
          const [data, cbtPartnerData] = await Promise.all([
            fetchPartnerSyncOverview({
              lang,
              profile: partnerProfileContext,
              checkIns: normalizedCheckIns,
            }),
            fetchCbtPartnerTasks({
              lang,
              profile: partnerProfileContext,
              checkIns: normalizedCheckIns,
            }),
          ]);
          if (canceled) return;
          setPartnerOverview(data);
          setCbtPartnerSummary(cbtPartnerData);
          setPartnerSync(
            data?.status !== PARTNER_SYNC_STATUS.DISABLED &&
              data?.sharingLevel !== PARTNER_SHARING_LEVEL.OFF
          );
        }

        if (activePage === "counsel") {
          const data = await fetchCounselingSlots();
          if (canceled) return;
          setCounselingSlots(Array.isArray(data?.slots) ? data.slots : []);
        }

        if (activePage === "help") {
          const data = await fetchHelpCenter();
          if (canceled) return;
          setHelpCenter({
            version: data?.version || "v1.0.0",
            faqs: Array.isArray(data?.faqs) ? data.faqs : [],
          });
        }

        if (activePage === "urgent") {
          const data = await fetchEmergencyContacts();
          if (canceled) return;
          setEmergencyContacts(Array.isArray(data?.contacts) ? data.contacts : []);
        }
      } catch (error) {
        if (canceled) return;
        setPageError(error?.message || txt(lang, "Failed to load page data.", "页面数据加载失败。"));
      } finally {
        if (!canceled) {
          setPageLoading(false);
        }
      }
    };

    loadPageData();

    return () => {
      canceled = true;
    };
  }, [activePage, lang, normalizedCheckIns, partnerProfileContext]);

  useEffect(() => {
    if (activePage !== "partner") return;
    let canceled = false;

    const refreshPartnerSummary = async () => {
      setCbtPartnerLoading(true);
      try {
        const data = await fetchCbtPartnerTasks({
          lang,
          profile: partnerProfileContext,
          checkIns: normalizedCheckIns,
        });
        if (!canceled) {
          setCbtPartnerSummary(data);
        }
      } catch {
        if (!canceled) {
          setCbtPartnerSummary(null);
        }
      } finally {
        if (!canceled) {
          setCbtPartnerLoading(false);
        }
      }
    };

    refreshPartnerSummary();
    return () => {
      canceled = true;
    };
  }, [activePage, cbtRefreshToken, lang, normalizedCheckIns, partnerProfileContext]);

  const updatePrivacyValue = async (field, nextValue) => {
    const prevPrivateMode = privateMode;
    const prevShareForResearch = shareForResearch;

    if (field === "privateMode") setPrivateMode(nextValue);
    if (field === "shareForResearch") setShareForResearch(nextValue);

    setPageError("");

    try {
      await patchPrivacySettings({ [field]: nextValue });
    } catch (error) {
      setPrivateMode(prevPrivateMode);
      setShareForResearch(prevShareForResearch);
      setPageError(error?.message || txt(lang, "Failed to save privacy settings.", "保存隐私设置失败。"));
    }
  };

  const runPartnerMutation = useCallback(
    async (runner, successMessage) => {
      setPageError("");
      try {
        await runner();
        await refreshPartnerOverview();
        if (successMessage) {
          toast.success(successMessage);
        }
      } catch (error) {
        const message = error?.message || txt(lang, "Failed to update partner sync.", "伴侣同步更新失败。");
        setPageError(message);
        toast.error(message);
      }
    },
    [lang, refreshPartnerOverview, toast]
  );

  const handleCreatePartnerInvite = useCallback(() => {
    runPartnerMutation(
      () => createPartnerInvite(),
      txt(lang, "Invite code refreshed", "邀请码已生成")
    );
  }, [lang, runPartnerMutation]);

  const handleCopyInviteCode = useCallback(async () => {
    const code = partnerOverview?.inviteCode;
    if (!code) {
      toast.info(txt(lang, "Create an invite code first", "请先生成邀请码"));
      return;
    }

    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(code);
        toast.success(txt(lang, "Invite code copied", "邀请码已复制"));
        return;
      }
      toast.info(`${txt(lang, "Invite code", "邀请码")}: ${code}`);
    } catch {
      toast.info(`${txt(lang, "Invite code", "邀请码")}: ${code}`);
    }
  }, [lang, partnerOverview?.inviteCode, toast]);

  const handleConfirmPartnerJoin = useCallback(() => {
    runPartnerMutation(
      () =>
        confirmPartnerBinding({
          partnerName: lang === "zh" ? "陈先生" : "Alex",
          partnerRelation: txt(lang, "Partner", "伴侣"),
          sharingLevel:
            partnerOverview?.sharingLevel === PARTNER_SHARING_LEVEL.SUMMARY_PLUS
              ? PARTNER_SHARING_LEVEL.SUMMARY_PLUS
              : PARTNER_SHARING_LEVEL.SUMMARY,
        }),
      txt(lang, "Partner connected", "伴侣已连接")
    );
  }, [lang, partnerOverview?.sharingLevel, runPartnerMutation]);

  const handleChangePartnerSharingLevel = useCallback(
    (nextLevel) => {
      runPartnerMutation(
        () => patchPartnerSyncSettings({ sharingLevel: nextLevel }),
        txt(lang, "Sharing settings updated", "共享设置已更新")
      );
    },
    [lang, runPartnerMutation]
  );

  const handleTogglePartnerRiskAlerts = useCallback(() => {
    runPartnerMutation(
      () => patchPartnerSyncSettings({ riskAlerts: !(partnerOverview?.riskAlerts !== false) }),
      txt(lang, "Risk alert setting updated", "风险提醒设置已更新")
    );
  }, [lang, partnerOverview?.riskAlerts, runPartnerMutation]);

  const handleTogglePartnerTask = useCallback(
    (taskId, done) => {
      runPartnerMutation(
        () => patchPartnerTaskState(taskId, done),
        done ? txt(lang, "Task marked done", "任务已标记完成") : txt(lang, "Task reset", "任务已重置")
      );
    },
    [lang, runPartnerMutation]
  );

  const handleUnbindPartner = useCallback(() => {
    runPartnerMutation(
      () => unbindPartnerSync(),
      txt(lang, "Partner disconnected", "伴侣已解除绑定")
    );
  }, [lang, runPartnerMutation]);

  const handlePartnerQuickToggle = useCallback(() => {
    if (!partnerOverview || partnerOverview.status === PARTNER_SYNC_STATUS.DISABLED) {
      handleCreatePartnerInvite();
      return;
    }

    if (partnerOverview.sharingLevel === PARTNER_SHARING_LEVEL.OFF) {
      runPartnerMutation(
        () => patchPartnerSyncSettings({ sharingLevel: PARTNER_SHARING_LEVEL.SUMMARY }),
        txt(lang, "Partner sync resumed", "伴侣同步已恢复")
      );
      return;
    }

    runPartnerMutation(
      () => patchPartnerSyncSettings({ sharingLevel: PARTNER_SHARING_LEVEL.OFF }),
      txt(lang, "Partner sync paused", "伴侣同步已暂停")
    );
  }, [handleCreatePartnerInvite, lang, partnerOverview, runPartnerMutation]);

  const openStandaloneGuide = useCallback(() => {
    if (typeof window === "undefined") return;
    window.location.href = "/docs";
  }, []);

  const profileRows = useMemo(
    () => [
      {
        key: "partner",
        label: txt(lang, "Partner sync center", "伴侣同步中心"),
        desc: txt(lang, "Invite partner, control sharing and preview tasks", "邀请伴侣、管理共享并预览陪伴任务"),
        Icon: HeartHandshake,
      },
      {
        key: "profile",
        label: txt(lang, "Personal information", "个人资料"),
        desc: txt(lang, "Name, due date and basic profile", "姓名、预产期和基础资料"),
        Icon: UserRound,
      },
      {
        key: "record",
        label: txt(lang, "Health records", "健康档案"),
        desc: txt(lang, "Pregnancy checks and mood history", "产检记录与情绪历史"),
        Icon: FileHeart,
      },
      {
        key: "privacy",
        label: txt(lang, "Security and privacy", "安全与隐私"),
        desc: txt(lang, "Password, permissions and data policy", "密码、权限与数据策略"),
        Icon: ShieldCheck,
      },
    ],
    [lang]
  );

  const supportRows = useMemo(
    () => [
      {
        key: "counsel",
        label: txt(lang, "Book professional support", "预约专业支持"),
        desc: txt(lang, "Clinical psychologist and counselor slots", "心理咨询师与临床支持时段"),
        Icon: Stethoscope,
      },
      {
        key: "docs",
        label: txt(lang, "App guide", "使用文档"),
        desc: txt(lang, "See how each area of the app is designed to be used", "查看应用结构、使用路径与功能说明"),
        Icon: BookOpen,
      },
      {
        key: "version",
        label: txt(lang, "Version notes", "版本说明"),
        desc: txt(lang, "Current version, update summary and recent release notes", "当前版本、更新摘要与最近版本记录"),
        Icon: Sparkles,
      },
      {
        key: "help",
        label: txt(lang, "Help center and feedback", "帮助中心与反馈"),
        desc: txt(lang, "FAQ, report issue and feature request", "常见问题、问题反馈与功能建议"),
        Icon: CircleHelp,
      },
      {
        key: "urgent",
        label: txt(lang, "Urgent support contacts", "紧急支持联系人"),
        desc: txt(lang, "Immediate support when emotional risk rises", "情绪风险升高时快速联系支持"),
        Icon: Siren,
        danger: true,
      },
    ],
    [lang]
  );

  const pageMeta = useMemo(() => {
    const combined = [...profileRows, ...supportRows];
    return Object.fromEntries(combined.map((item) => [item.key, item]));
  }, [profileRows, supportRows]);

  const recordMonthCompletions = recordSummary?.monthCompletions ?? monthCompletionsFallback;
  const recordComfortRate = recordSummary?.comfortDoneRate ?? Math.min(95, 58 + recordMonthCompletions * 2);
  const recordLatestMood = recordSummary?.latestMoodIndex;
  const latestMoodIcon =
    Number.isInteger(recordLatestMood) && recordLatestMood >= 0 && recordLatestMood <= 4
      ? moodEmoji[recordLatestMood]
      : latestCheckIn
        ? moodEmoji[latestCheckIn.mood]
        : "-";
  const partnerSharingLabel =
    getPartnerSharingOptions(lang).find((item) => item.value === partnerOverview?.sharingLevel)?.label ||
    txt(lang, "Off", "不共享");
  const partnerMainTask = partnerOverview?.preview?.mainTask || null;
  const releaseSectionOrder = useMemo(() => ["added", "improved", "fixed"], []);

  useEffect(() => {
    if (!pageRequest?.pageId) return;
    setActivePage(pageRequest.pageId);
    if (onPageRequestConsumed) {
      onPageRequestConsumed();
    }
  }, [onPageRequestConsumed, pageRequest]);

  if (activePage) {
    const page = pageMeta[activePage];

    return (
      <div className="space-y-4">
        <Card style={style}>
          <button
            type="button"
            onClick={() => setActivePage(null)}
            className="mb-3 inline-flex items-center gap-2 rounded-full border border-sage/20 bg-[#fffaf2] px-3 py-1.5 text-sm font-semibold text-clay transition hover:bg-sage/10"
          >
            <ArrowLeft className="h-4 w-4" />
            {txt(lang, "Back", "返回")}
          </button>
          <SectionTitle title={page?.label || ""} subtitle={page?.desc || ""} />
          {pageLoading && (
            <p className="mt-3 rounded-xl bg-[#fffaf2] px-3 py-2 text-sm text-clay/75">
              {txt(lang, "Loading latest data...", "正在加载最新数据...")}
            </p>
          )}
          {pageError && (
            <p className="mt-3 rounded-xl border border-[#e8c5b4] bg-[#fff5ef] px-3 py-2 text-sm text-[#A35E38]">{pageError}</p>
          )}
        </Card>

        {activePage === "partner" && (
          <div className="space-y-4">
            <PartnerSyncCenter
              lang={lang}
              style={style}
              overview={partnerOverview}
              onCreateInvite={handleCreatePartnerInvite}
              onCopyInvite={handleCopyInviteCode}
              onConfirmJoin={handleConfirmPartnerJoin}
              onChangeSharingLevel={handleChangePartnerSharingLevel}
              onToggleRiskAlerts={handleTogglePartnerRiskAlerts}
              onToggleTask={handleTogglePartnerTask}
              onUnbind={handleUnbindPartner}
            />
            <PartnerCbtSummaryCard
              lang={lang}
              style={style}
              summary={cbtPartnerSummary}
              loading={cbtPartnerLoading}
            />
          </div>
        )}

        {activePage === "profile" && (
          <Card style={style}>
            <SectionTitle
              title={txt(lang, "Core profile", "基础资料")}
              subtitle={txt(lang, "Keep this up to date for better recommendations.", "保持最新资料以获得更精准推荐。")}
            />
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <div className="rounded-2xl border border-sage/20 bg-[#fffaf2] px-3 py-3 text-sm text-clay">
                <p className="text-xs text-clay/65">{txt(lang, "Name", "姓名")}</p>
                <p className="mt-1 font-semibold">{overview.name}</p>
              </div>
              <div className="rounded-2xl border border-sage/20 bg-[#fffaf2] px-3 py-3 text-sm text-clay">
                <p className="text-xs text-clay/65">{txt(lang, "Pregnancy week", "孕周")}</p>
                <p className="mt-1 font-semibold">{overview.pregnancyWeek}</p>
              </div>
              <div className="rounded-2xl border border-sage/20 bg-[#fffaf2] px-3 py-3 text-sm text-clay">
                <p className="text-xs text-clay/65">{txt(lang, "Due date", "预产期")}</p>
                <p className="mt-1 font-semibold">{overview.dueDate}</p>
              </div>
              <div className="rounded-2xl border border-sage/20 bg-[#fffaf2] px-3 py-3 text-sm text-clay">
                <p className="text-xs text-clay/65">{txt(lang, "Partner sync", "伴侣同步")}</p>
                <p className="mt-1 font-semibold">{partnerSync ? txt(lang, "Enabled", "已开启") : txt(lang, "Disabled", "已关闭")}</p>
              </div>
              <div className="rounded-2xl border border-sage/20 bg-[#fffaf2] px-3 py-3 text-sm text-clay">
                <p className="text-xs text-clay/65">{txt(lang, "City", "所在城市")}</p>
                <p className="mt-1 font-semibold">{overview.city || txt(lang, "Not set", "未设置")}</p>
              </div>
              <div className="rounded-2xl border border-sage/20 bg-[#fffaf2] px-3 py-3 text-sm text-clay">
                <p className="text-xs text-clay/65">{txt(lang, "Phone", "手机号")}</p>
                <p className="mt-1 font-semibold">{overview.phone || txt(lang, "Not set", "未设置")}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onEditProfile}
              className="mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition hover:brightness-95"
              style={{ backgroundColor: style.primaryBg, color: style.primaryText }}
            >
              <UserRound className="h-4 w-4" />
              {txt(lang, "Edit login profile", "编辑登录资料")}
            </button>
          </Card>
        )}

        {activePage === "record" && (
          <Card style={style}>
            <SectionTitle
              title={txt(lang, "Mood and body records", "情绪与身体记录")}
              subtitle={txt(lang, "Overview of your latest check-ins and trends.", "查看你近期打卡和趋势概览。")}
            />
            <div className="mt-3 grid grid-cols-3 gap-2">
              <div className="rounded-2xl border border-sage/20 bg-[#fffaf2] p-3 text-center">
                <p className="text-xs text-clay/70">{txt(lang, "Check-in streak", "连续打卡")}</p>
                <p className="mt-1 font-heading text-xl font-bold text-clay">{checkInStreak}</p>
              </div>
              <div className="rounded-2xl border border-sage/20 bg-[#fffaf2] p-3 text-center">
                <p className="text-xs text-clay/70">{txt(lang, "This month", "本月记录")}</p>
                <p className="mt-1 font-heading text-xl font-bold text-clay">{recordMonthCompletions}</p>
              </div>
              <div className="rounded-2xl border border-sage/20 bg-[#fffaf2] p-3 text-center">
                <p className="text-xs text-clay/70">{txt(lang, "Latest mood", "最近情绪")}</p>
                <p className="mt-1 font-heading text-xl font-bold text-clay">{latestMoodIcon}</p>
              </div>
            </div>
            <div className="mt-3 rounded-2xl border border-sage/20 bg-[#fffaf2] px-3 py-3 text-sm text-clay">
              <p className="font-semibold">{txt(lang, "Comfort task completion", "舒缓任务完成率")}</p>
              <p className="mt-1 text-clay/75">{recordComfortRate}%</p>
            </div>
            <button
              type="button"
              className="mt-4 inline-flex items-center gap-2 rounded-full border border-sage/25 bg-[#fffaf2] px-4 py-2 text-sm font-semibold text-clay transition hover:bg-sage/10"
            >
              <Download className="h-4 w-4" />
              {txt(lang, "Export monthly report", "导出月度报告")}
            </button>
          </Card>
        )}

        {activePage === "privacy" && (
          <Card style={style}>
            <SectionTitle
              title={txt(lang, "Privacy controls", "隐私控制")}
              subtitle={txt(lang, "Control who can access your data and notifications.", "控制谁可以访问你的数据与提醒。")}
            />
            <div className="mt-3 space-y-2">
              <ToggleRow
                label={txt(lang, "Private mode", "隐私模式")}
                on={privateMode}
                toggle={() => updatePrivacyValue("privateMode", !privateMode)}
              />
              <ToggleRow
                label={txt(lang, "Anonymous data for research", "匿名数据用于研究")}
                on={shareForResearch}
                toggle={() => updatePrivacyValue("shareForResearch", !shareForResearch)}
              />
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                className="rounded-2xl border border-sage/25 bg-[#fffaf2] px-3 py-2 text-sm font-semibold text-clay transition hover:bg-sage/10"
              >
                {txt(lang, "Manage login devices", "管理登录设备")}
              </button>
              <button
                type="button"
                className="rounded-2xl border border-sage/25 bg-[#fffaf2] px-3 py-2 text-sm font-semibold text-clay transition hover:bg-sage/10"
              >
                {txt(lang, "Download my data", "下载我的数据")}
              </button>
            </div>
          </Card>
        )}

        {activePage === "counsel" && (
          <Card style={style}>
            <SectionTitle
              title={txt(lang, "Professional support booking", "专业支持预约")}
              subtitle={txt(lang, "Choose the most suitable support slot for this week.", "选择本周最适合你的支持时段。")}
            />
            <div className="mt-3 space-y-2">
              {(counselingSlots.length > 0
                ? counselingSlots
                : [
                    { id: "slot-fallback-1", label: txt(lang, "Today 19:30 - Online counseling", "今天 19:30 - 在线咨询") },
                    { id: "slot-fallback-2", label: txt(lang, "Tomorrow 10:00 - Breathing coach", "明天 10:00 - 呼吸指导") },
                    { id: "slot-fallback-3", label: txt(lang, "Friday 15:00 - Clinical follow-up", "周五 15:00 - 临床随访") },
                  ]
              ).map((item) => (
                <div key={item.id} className="rounded-2xl border border-sage/20 bg-[#fffaf2] px-3 py-3 text-sm font-semibold text-clay">
                  <span className="inline-flex items-center gap-2">
                    <Clock3 className="h-4 w-4 text-clay/60" />
                    {localizeCounselingSlotLabel(item.label, lang)}
                  </span>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition hover:brightness-95"
              style={{ backgroundColor: style.primaryBg, color: style.primaryText }}
            >
              <Stethoscope className="h-4 w-4" />
              {txt(lang, "Open booking", "前往预约")}
            </button>
          </Card>
        )}

        {activePage === "docs" && (
          <div className="space-y-4">
            <Card style={style}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: style.pillBg, color: style.pillText }}>
                  {appVersionInfo.currentVersion}
                </span>
                <span className="rounded-full bg-[#fffaf2] px-3 py-1 text-xs font-semibold text-clay/70">
                  {appVersionInfo.releaseDate}
                </span>
                <span className="rounded-full bg-[#fffaf2] px-3 py-1 text-xs font-semibold text-clay/70">
                  {appVersionInfo.codename}
                </span>
              </div>
              <div className="mt-4 rounded-[1.45rem] border border-sage/20 bg-[#fffaf2] p-4">
                <p className="text-sm font-semibold text-clay">
                  {txt(lang, "Current product definition", "当前产品定义")}
                </p>
                <p className="mt-2 text-sm font-semibold text-clay">{appGuideContent.hero.definition}</p>
                <p className="mt-2 text-sm text-clay/75">{appGuideContent.hero.summary}</p>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {appGuideContent.hero.highlights.map((item) => (
                  <div key={item.label} className="rounded-2xl border border-sage/20 bg-[#fffaf2] p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-clay/60">{item.label}</p>
                    <p className="mt-2 text-sm font-semibold text-clay">{item.value}</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card style={style}>
              <SectionTitle
                title={txt(lang, "Main flow", "主流程")}
                subtitle={txt(lang, "Understand the app through the actual usage chain.", "用真实使用链路理解当前产品。")}
              />
              <div className="mt-3 space-y-2">
                {appGuideContent.mainFlow.map((item) => (
                  <div key={item.title} className="rounded-2xl border border-sage/20 bg-[#fffaf2] p-4">
                    <div className="flex items-start gap-3">
                      <span
                        className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold"
                        style={{ backgroundColor: style.primaryBg, color: style.primaryText }}
                      >
                        {item.step}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-clay">{item.title}</p>
                        <p className="mt-1 text-sm text-clay/75">{item.desc}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card style={style}>
                <SectionTitle
                  title={txt(lang, "Navigation collaboration", "导航协作")}
                  subtitle={txt(lang, "Four tabs work together instead of existing in isolation.", "四个导航不是分散功能，而是共同组成产品主链路。")}
                />
                <div className="mt-3 space-y-2">
                  {appGuideContent.navigation.map((item) => (
                    <div key={item.title} className="rounded-2xl border border-sage/20 bg-[#fffaf2] p-4">
                      <p className="text-sm font-semibold text-clay">{item.title}</p>
                      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-clay/55">{item.role}</p>
                      <p className="mt-2 text-sm text-clay/75">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </Card>

              <Card style={style}>
                <SectionTitle
                  title={txt(lang, "Architecture overview", "技术架构概览")}
                  subtitle={txt(lang, "Explain clearly where data comes from and why AI is controlled.", "把前端承接、数据来源和 AI 为什么受控解释清楚。")}
                />
                <div className="mt-3 space-y-2">
                  {[
                    ["前端承接", appGuideContent.architecture.frontendLayers[0]],
                    ["数据状态", appGuideContent.architecture.dataState[0]],
                    ["服务接口", appGuideContent.architecture.serviceLayer[0]],
                    ["知识优先级", appGuideContent.architecture.knowledgePriority.join(" -> ")],
                    ["AI 定位", appGuideContent.aiMechanism.points[2]],
                  ].map(([title, desc]) => (
                    <div key={title} className="rounded-2xl border border-sage/20 bg-[#fffaf2] p-4">
                      <p className="text-sm font-semibold text-clay">{title}</p>
                      <p className="mt-1 text-sm text-clay/75">{desc}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            <Card style={style}>
              <SectionTitle
                title={txt(lang, "AI mechanism and phase mapping", "AI 机制与阶段判断")}
                subtitle={txt(lang, "Show what is already landed and what is not finished yet.", "说明当前已经落地什么、还不是什么。")}
              />
              <div className="mt-3 rounded-2xl border border-sage/20 bg-[#fffaf2] p-4">
                <p className="text-sm text-clay/75">{appGuideContent.aiMechanism.summary}</p>
              </div>
              <div className="mt-3 grid gap-3 lg:grid-cols-2">
                <div className="rounded-2xl border border-sage/20 bg-[#fffaf2] p-4">
                  <p className="text-sm font-semibold text-clay">已落地部分</p>
                  <div className="mt-2 space-y-2">
                    {appGuideContent.phaseMapping.landed.map((item) => (
                      <p key={item} className="text-sm text-clay/75">{item}</p>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl border border-sage/20 bg-[#fffaf2] p-4">
                  <p className="text-sm font-semibold text-clay">未完全落地部分</p>
                  <div className="mt-2 space-y-2">
                    {appGuideContent.phaseMapping.missing.map((item) => (
                      <p key={item} className="text-sm text-clay/75">{item}</p>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={openStandaloneGuide}
                  className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition hover:brightness-95"
                  style={{ backgroundColor: style.primaryBg, color: style.primaryText }}
                >
                  <BookOpen className="h-4 w-4" />
                  {txt(lang, "Open full documentation", "打开完整文档")}
                </button>
                <button
                  type="button"
                  onClick={() => setActivePage("version")}
                  className="rounded-full border border-sage/20 bg-[#fffaf2] px-4 py-2 text-sm font-semibold text-clay transition hover:bg-sage/10"
                >
                  {txt(lang, "View version notes", "查看版本说明")}
                </button>
              </div>
            </Card>
          </div>
        )}

        {activePage === "version" && (
          <div className="space-y-4">
            <Card style={style}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-clay/60">
                    {txt(lang, "Current release", "当前版本")}
                  </p>
                  <h4 className="mt-1 font-heading text-3xl font-bold text-clay">{appVersionInfo.currentVersion}</h4>
                  <p className="mt-1 text-sm text-clay/75">
                    {appVersionInfo.codename} · {appVersionInfo.releaseDate}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActivePage("docs")}
                  className="rounded-full border border-sage/20 bg-[#fffaf2] px-4 py-2 text-sm font-semibold text-clay transition hover:bg-sage/10"
                >
                  {txt(lang, "Back to guide", "返回使用文档")}
                </button>
              </div>
              <div className="mt-4 rounded-[1.45rem] border border-sage/20 bg-[#fffaf2] p-4">
                <p className="text-sm font-semibold text-clay">
                  {txt(lang, "Summary", "更新摘要")}
                </p>
                <p className="mt-1 text-sm text-clay/75">{appVersionInfo.summary}</p>
              </div>
            </Card>

            <Card style={style}>
              <SectionTitle
                title={txt(lang, "Release timeline", "版本时间线")}
                subtitle={txt(lang, "Track what was added, improved, and fixed in each release.", "按版本查看新增、优化与修复内容。")}
              />
              <div className="mt-5 space-y-5">
                {appReleaseNotes.map((release, index) => (
                  <div key={release.version} className="relative pl-8">
                    {index !== appReleaseNotes.length - 1 && (
                      <div className="absolute left-[11px] top-8 bottom-[-28px] w-px bg-sage/20" />
                    )}
                    <div
                      className="absolute left-0 top-1.5 h-6 w-6 rounded-full border-4 border-white shadow-sm"
                      style={{ backgroundColor: index === 0 ? style.primaryBg : "#d8cbb8" }}
                    />
                    <div className="rounded-[1.6rem] border border-sage/20 bg-[#fffaf2] p-4 sm:p-5">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className="rounded-full px-3 py-1 text-xs font-semibold"
                              style={{ backgroundColor: style.pillBg, color: style.pillText }}
                            >
                              {release.version}
                            </span>
                            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-clay/70">
                              {release.status}
                            </span>
                            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-clay/55">
                              {release.date}
                            </span>
                          </div>
                          <h4 className="mt-3 font-heading text-xl font-bold text-clay">{release.title}</h4>
                          {release.summary && <p className="mt-1 text-sm text-clay/75">{release.summary}</p>}
                        </div>
                        {index === 0 && (
                          <span
                            className="rounded-full px-3 py-1 text-xs font-bold"
                            style={{ backgroundColor: style.primaryBg, color: style.primaryText }}
                          >
                            {txt(lang, "Latest", "最新")}
                          </span>
                        )}
                      </div>

                      <div className="mt-4 grid gap-3">
                        {releaseSectionOrder
                          .filter((sectionKey) => Array.isArray(release.sections?.[sectionKey]) && release.sections[sectionKey].length > 0)
                          .map((sectionKey) => {
                            const section = RELEASE_SECTION_META[sectionKey];
                            return (
                              <div
                                key={sectionKey}
                                className={`rounded-[1.35rem] border bg-white/70 p-4 ${section.border}`}
                              >
                                <div className="flex items-center gap-2">
                                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${section.tone}`}>
                                    {section.label[lang] || section.label.zh}
                                  </span>
                                </div>
                                <div className="mt-3 space-y-2">
                                  {release.sections[sectionKey].map((item) => (
                                    <div key={item} className="flex items-start gap-3">
                                      <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${section.dot}`} />
                                      <p className="text-sm leading-6 text-clay/78">{item}</p>
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
          </div>
        )}

        {activePage === "help" && (
          <Card style={style}>
            <SectionTitle
              title={txt(lang, "Help and feedback", "帮助与反馈")}
              subtitle={txt(lang, "Find answers quickly or report an issue.", "快速找到答案，或反馈你遇到的问题。")}
            />
            <div className="mt-3 space-y-2">
              {(helpCenter.faqs || []).map((item) => (
                <SettingRow
                  key={item.id}
                  label={localizeHelpText(item.title, lang, HELP_TITLE_ZH)}
                  desc={localizeHelpText(item.desc, lang, HELP_DESC_ZH)}
                  Icon={CircleHelp}
                  onClick={() => {}}
                  style={style}
                />
              ))}
              {(!helpCenter.faqs || helpCenter.faqs.length === 0) && (
                <p className="rounded-2xl border border-sage/20 bg-[#fffaf2] px-3 py-3 text-sm text-clay/75">
                  {txt(lang, "No FAQ yet. Please check back later.", "暂无常见问题，请稍后再看。")}
                </p>
              )}
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setActivePage("docs")}
                className="rounded-2xl border border-sage/20 bg-[#fffaf2] px-3 py-3 text-left text-sm font-semibold text-clay transition hover:bg-sage/10"
              >
                {txt(lang, "Open app guide", "打开使用文档")}
              </button>
              <button
                type="button"
                onClick={() => setActivePage("version")}
                className="rounded-2xl border border-sage/20 bg-[#fffaf2] px-3 py-3 text-left text-sm font-semibold text-clay transition hover:bg-sage/10"
              >
                {txt(lang, "Open version notes", "打开版本说明")}
              </button>
            </div>
            <p className="mt-3 text-xs text-clay/65">Rihea {helpCenter.version || "v1.0.0"}</p>
          </Card>
        )}

        {activePage === "urgent" && (
          <Card style={style}>
            <SectionTitle
              title={txt(lang, "Urgent support contacts", "紧急支持联系人")}
              subtitle={txt(lang, "Use this if anxiety suddenly escalates and affects safety.", "当焦虑突然升级并影响安全时优先使用。")}
            />
            <div className="mt-3 space-y-2">
              {(emergencyContacts.length > 0
                ? emergencyContacts
                : [
                    { id: "fallback-primary", title: txt(lang, "Primary emergency contact", "首要紧急联系人"), phone: "+86 138-0000-0000" },
                    { id: "fallback-hospital", title: txt(lang, "Hospital hotline", "医院热线"), phone: "400-000-1120" },
                  ]
              ).map((item) => (
                <div key={item.id} className="rounded-2xl border border-[#e8c5b4] bg-[#fff5ef] px-3 py-3">
                  <p className="text-sm font-semibold text-[#A35E38]">{localizeEmergencyTitle(item.title, lang)}</p>
                  <p className="mt-1 text-sm text-[#A35E38]">{item.phone}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full bg-[#d89b6b] px-4 py-2 text-sm font-bold text-white transition hover:brightness-95"
              >
                <Phone className="h-4 w-4" />
                {txt(lang, "Call now", "立即呼叫")}
              </button>
              <button
                type="button"
                className="rounded-full border border-[#d8b49f] bg-[#fff5ef] px-4 py-2 text-sm font-semibold text-[#A35E38] transition hover:bg-[#ffece2]"
              >
                {txt(lang, "Send support alert", "发送求助提醒")}
              </button>
            </div>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card style={style}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-clay/65">{txt(lang, "Profile", "我的信息")}</p>
            <h2 className="mt-1 font-heading text-2xl font-bold text-clay">{overview.name}</h2>
            <p className="mt-1 text-sm text-clay/78">
              {txt(lang, "Week", "孕")} {overview.pregnancyWeek} {txt(lang, "Progress", "，孕程进度")} {overview.progress}%
            </p>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-sage/15">
              <div className="h-full rounded-full bg-[#d89b6b]" style={{ width: `${overview.progress}%` }} />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: style.pillBg, color: style.pillText }}>
                {txt(lang, "Due in", "距离预产期")} {dueInDays} {txt(lang, "days", "天")}
              </span>
              <span className="rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: style.pillBg, color: style.pillText }}>
                {txt(lang, "Check-in streak", "连续打卡")} {checkInStreak} {txt(lang, "days", "天")}
              </span>
              <span className="rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: style.pillBg, color: style.pillText }}>
                {isLoggedIn ? txt(lang, "Signed in", "已登录") : txt(lang, "Signed out", "未登录")}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {isLoggedIn ? (
                <>
                  <button
                    type="button"
                    onClick={onRelogin}
                    className="inline-flex items-center gap-2 rounded-full border border-sage/20 bg-[#fffaf2] px-3 py-1.5 text-xs font-semibold text-clay transition hover:bg-sage/10"
                  >
                    <LogIn className="h-3.5 w-3.5" />
                    {txt(lang, "Re-sign in", "重新登录")}
                  </button>
                  <button
                    type="button"
                    onClick={onEditProfile}
                    className="inline-flex items-center gap-2 rounded-full border border-sage/20 bg-[#fffaf2] px-3 py-1.5 text-xs font-semibold text-clay transition hover:bg-sage/10"
                  >
                    <UserRound className="h-3.5 w-3.5" />
                    {txt(lang, "Edit profile", "编辑资料")}
                  </button>
                  <button
                    type="button"
                    onClick={onLogout}
                    className="inline-flex items-center gap-2 rounded-full border border-[#e8c5b4] bg-[#fff5ef] px-3 py-1.5 text-xs font-semibold text-[#A35E38] transition hover:bg-[#ffece2]"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    {txt(lang, "Sign out", "退出登录")}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={onLogin}
                  className="inline-flex items-center gap-2 rounded-full border border-sage/20 bg-[#fffaf2] px-3 py-1.5 text-xs font-semibold text-clay transition hover:bg-sage/10"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  {txt(lang, "Sign in", "登录")}
                </button>
              )}
            </div>
            {isLoggedIn && loginAccount && <p className="mt-2 text-xs text-clay/65">{loginAccount}</p>}
          </div>
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[#fffaf2] text-clay">
            <UserRound className="h-7 w-7" />
          </div>
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1.1fr,1fr]">
        <Card style={style}>
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-2xl font-bold text-clay">{txt(lang, "Pregnancy profile", "孕程档案")}</h3>
            <CalendarDays className="h-5 w-5 text-clay/70" />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <div className="rounded-2xl border border-sage/20 bg-[#fffaf2] p-3 text-center">
              <p className="text-xs text-clay/70">{txt(lang, "Current week", "当前孕周")}</p>
              <p className="mt-1 font-heading text-xl font-bold text-clay">{overview.pregnancyWeek}</p>
            </div>
            <div className="rounded-2xl border border-sage/20 bg-[#fffaf2] p-3 text-center">
              <p className="text-xs text-clay/70">{txt(lang, "Mood streak", "连续打卡")}</p>
              <p className="mt-1 font-heading text-xl font-bold text-clay">{checkInStreak}</p>
            </div>
            <div className="rounded-2xl border border-sage/20 bg-[#fffaf2] p-3 text-center">
              <p className="text-xs text-clay/70">{txt(lang, "Latest check-in", "最近打卡")}</p>
              <p className="mt-1 font-heading text-xl font-bold text-clay">
                {latestCheckIn ? formatDateShort(latestCheckIn.date, lang) : "-"}
              </p>
            </div>
          </div>
        </Card>

        <Card style={style}>
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-2xl font-bold text-clay">{txt(lang, "Quick settings", "快捷配置")}</h3>
            <Bell className="h-5 w-5 text-clay/70" />
          </div>
          <div className="mt-3 space-y-2">
            <ToggleRow label={txt(lang, "Daily reminder", "每日提醒")} on={reminder} toggle={() => setReminder((value) => !value)} />
            <ToggleRow label={txt(lang, "Button sounds", "按钮音效")} on={sounds} toggle={() => setSounds((value) => !value)} />
            <ToggleRow label={txt(lang, "Partner sync", "伴侣同步")} on={partnerSync} toggle={handlePartnerQuickToggle} />
          </div>
          <button
            type="button"
            onClick={openSettings}
            className="mt-3 flex w-full items-center justify-between rounded-2xl border border-sage/20 bg-[#fffaf2] px-3 py-3 text-left"
          >
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-clay">
              <span className="grid h-7 w-7 place-items-center rounded-full" style={{ backgroundColor: style.pillBg, color: style.pillText }}>
                <Volume2 className="h-4 w-4" />
              </span>
              {txt(lang, "More preference settings", "更多偏好设置")}
            </span>
            <ChevronRight className="h-4 w-4 text-clay/55" />
          </button>
        </Card>
      </div>

      <Card style={style}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-clay/65">{txt(lang, "Partner Sync", "伴侣同步")}</p>
            <h3 className="mt-1 font-heading text-2xl font-bold text-clay">
              {partnerOverview?.status === PARTNER_SYNC_STATUS.BOUND
                ? txt(lang, "Your partner has a clear next step", "伴侣已经有明确的下一步")
                : partnerOverview?.status === PARTNER_SYNC_STATUS.PENDING
                  ? txt(lang, "The invite is waiting to be accepted", "邀请码已生成，等待对方加入")
                  : txt(lang, "Turn status into support actions", "把状态转成支持动作")}
            </h3>
            <p className="mt-1 text-sm text-clay/78">
              {partnerOverview?.status === PARTNER_SYNC_STATUS.BOUND
                ? partnerOverview?.preview?.todayStatus?.desc
                : txt(
                    lang,
                    "Keep shared information short and actionable so your partner knows what to do today.",
                    "把共享内容控制在简短、可执行的范围内，让伴侣知道今天该做什么。"
                  )}
            </p>
          </div>
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#fffaf2] text-clay">
            <HeartHandshake className="h-6 w-6" />
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <span className="rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: style.pillBg, color: style.pillText }}>
            {partnerOverview?.status === PARTNER_SYNC_STATUS.BOUND
              ? txt(lang, "Connected", "已绑定")
              : partnerOverview?.status === PARTNER_SYNC_STATUS.PENDING
                ? txt(lang, "Pending", "待加入")
                : txt(lang, "Not enabled", "未开启")}
          </span>
          <span className="rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: style.pillBg, color: style.pillText }}>
            {partnerSharingLabel}
          </span>
          {partnerOverview?.preview?.risk?.label && (
            <span className="rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: style.pillBg, color: style.pillText }}>
              {partnerOverview.preview.risk.label}
            </span>
          )}
        </div>

        {partnerMainTask && partnerOverview?.sharingLevel !== PARTNER_SHARING_LEVEL.OFF && (
          <div className="mt-4 rounded-2xl border border-sage/20 bg-[#fffaf2] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-clay/58">{txt(lang, "Main task", "主任务")}</p>
            <p className="mt-2 text-sm font-semibold text-clay">{partnerMainTask.title}</p>
            <p className="mt-1 text-sm text-clay/75">{partnerMainTask.desc}</p>
          </div>
        )}

        <button
          type="button"
          onClick={() => setActivePage("partner")}
          className="mt-4 flex w-full items-center justify-between rounded-2xl border border-sage/20 bg-[#fffaf2] px-3 py-3 text-left transition hover:bg-sage/10"
        >
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-clay">
            <span className="grid h-8 w-8 place-items-center rounded-full" style={{ backgroundColor: style.pillBg, color: style.pillText }}>
              <HeartHandshake className="h-4 w-4" />
            </span>
            {txt(lang, "Open partner sync center", "打开伴侣同步中心")}
          </span>
          <ChevronRight className="h-4 w-4 text-clay/55" />
        </button>
      </Card>

      <Card style={style}>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-heading text-2xl font-bold text-clay">{txt(lang, "Account and privacy", "账户与隐私")}</h3>
          <ShieldCheck className="h-5 w-5 text-clay/70" />
        </div>
        <div className="space-y-2">
          {profileRows.map((item) => (
            <SettingRow key={item.key} label={item.label} desc={item.desc} Icon={item.Icon} onClick={() => setActivePage(item.key)} style={style} />
          ))}
        </div>
      </Card>

      <Card style={style}>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-heading text-2xl font-bold text-clay">{txt(lang, "Support center", "支持中心")}</h3>
          <HeartHandshake className="h-5 w-5 text-clay/70" />
        </div>
        <div className="space-y-2">
          {supportRows.map((item) => (
            <SettingRow
              key={item.key}
              label={item.label}
              desc={item.desc}
              Icon={item.Icon}
              onClick={() => setActivePage(item.key)}
              style={style}
              danger={item.danger}
            />
          ))}
        </div>
      </Card>
    </div>
  );
}
