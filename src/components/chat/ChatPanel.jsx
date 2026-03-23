import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Bot, Brain, Globe, MessageSquarePlus, Mic, Send, Sparkles, User, X } from "lucide-react";
import { txt } from "../../utils/txt";
import RiheaLogo from "../brand/RiheaLogo";

export default function ChatPanel({
  lang,
  style,
  userName = "",
  initialDraft = "",
  messages = [],
  setMessages = () => {},
  onClose,
  inputRef,
}) {
  const [draft, setDraft] = useState(initialDraft);
  const [toolMode, setToolMode] = useState("deep");
  const [logoState, setLogoState] = useState("idle");
  const [isVoicePressing, setIsVoicePressing] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState("idle");
  const [voiceElapsedMs, setVoiceElapsedMs] = useState(0);
  const recognitionRef = useRef(null);
  const holdTimerRef = useRef(null);
  const shouldKeepListeningRef = useRef(false);
  const isVoicePressingRef = useRef(false);
  const baseDraftRef = useRef("");
  const finalTranscriptRef = useRef("");
  const voiceStartedAtRef = useRef(0);
  const voiceElapsedTimerRef = useRef(null);
  const displayName = userName || txt(lang, "Mama", "准妈妈");
  const hiLabel = lang === "zh" ? `你好，${displayName}` : `Hi, ${displayName}`;

  const todayItems = useMemo(
    () =>
      lang === "zh"
        ? ["孕晚期心态稳定方法", "孕期夜间焦虑怎么缓解", "如何和伴侣沟通支持需求"]
        : ["Late-pregnancy emotional stability", "How to ease night anxiety", "How to ask partner support clearly"],
    [lang]
  );
  const monthlyItems = useMemo(
    () =>
      lang === "zh"
        ? ["正念练习多久有效", "睡眠与压力关系图解", "何时寻求专业帮助"]
        : ["How fast mindfulness helps", "Sleep-stress relation guide", "When to seek professional help"],
    [lang]
  );

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

  const handleSend = () => {
    const question = draft.trim();
    if (!question) return;
    if (isVoicePressingRef.current || shouldKeepListeningRef.current || isVoiceActive) {
      stopVoiceRecognition();
    }
    setLogoState("speaking");
    setMessages((prev) => [
      ...prev,
      { role: "user", text: question },
      {
        role: "assistant",
        text: txt(
          lang,
          "Model API will be connected here soon. Your question has been saved.",
          "大模型接口即将接入，已记录你的问题。"
        ),
      },
    ]);
    setDraft("");
  };

  const handleNewChat = () => {
    if (isVoicePressingRef.current || shouldKeepListeningRef.current || isVoiceActive) {
      stopVoiceRecognition();
    }
    setLogoState("idle");
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
                  {todayItems.map((item) => (
                    <button
                      key={item}
                      type="button"
                      className="w-full rounded-xl px-2 py-2 text-left text-sm text-clay/90 transition hover:bg-white"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </section>
              <section>
                <p className="mb-2 text-xs font-semibold text-clay/55">{txt(lang, "Within 30 days", "30天内")}</p>
                <div className="space-y-1.5">
                  {monthlyItems.map((item) => (
                    <button
                      key={item}
                      type="button"
                      className="w-full rounded-xl px-2 py-2 text-left text-sm text-clay/88 transition hover:bg-white"
                    >
                      {item}
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

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 lg:px-10">
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
                <div className="mx-auto max-w-3xl space-y-4">
                  {messages.map((msg, idx) => (
                    <div key={`${msg.role}-${idx}`} className={msg.role === "assistant" ? "" : "flex justify-end"}>
                      <div
                        className={`max-w-[92%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                          msg.role === "assistant"
                            ? "bg-[#f2efe7] text-clay border border-sage/15"
                            : "bg-[#ecd3de] text-[#5f4652] border border-[#e4bfd0]"
                        }`}
                      >
                        {msg.role === "assistant" && (
                          <span className="mb-1 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-clay/55">
                            <Bot className="h-3 w-3" />
                            RIHEA AI
                          </span>
                        )}
                        <p>{msg.text}</p>
                      </div>
                    </div>
                  ))}
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
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-full transition hover:brightness-95"
                    style={{ backgroundColor: style.primaryBg, color: style.primaryText }}
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setToolMode("deep")}
                      className="glass-control inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold transition"
                      style={
                        toolMode === "deep"
                          ? { borderColor: style.primaryBg, backgroundColor: "#f7ecf2", color: "#5f4652" }
                          : { borderColor: "rgba(156,176,163,.3)", backgroundColor: "#fff", color: "#6E7F75" }
                      }
                    >
                      <Brain className="h-3.5 w-3.5" />
                      {txt(lang, "Deep Thinking", "深度思考")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setToolMode("web")}
                      className="glass-control inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold transition"
                      style={
                        toolMode === "web"
                          ? { borderColor: style.primaryBg, backgroundColor: "#f7ecf2", color: "#5f4652" }
                          : { borderColor: "rgba(156,176,163,.3)", backgroundColor: "#fff", color: "#6E7F75" }
                      }
                    >
                      <Globe className="h-3.5 w-3.5" />
                      {txt(lang, "Web Search", "联网搜索")}
                    </button>
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
