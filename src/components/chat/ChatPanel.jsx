import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Bot, Brain, MessageSquarePlus, Mic, Send, Sparkles, User, X } from "lucide-react";
import { requestAgentChat, requestAgentPresets } from "../../api/agent";
import { txt } from "../../utils/txt";
import RiheaLogo from "../brand/RiheaLogo";

const createSessionId = () => `chat_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
const createMessageId = (prefix = "msg") => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
const AUTO_SCROLL_THRESHOLD = 80;
const MODEL_OPTIONS = [
  {
    key: "deepseek_reasoner",
    en: "DeepSeek Reasoner",
    zh: "DeepSeek 推理",
  },
  {
    key: "deepseek_chat",
    en: "DeepSeek Chat",
    zh: "DeepSeek 对话",
  },
  {
    key: "doubao_chat",
    en: "Doubao Chat",
    zh: "豆包对话",
  },
  {
    key: "openai_gpt4o_mini",
    en: "OpenAI GPT-4o Mini",
    zh: "OpenAI GPT-4o Mini",
  },
];

function mapModelToToolMode(modelKey) {
  if (modelKey === "deepseek_reasoner") return "deep";
  return "web";
}

function normalizeAssistantMessage(response = {}, lang = "zh") {
  const answer = String(response?.answer || "").trim();
  const answerRaw = String(response?.answer_raw || answer).trim();
  const citations = Array.isArray(response?.citations) ? response.citations : [];
  return {
    id: response?.id || createMessageId("assistant"),
    role: "assistant",
    text: answerRaw || answer,
    answerRaw: answerRaw || answer,
    status: "done",
    displayVariant: "normal",
    reasoningSummary: response?.reasoning_summary || null,
    citations,
    sources: Array.isArray(response?.sources) ? response.sources : [],
    usedSources: Array.isArray(response?.usedSources) ? response.usedSources : [],
    groundingSummary: response?.groundingSummary || null,
    kbFreshness: response?.kbFreshness || null,
    confidence: Number.isFinite(Number(response?.confidence)) ? Number(response.confidence) : null,
    fallbackReason: response?.fallbackReason || null,
    relatedQuestionCards: Array.isArray(response?.relatedQuestionCards) ? response.relatedQuestionCards : [],
    searchMeta: response?.search_meta || null,
    disclaimer: String(response?.disclaimer || "").trim(),
    nextActions: Array.isArray(response?.nextActions) ? response.nextActions : [],
    riskLevel: String(response?.riskLevel || "R0"),
    escalation: response?.escalation || null,
    fallbackText:
      lang === "en"
        ? "The assistant returned an empty answer."
        : "助手返回了空结果。",
  };
}

function createPendingAssistantMessage(lang = "zh") {
  return {
    id: createMessageId("assistant_pending"),
    role: "assistant",
    status: "pending",
    displayVariant: "typing",
    text: "",
    answerRaw: "",
    waitingLabel: txt(lang, "Rihea is organizing the reply", "Rihea 正在整理回复"),
    waitingHint: txt(lang, "Preparing a warm and practical response...", "正在准备一条温和且可执行的回复..."),
    nextActions: [],
    citations: [],
    sources: [],
    relatedQuestionCards: [],
    disclaimer: "",
    escalation: null,
    reasoningSummary: null,
    kbFreshness: null,
  };
}

function createErrorAssistantMessage(lang = "zh") {
  return {
    id: createMessageId("assistant_error"),
    role: "assistant",
    status: "error",
    displayVariant: "error",
    text: txt(
      lang,
      "The assistant is temporarily unavailable. Please try again shortly.",
      "助手暂时不可用，请稍后重试。"
    ),
    answerRaw: "",
    nextActions: [],
    citations: [],
    sources: [],
    relatedQuestionCards: [],
    disclaimer: "",
    escalation: null,
    reasoningSummary: null,
    kbFreshness: null,
  };
}

function hasReasoningContent(summary) {
  if (!summary || typeof summary !== "object") return false;
  return Boolean(
    summary?.intent ||
      summary?.safety ||
      summary?.retrieval ||
      summary?.generation ||
      (summary?.trace_refs && typeof summary.trace_refs === "object")
  );
}

export default function ChatPanel({
  lang,
  style,
  userId = "guest_local",
  userName = "",
  profile = {},
  checkIns = [],
  initialDraft = "",
  messages = [],
  setMessages = () => {},
  onClose,
  inputRef,
}) {
  const [draft, setDraft] = useState(initialDraft);
  const [presetCards, setPresetCards] = useState([]);
  const [selectedModelKey, setSelectedModelKey] = useState("deepseek_reasoner");
  const [logoState, setLogoState] = useState("idle");
  const [isVoicePressing, setIsVoicePressing] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState("idle");
  const [voiceElapsedMs, setVoiceElapsedMs] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const recognitionRef = useRef(null);
  const holdTimerRef = useRef(null);
  const shouldKeepListeningRef = useRef(false);
  const isVoicePressingRef = useRef(false);
  const messageScrollRef = useRef(null);
  const bottomAnchorRef = useRef(null);
  const shouldAutoScrollRef = useRef(true);
  const baseDraftRef = useRef("");
  const finalTranscriptRef = useRef("");
  const voiceStartedAtRef = useRef(0);
  const voiceElapsedTimerRef = useRef(null);
  const sessionIdRef = useRef(createSessionId());
  const displayName = userName || txt(lang, "Mama", "准妈妈");
  const hiLabel = lang === "zh" ? `你好，${displayName}` : `Hi, ${displayName}`;
  const modelLabelByKey = useMemo(
    () =>
      Object.fromEntries(
        MODEL_OPTIONS.map((item) => [item.key, lang === "en" ? item.en : item.zh])
      ),
    [lang]
  );
  const selectedModelLabel = modelLabelByKey[selectedModelKey] || selectedModelKey;

  const fallbackPresetCards = useMemo(
    () =>
      lang === "zh"
        ? [
            {
              id: "pregnancy_emotion",
              category: "featured",
              title: "情绪波动怎么缓解",
              userVisibleText: "孕期情绪波动很大、总是焦虑，我现在可以怎么做？",
              preferredSourceScope: "kb_first",
              feishuScopeId: "pregnancy_emotion",
            },
            {
              id: "pregnancy_sleep",
              category: "featured",
              title: "孕期夜间焦虑怎么缓解",
              userVisibleText: "孕期总是睡不好、夜醒频繁，我应该先怎么调整？",
              preferredSourceScope: "kb_first",
              feishuScopeId: "pregnancy_sleep",
            },
            {
              id: "partner_support",
              category: "featured",
              title: "如何和伴侣沟通支持需求",
              userVisibleText: "我想和伴侣沟通我的支持需求，怎么表达会更清楚？",
              preferredSourceScope: "local_kb",
              feishuScopeId: "partner_support",
            },
          ]
        : [
            {
              id: "pregnancy_emotion",
              category: "featured",
              title: "How to ease mood swings",
              userVisibleText: "My mood swings a lot during pregnancy and I keep feeling anxious. What can I do now?",
              preferredSourceScope: "kb_first",
              feishuScopeId: "pregnancy_emotion",
            },
            {
              id: "pregnancy_sleep",
              category: "featured",
              title: "How to ease night anxiety",
              userVisibleText: "I keep sleeping poorly during pregnancy and wake up often. What should I adjust first?",
              preferredSourceScope: "kb_first",
              feishuScopeId: "pregnancy_sleep",
            },
            {
              id: "partner_support",
              category: "featured",
              title: "How to ask partner support clearly",
              userVisibleText: "I want to communicate my support needs to my partner. How can I express them more clearly?",
              preferredSourceScope: "local_kb",
              feishuScopeId: "partner_support",
            },
          ],
    [lang]
  );
  const featuredPresetCards = (presetCards.length ? presetCards : fallbackPresetCards).filter((item) => item.category !== "library").slice(0, 3);
  const libraryPresetCards = (presetCards.length ? presetCards : fallbackPresetCards).filter((item) => item.category === "library").slice(0, 3);

  const clearVoiceElapsedTicker = () => {
    if (voiceElapsedTimerRef.current) {
      window.clearInterval(voiceElapsedTimerRef.current);
      voiceElapsedTimerRef.current = null;
    }
  };

  const resetVoiceElapsed = () => {
    clearVoiceElapsedTicker();
    voiceStartedAtRef.current = 0;
    setVoiceElapsedMs(0);
  };

  const ensureVoiceElapsedTicker = () => {
    if (!voiceStartedAtRef.current) {
      voiceStartedAtRef.current = Date.now();
      setVoiceElapsedMs(0);
    }

    if (voiceElapsedTimerRef.current) return;

    voiceElapsedTimerRef.current = window.setInterval(() => {
      if (!voiceStartedAtRef.current) return;
      setVoiceElapsedMs(Date.now() - voiceStartedAtRef.current);
    }, 200);
  };

  useEffect(() => {
    if (typeof initialDraft !== "string") return;
    setDraft(initialDraft);
  }, [initialDraft]);

  useEffect(() => {
    let cancelled = false;

    requestAgentPresets({ lang })
      .then((data) => {
        if (cancelled) return;
        const items = Array.isArray(data?.items) ? data.items : [];
        setPresetCards(items);
      })
      .catch(() => {
        if (cancelled) return;
        setPresetCards([]);
      });

    return () => {
      cancelled = true;
    };
  }, [lang]);

  useEffect(() => {
    const recognition = recognitionRef.current;
    if (recognition) {
      recognition.lang = lang === "zh" ? "zh-CN" : "en-US";
    }
  }, [lang]);

  useEffect(() => {
    if (draft.trim()) {
      setLogoState("listening");
      return;
    }

    if (messages.length > 0 && messages[messages.length - 1]?.role === "assistant") {
      setLogoState("speaking");
      const timer = window.setTimeout(() => setLogoState("idle"), 1300);
      return () => window.clearTimeout(timer);
    }

    setLogoState("idle");
    return undefined;
  }, [draft, messages]);

  useEffect(() => {
    if (!messages.length) {
      shouldAutoScrollRef.current = true;
      return;
    }

    if (!shouldAutoScrollRef.current) return;

    bottomAnchorRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages]);

  useEffect(() => {
    return () => {
      if (holdTimerRef.current) {
        window.clearTimeout(holdTimerRef.current);
      }
      clearVoiceElapsedTicker();
      voiceStartedAtRef.current = 0;
      shouldKeepListeningRef.current = false;

      const recognition = recognitionRef.current;
      if (!recognition) return;

      recognition.onstart = null;
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;

      try {
        recognition.stop();
      } catch (error) {
        // Ignore stop errors caused by rapid unmount while idle.
      }

      recognitionRef.current = null;
    };
  }, []);

  const createRecognition = () => {
    if (typeof window === "undefined") return null;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return null;

    const recognition = new SpeechRecognition();
    recognition.lang = lang === "zh" ? "zh-CN" : "en-US";
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsVoiceActive(true);
      setVoiceStatus("listening");
      ensureVoiceElapsedTicker();
    };

    recognition.onresult = (event) => {
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const transcript = event.results[i][0]?.transcript?.trim();
        if (!transcript) continue;

        if (event.results[i].isFinal) {
          finalTranscriptRef.current = `${finalTranscriptRef.current} ${transcript}`.trim();
        } else {
          interimTranscript = `${interimTranscript} ${transcript}`.trim();
        }
      }

      const merged = [baseDraftRef.current, finalTranscriptRef.current, interimTranscript]
        .filter(Boolean)
        .join(" ")
        .trim();
      setDraft(merged);
    };

    recognition.onerror = (event) => {
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        setVoiceStatus("blocked");
      } else if (event.error !== "aborted") {
        setVoiceStatus("error");
      }

      shouldKeepListeningRef.current = false;
      setIsVoiceActive(false);
      isVoicePressingRef.current = false;
      setIsVoicePressing(false);
      resetVoiceElapsed();
    };

    recognition.onend = () => {
      setIsVoiceActive(false);

      if (shouldKeepListeningRef.current) {
        window.setTimeout(() => {
          if (!shouldKeepListeningRef.current) return;
          try {
            recognition.start();
          } catch (error) {
            shouldKeepListeningRef.current = false;
            setIsVoiceActive(false);
            resetVoiceElapsed();
            setVoiceStatus("error");
          }
        }, 120);
        return;
      }

      resetVoiceElapsed();
      setVoiceStatus((current) => (current === "error" || current === "blocked" ? current : "idle"));
    };

    return recognition;
  };

  const startVoiceRecognition = () => {
    const recognition = recognitionRef.current || createRecognition();
    if (!recognition) {
      setVoiceStatus("unsupported");
      return;
    }

    if (!recognitionRef.current) {
      recognitionRef.current = recognition;
    }

    baseDraftRef.current = draft.trim();
    finalTranscriptRef.current = "";
    shouldKeepListeningRef.current = true;

    try {
      recognition.start();
    } catch (error) {
      const message = String(error?.message || error).toLowerCase();
      if (!message.includes("already")) {
        shouldKeepListeningRef.current = false;
        setIsVoiceActive(false);
        setVoiceStatus("error");
        resetVoiceElapsed();
      }
    }
  };

  const beginVoiceHold = (event) => {
    event.preventDefault();
    if (isVoicePressingRef.current) return;

    isVoicePressingRef.current = true;
    setIsVoicePressing(true);

    holdTimerRef.current = window.setTimeout(() => {
      if (!isVoicePressingRef.current) return;
      startVoiceRecognition();
    }, 180);
  };

  const endVoiceHold = (event) => {
    event.preventDefault();
    isVoicePressingRef.current = false;
    setIsVoicePressing(false);

    if (holdTimerRef.current) {
      window.clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }

    if (!shouldKeepListeningRef.current) return;
    shouldKeepListeningRef.current = false;

    const recognition = recognitionRef.current;
    if (!recognition) return;

    try {
      recognition.stop();
    } catch (error) {
      setIsVoiceActive(false);
      resetVoiceElapsed();
    }
  };

  const handleVoiceKeyDown = (event) => {
    if ((event.key === " " || event.key === "Enter") && !event.repeat) {
      beginVoiceHold(event);
    }
  };

  const handleVoiceKeyUp = (event) => {
    if (event.key === " " || event.key === "Enter") {
      endVoiceHold(event);
    }
  };

  const stopVoiceRecognition = () => {
    isVoicePressingRef.current = false;
    setIsVoicePressing(false);
    shouldKeepListeningRef.current = false;
    setIsVoiceActive(false);
    resetVoiceElapsed();

    const recognition = recognitionRef.current;
    if (!recognition) return;

    try {
      recognition.stop();
    } catch (error) {
      // Ignore stop errors from already-stopped recognition.
    }
  };

  const voiceButtonActive = isVoicePressing || isVoiceActive;
  const voiceElapsedSeconds = Math.max(0, Math.floor(voiceElapsedMs / 1000));
  const voiceDurationLabel = `${String(Math.floor(voiceElapsedSeconds / 60)).padStart(2, "0")}:${String(
    voiceElapsedSeconds % 60
  ).padStart(2, "0")}`;
  const voiceActionText = voiceButtonActive
    ? txt(lang, "Release to stop", "松开结束")
    : txt(lang, "Voice Input", "语音输入");
  const voiceHint =
    voiceStatus === "listening"
      ? txt(lang, "Listening... keep holding to continue", "正在聆听，继续按住可持续输入")
      : voiceStatus === "unsupported"
        ? txt(lang, "Current browser does not support voice input", "当前浏览器暂不支持语音输入")
        : voiceStatus === "blocked"
          ? txt(lang, "Please allow microphone access and try again", "请先允许麦克风权限后重试")
          : voiceStatus === "error"
            ? txt(lang, "Voice input interrupted, long press to retry", "语音输入中断，请长按重试")
            : txt(lang, "Long press the mic for hands-free input", "长按麦克风可免打字输入");

  const updateAutoScrollState = () => {
    const container = messageScrollRef.current;
    if (!container) return;

    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    shouldAutoScrollRef.current = distanceFromBottom <= AUTO_SCROLL_THRESHOLD;
  };

  const scrollMessagesToBottom = (behavior = "smooth") => {
    shouldAutoScrollRef.current = true;
    bottomAnchorRef.current?.scrollIntoView({
      behavior,
      block: "end",
    });
  };

  const sendQuestion = async ({ question, preset = null } = {}) => {
    const safeQuestion = String(question || "").trim();
    if (!safeQuestion || isSending) return;
    const normalizedPreset = preset && typeof preset === "object" ? preset : null;
    const visibleText = normalizedPreset?.userVisibleText || safeQuestion;
    const pendingMessage = createPendingAssistantMessage(lang);
    const pendingId = pendingMessage.id;
    const userMessage = {
      id: createMessageId("user"),
      role: "user",
      status: "done",
      displayVariant: "normal",
      text: visibleText,
    };

    if (isVoicePressingRef.current || shouldKeepListeningRef.current || isVoiceActive) {
      stopVoiceRecognition();
    }
    setLogoState("speaking");
    setDraft("");
    setIsSending(true);
    setMessages((prev) => [...prev, userMessage, pendingMessage]);
    window.requestAnimationFrame(() => {
      scrollMessagesToBottom("smooth");
    });

    try {
      const response = await requestAgentChat({
        userId,
        sessionId: sessionIdRef.current,
        message: safeQuestion,
        lang,
        presetQuestionId: normalizedPreset?.id || undefined,
        sourcePreference: normalizedPreset?.preferredSourceScope || undefined,
        feishuScopeId: normalizedPreset?.feishuScopeId || undefined,
        clientContext: {
          profile,
          checkIns,
          toolMode: mapModelToToolMode(selectedModelKey),
          modelPreference: {
            modelKey: selectedModelKey || "deepseek_chat",
          },
        },
      });

      const assistantMessage = {
        ...normalizeAssistantMessage(response, lang),
        id: pendingId,
        status: "done",
        displayVariant: "normal",
      };

      setMessages((prev) => {
        let replaced = false;
        const next = prev.map((item) => {
          if (item?.id !== pendingId) return item;
          replaced = true;
          return assistantMessage;
        });

        return replaced ? next : [...next, assistantMessage];
      });
    } catch (error) {
      const errorMessage = {
        ...createErrorAssistantMessage(lang),
        id: pendingId,
      };

      setMessages((prev) => {
        let replaced = false;
        const next = prev.map((item) => {
          if (item?.id !== pendingId) return item;
          replaced = true;
          return errorMessage;
        });

        return replaced ? next : [...next, errorMessage];
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleSend = async () => {
    const question = draft.trim();
    if (!question || isSending) return;
    await sendQuestion({ question });
  };

  const handleNewChat = () => {
    if (isVoicePressingRef.current || shouldKeepListeningRef.current || isVoiceActive) {
      stopVoiceRecognition();
    }
    setLogoState("idle");
    sessionIdRef.current = createSessionId();
    setMessages([]);
    setDraft("");
  };

  const cycleLogoState = () => {
    setLogoState((prev) => {
      if (prev === "idle") return "listening";
      if (prev === "listening") return "speaking";
      return "idle";
    });
  };

  return (
    <motion.aside
      role="dialog"
      aria-modal="true"
      aria-label={txt(lang, "Rihea AI Workspace", "Rihea AI工作台")}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      className="fixed inset-0 z-50 bg-[#f5f3ee] p-2 sm:p-4"
      style={{ background: style.bg }}
    >
      <div
        className="glass-surface glass-tier-solid mx-auto h-full w-full overflow-hidden rounded-[1.8rem] border border-sage/25"
        style={{
          "--glass-bg": "linear-gradient(165deg, rgba(251,250,247,.84), rgba(247,244,238,.78))",
          "--glass-line": style.line,
          "--glass-shadow": "0 24px 46px -32px rgba(72, 92, 84, 0.45)",
          "--glass-fallback": "rgba(251, 250, 247, 0.96)",
          "--glass-accessible": "rgba(252, 251, 248, 0.99)",
        }}
      >
        <div className="grid h-full min-h-0 lg:grid-cols-[300px_1fr]">
          <aside className="hidden h-full min-h-0 border-r border-sage/20 bg-[#f8f7f3] p-4 lg:flex lg:flex-col">
            <RiheaLogo showSubtitle />
            <button
              type="button"
              onClick={handleNewChat}
              className="glass-control mt-5 inline-flex items-center justify-center gap-2 rounded-2xl px-3 py-2 text-sm font-semibold text-clay transition"
            >
              <MessageSquarePlus className="h-4 w-4" />
              {txt(lang, "New Chat", "开启新对话")}
            </button>

            <div className="mt-5 min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
              <section>
                <p className="mb-2 text-xs font-semibold text-clay/55">{txt(lang, "Today", "今天")}</p>
                <div className="space-y-1.5">
                  {featuredPresetCards.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => sendQuestion({ question: item.userVisibleText, preset: item })}
                      className="w-full rounded-xl px-2 py-2 text-left text-sm text-clay/90 transition hover:bg-white"
                    >
                      {item.title}
                    </button>
                  ))}
                </div>
              </section>
              <section>
                <p className="mb-2 text-xs font-semibold text-clay/55">{txt(lang, "Within 30 days", "30天内")}</p>
                <div className="space-y-1.5">
                  {libraryPresetCards.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => sendQuestion({ question: item.userVisibleText, preset: item })}
                      className="w-full rounded-xl px-2 py-2 text-left text-sm text-clay/88 transition hover:bg-white"
                    >
                      {item.title}
                    </button>
                  ))}
                </div>
              </section>
            </div>

            <div className="glass-subcard mt-4 rounded-2xl px-3 py-2 text-sm font-semibold text-clay">
              <span className="inline-flex items-center gap-2">
                <User className="h-4 w-4" />
                {displayName}
              </span>
            </div>
          </aside>

          <section className="flex h-full min-h-0 flex-col bg-[#fbfaf7]/90">
            <header className="flex items-center justify-between border-b border-sage/20 px-4 py-3 lg:px-8">
              <div className="shrink-0 lg:hidden">
                <RiheaLogo compact />
              </div>
              <div className="min-w-0 flex-1 px-2 text-center lg:px-4">
                <p className="truncate text-xs font-semibold text-clay/78">{hiLabel}</p>
                <p className="text-xs font-semibold text-clay/60">{txt(lang, "Rihea AI Workspace", "Rihea AI工作台")}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleNewChat}
                  className="glass-control inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold text-clay transition"
                >
                  <MessageSquarePlus className="h-3.5 w-3.5" />
                  {txt(lang, "New", "新对话")}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label={txt(lang, "Close chat", "关闭聊天")}
                  className="glass-control grid h-9 w-9 place-items-center rounded-full text-clay"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </header>

            <div
              ref={messageScrollRef}
              onScroll={updateAutoScrollState}
              className="min-h-0 flex-1 overflow-y-auto px-4 py-6 lg:px-10"
            >
              {messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <RiheaLogo
                    animated
                    aiState={logoState}
                    onClick={cycleLogoState}
                    className="mb-4"
                    showSubtitle
                  />
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-sage/20 bg-white px-3 py-1 text-xs font-semibold text-clay/75">
                    <Sparkles className="h-3.5 w-3.5" />
                    {txt(lang, "Pregnancy emotional support AI", "孕期情绪支持AI")}
                  </div>
                  <h2 className="font-heading text-3xl font-bold text-clay lg:text-4xl">
                    {txt(lang, "How can I help you today?", "今天有什么可以帮到你？")}
                  </h2>
                  <p className="mt-3 max-w-xl text-sm text-clay/75 lg:text-base">
                    {txt(
                      lang,
                      "Tell me your current mood, sleep quality, or concerns. I will provide warm, actionable guidance.",
                      "告诉我你现在的情绪、睡眠或担忧，我会给你温和且可执行的建议。"
                    )}
                  </p>
                </div>
              ) : (
                <div className="chat-thread mx-auto max-w-3xl space-y-4 pb-3">
                  {messages.map((msg, idx) => (
                    <motion.div
                      key={msg?.id || `${msg.role}-${idx}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.22, ease: "easeOut" }}
                      className={msg.role === "assistant" ? "" : "flex justify-end"}
                    >
                      {msg.role === "assistant" ? (
                        <div
                          className={`chat-bubble chat-bubble-assistant w-full max-w-[94%] rounded-[1.6rem] border px-4 py-3.5 text-sm text-clay ${
                            msg?.displayVariant === "typing"
                              ? "border-sage/20 bg-[#f4f0e9]"
                              : msg?.displayVariant === "error"
                                ? "border-[#e7c6d6] bg-[#fff4f8]"
                                : "border-sage/15 bg-[#f2efe7]"
                          }`}
                        >
                          <div className="mb-3 flex items-center justify-between gap-3">
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-clay/55">
                              <Bot className="h-3 w-3" />
                              RIHEA AI
                            </span>
                            {msg?.status === "pending" ? (
                              <span className="chat-status-pill">
                                {txt(lang, "Drafting", "生成中")}
                              </span>
                            ) : null}
                          </div>

                          {msg?.displayVariant === "typing" ? (
                            <div className="space-y-3">
                              <p className="text-sm font-semibold text-clay/90">{msg?.waitingLabel}</p>
                              <div className="inline-flex items-center gap-3 rounded-full border border-sage/20 bg-white/75 px-3 py-2 text-xs font-semibold text-clay/72">
                                <span className="typing-dots" aria-hidden="true">
                                  <span />
                                  <span />
                                  <span />
                                </span>
                                <span>{msg?.waitingHint}</span>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <div className="chat-answer whitespace-pre-wrap">
                                {String(msg?.answerRaw || msg?.text || msg?.fallbackText || "")}
                              </div>

                              {msg?.reasoningSummary && (
                                <div className="flex flex-wrap gap-1.5">
                                  <span className="rounded-full border border-sage/20 bg-white/78 px-2 py-1 text-[10px] font-semibold text-clay/75">
                                    {msg?.reasoningSummary?.generation?.generation_source === "llm"
                                      ? txt(lang, "LLM generated", "LLM生成")
                                      : txt(lang, "Template fallback", "模板降级")}
                                  </span>
                                  <span className="rounded-full border border-sage/20 bg-white/78 px-2 py-1 text-[10px] font-semibold text-clay/75">
                                    {Number(msg?.reasoningSummary?.retrieval?.kb_hit_count || 0) > 0
                                      ? txt(lang, "KB hit", "KB命中")
                                      : txt(lang, "KB miss", "KB缺失")}
                                  </span>
                                  <span className="rounded-full border border-sage/20 bg-white/78 px-2 py-1 text-[10px] font-semibold text-clay/75">
                                    {msg?.reasoningSummary?.retrieval?.web_used
                                      ? txt(lang, "Web used", "Web已用")
                                      : txt(lang, "Web not used", "Web未用")}
                                  </span>
                                </div>
                              )}

                              {msg?.escalation?.required && Array.isArray(msg?.escalation?.actions) && msg.escalation.actions.length > 0 && (
                                <div className="rounded-xl border border-[#e4bfd0] bg-[#fff4f7] px-3 py-2.5">
                                  <p className="text-xs font-semibold text-[#7b4f63]">
                                    {txt(lang, "Immediate safety actions", "请优先执行安全动作")}
                                  </p>
                                  <ol className="mt-1.5 list-decimal space-y-1.5 pl-4 text-xs leading-5 text-[#7b4f63]">
                                    {msg.escalation.actions.map((item, actionIndex) => (
                                      <li key={`${idx}-safe-${actionIndex}`}>{item}</li>
                                    ))}
                                  </ol>
                                </div>
                              )}

                              {Array.isArray(msg?.nextActions) && msg.nextActions.length > 0 && (
                                <div className="rounded-xl border border-sage/20 bg-[#fbfaf7] px-3 py-2.5">
                                  <p className="text-xs font-semibold text-clay/75">{txt(lang, "Suggested next steps", "建议下一步")}</p>
                                  <ol className="mt-1.5 list-decimal space-y-1.5 pl-4 text-xs leading-5 text-clay/85">
                                    {msg.nextActions.map((item, actionIndex) => (
                                      <li key={`${idx}-next-${actionIndex}`}>{item}</li>
                                    ))}
                                  </ol>
                                </div>
                              )}

                              {hasReasoningContent(msg?.reasoningSummary) && (
                                <details className="rounded-xl border border-sage/20 bg-white/72 px-3 py-2.5">
                                  <summary className="cursor-pointer text-xs font-semibold text-clay/75">
                                    {txt(lang, "Reasoning Summary", "思考过程摘要")}
                                  </summary>
                                  <div className="mt-2.5 space-y-2 text-xs leading-5 text-clay/85">
                                    {msg?.reasoningSummary?.intent && (
                                      <p>
                                        {txt(lang, "Intent", "意图")}：
                                        {`${msg.reasoningSummary.intent.primary || "unknown"} · ${txt(lang, "confidence", "置信度")} ${Number(msg.reasoningSummary.intent.confidence || 0).toFixed(2)}`}
                                      </p>
                                    )}
                                    {msg?.reasoningSummary?.safety && (
                                      <p>
                                        {txt(lang, "Safety", "安全")}：
                                        {`${msg.reasoningSummary.safety.risk_level || "R0"} · ${msg.reasoningSummary.safety.escalation_required ? txt(lang, "escalation", "升级") : txt(lang, "normal", "常规")}`}
                                      </p>
                                    )}
                                    {msg?.reasoningSummary?.retrieval && (
                                      <p>
                                        {txt(lang, "Retrieval", "检索")}：
                                        {`KB ${msg.reasoningSummary.retrieval.kb_hit_count || 0} · ${msg.reasoningSummary.retrieval.web_used ? txt(lang, "Web used", "已联网") : txt(lang, "Web not used", "未联网")}`}
                                      </p>
                                    )}
                                    {msg?.reasoningSummary?.generation && (
                                      <p>
                                        {txt(lang, "Generation", "生成")}：
                                        {`${msg.reasoningSummary.generation.generation_source || "unknown"} · ${msg.reasoningSummary.generation.model_used || "n/a"}`}
                                      </p>
                                    )}
                                  </div>
                                </details>
                              )}

                              {Array.isArray(msg?.sources) && msg.sources.length > 0 && (!Array.isArray(msg?.citations) || msg.citations.length === 0) && (
                                <div className="rounded-xl border border-sage/20 bg-white/72 px-3 py-2.5">
                                  <p className="text-xs font-semibold text-clay/75">{txt(lang, "Web Sources", "联网来源")}</p>
                                  <ul className="mt-2 space-y-2">
                                    {msg.sources.map((item, sourceIndex) => (
                                      <li key={`${idx}-source-${sourceIndex}`} className="text-xs">
                                        <a
                                          href={item?.url}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="font-semibold text-[#4d6d83] hover:underline"
                                        >
                                          {item?.title || item?.url}
                                        </a>
                                        <p className="mt-0.5 leading-5 text-clay/70">{item?.snippet || item?.domain}</p>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {Array.isArray(msg?.citations) && msg.citations.length > 0 && (
                                <div className="rounded-xl border border-sage/20 bg-white/72 px-3 py-2.5">
                                  <p className="text-xs font-semibold text-clay/75">{txt(lang, "Knowledge Sources", "知识来源")}</p>
                                  <ul className="mt-2 space-y-2">
                                    {msg.citations.map((item, sourceIndex) => (
                                      <li key={`${idx}-citation-${sourceIndex}`} className="text-xs text-clay/80">
                                        <a
                                          href={item?.url}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="font-semibold text-[#4d6d83] hover:underline"
                                        >
                                          {item?.title || item?.url}
                                        </a>
                                        <p className="mt-0.5 leading-5 text-clay/70">{item?.snippet || item?.source_type}</p>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {Array.isArray(msg?.relatedQuestionCards) && msg.relatedQuestionCards.length > 0 && (
                                <div className="rounded-xl border border-sage/20 bg-white/72 px-3 py-2.5">
                                  <p className="text-xs font-semibold text-clay/75">{txt(lang, "Related Questions", "相关问题")}</p>
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    {msg.relatedQuestionCards.slice(0, 4).map((item) => (
                                      <button
                                        key={`${idx}-related-${item.id}`}
                                        type="button"
                                        onClick={() => sendQuestion({ question: item.userVisibleText, preset: item })}
                                        className="rounded-full border border-sage/20 bg-white px-3 py-1 text-xs font-semibold text-clay/80 transition hover:bg-[#f7f4ee]"
                                      >
                                        {item?.title || item?.userVisibleText}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {msg?.disclaimer && (
                                <p className="rounded-xl bg-white/46 px-3 py-2 text-[11px] leading-5 text-clay/65">{msg.disclaimer}</p>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="chat-bubble chat-bubble-user max-w-[92%] rounded-[1.5rem] border border-[#e4bfd0] bg-[#ecd3de] px-4 py-3 text-sm leading-7 text-[#5f4652] shadow-[0_14px_26px_-22px_rgba(95,70,82,0.55)]">
                          <p className="whitespace-pre-wrap">{msg.text}</p>
                        </div>
                      )}
                    </motion.div>
                  ))}
                  <div ref={bottomAnchorRef} aria-hidden="true" />
                </div>
              )}
            </div>

            <div className="border-t border-sage/20 bg-[#fbfaf7] px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 lg:px-10 lg:pb-5">
              <div
                className="glass-surface glass-tier-soft mx-auto max-w-3xl rounded-[1.7rem] p-3 shadow-soft"
                style={{
                  "--glass-bg": "rgba(255, 255, 255, 0.74)",
                  "--glass-line": style.line,
                  "--glass-shadow": "0 14px 24px -20px rgba(81, 97, 88, 0.44)",
                  "--glass-fallback": "rgba(255,255,255,0.94)",
                  "--glass-accessible": "rgba(255,255,255,0.98)",
                }}
              >
                <div className="flex items-end gap-2">
                  <textarea
                    ref={inputRef}
                    value={draft}
                    disabled={isSending}
                    rows={1}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      const composing = e.nativeEvent?.isComposing || e.keyCode === 229;
                      if (e.key === "Enter" && !e.shiftKey && !composing) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    className="glass-input max-h-40 min-h-[44px] flex-1 resize-none rounded-2xl px-3 py-2.5 text-sm text-clay outline-none"
                    placeholder={txt(lang, "Send a message to Rihea AI", "给 Rihea AI 发送消息")}
                  />

                  <button
                    type="button"
                    aria-label={txt(lang, "Voice input", "语音输入")}
                    aria-pressed={voiceButtonActive}
                    onPointerDown={beginVoiceHold}
                    onPointerUp={endVoiceHold}
                    onPointerCancel={endVoiceHold}
                    onPointerLeave={(event) => {
                      if (isVoicePressingRef.current) {
                        endVoiceHold(event);
                      }
                    }}
                    onKeyDown={handleVoiceKeyDown}
                    onKeyUp={handleVoiceKeyUp}
                    onContextMenu={(event) => event.preventDefault()}
                    className={`inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition ${
                      voiceButtonActive ? "shadow-md" : ""
                    }`}
                    style={
                      voiceButtonActive
                        ? {
                            backgroundColor: style.primaryBg,
                            borderColor: style.primaryBg,
                            color: style.primaryText,
                            touchAction: "none",
                          }
                        : {
                            backgroundColor: "#f7ecf2",
                            borderColor: "#e7c6d6",
                            color: "#5f4652",
                            touchAction: "none",
                          }
                    }
                  >
                    <Mic className={`h-4 w-4 ${voiceButtonActive ? "animate-pulse" : ""}`} />
                    <span className="whitespace-nowrap">{voiceActionText}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSend}
                    aria-label={txt(lang, "Send message", "发送消息")}
                    disabled={isSending}
                    className={`grid h-10 w-10 shrink-0 place-items-center rounded-full transition hover:brightness-95 ${
                      isSending ? "opacity-60" : ""
                    }`}
                    style={{ backgroundColor: style.primaryBg, color: style.primaryText }}
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex min-w-[220px] flex-wrap items-center gap-2">
                    <label
                      htmlFor="chat-model-select"
                      className="inline-flex items-center gap-1 rounded-full border border-sage/25 bg-white px-3 py-1.5 text-xs font-semibold text-clay/80"
                    >
                      <Brain className="h-3.5 w-3.5" />
                      {txt(lang, "Model", "模型")}
                    </label>
                    <select
                      id="chat-model-select"
                      value={selectedModelKey}
                      onChange={(event) => setSelectedModelKey(event.target.value)}
                      className="glass-control min-w-[190px] rounded-full border border-sage/25 bg-white px-3 py-1.5 text-xs font-semibold text-clay outline-none transition"
                      title={txt(lang, "Select model", "选择模型")}
                    >
                      {MODEL_OPTIONS.map((item) => (
                        <option key={item.key} value={item.key}>
                          {lang === "en" ? item.en : item.zh}
                        </option>
                      ))}
                    </select>
                    <span className="text-xs font-semibold text-clay/55">
                      {txt(lang, "Current", "当前")}: {selectedModelLabel}
                    </span>
                  </div>

                  {isVoiceActive ? (
                    <div className="inline-flex items-center gap-2 rounded-full border border-[#e7c6d6] bg-[#fff4f8] px-3 py-1 text-xs font-semibold text-[#5f4652]">
                      <span className="voice-wave" aria-hidden="true">
                        <span />
                        <span />
                        <span />
                        <span />
                      </span>
                      <span>{txt(lang, "Recording", "录音中")} {voiceDurationLabel}</span>
                    </div>
                  ) : (
                    <p className="text-xs font-semibold text-clay/65">{voiceHint}</p>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </motion.aside>
  );
}
