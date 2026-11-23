import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  BookOpenCheck,
  Database,
  MessageCircleHeart,
  PhoneCall,
  Send,
  Sparkles,
  Trash2,
} from "lucide-react";
import { api } from "../api/client";
import PetAvatar from "../components/PetAvatar";
import { useAuth } from "../context/AuthContext";

const STARTER_PROMPTS = [
  "I feel really overwhelmed about my upcoming exams.",
  "I've been studying for hours and feel burned out.",
  "I feel lonely on campus lately and could use some encouragement.",
  "Can you guide me through a quick breathing or grounding exercise?",
];

export default function ChatPage() {
  const { pet } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [useRag, setUseRag] = useState(true);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastSuggestedActivity, setLastSuggestedActivity] = useState(null);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await api.getChatHistory();
      setMessages(data.messages || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const handleSend = async (textOverride) => {
    const text = (textOverride ?? input).trim();
    if (!text || sending) return;

    setError("");
    if (!textOverride) setInput("");
    const optimisticUserMsg = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: text,
      sources: [],
      guidance_type: "general_only",
      is_crisis: false,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticUserMsg]);
    setSending(true);

    try {
      const res = await api.sendChat({ message: text, use_rag: useRag });
      const assistantMsg = {
        id: res.id,
        role: "assistant",
        content: res.reply,
        sources: res.sources || [],
        guidance_type: res.guidance_type,
        is_crisis: res.is_crisis,
        llm_mode: res.llm_mode,
        created_at: res.created_at,
      };
      setMessages((prev) => [...prev, assistantMsg]);
      if (res.suggested_activity_id) {
        setLastSuggestedActivity({
          id: res.suggested_activity_id,
          title: res.suggested_activity_title,
        });
      } else {
        setLastSuggestedActivity(null);
      }
    } catch (err) {
      setError(err.message || "Could not send message.");
    } finally {
      setSending(false);
    }
  };

  const handleClear = async () => {
    if (!messages.length) return;
    if (!window.confirm("Clear your entire conversation history with MindMate?")) return;
    try {
      await api.clearChatHistory();
      setMessages([]);
      setLastSuggestedActivity(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const hasCrisis = messages.some((m) => m.is_crisis);

  return (
    <div className="flex flex-col h-[calc(100vh-7.5rem)] lg:h-[calc(100vh-4rem)] rounded-3xl bg-white/90 border border-lavender-100 shadow-cozy overflow-hidden">
      {/* Chat Header */}
      <div className="px-5 py-4 border-b border-lavender-100 bg-gradient-to-r from-lavender-50/90 to-mint-50/70 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <PetAvatar
            species={pet?.species || "cat"}
            colorTheme={pet?.color_theme || "lavender"}
            mood={pet?.mood || "calm"}
            accessory={pet?.equipped_accessory || "sprout"}
            stage={pet?.stage || 1}
            size={50}
            interactive={false}
          />
          <div>
            <h1 className="font-display text-lg font-extrabold text-plum-900 flex items-center gap-2">
              MindMate AI Companion
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white text-lavender-600 border border-lavender-100">
                Supportive Chat
              </span>
            </h1>
            <p className="text-xs text-plum-700">
              Here to listen gently with {pet?.name || "your companion"} • Not a medical or clinical service
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setUseRag(!useRag)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold border transition ${
              useRag
                ? "bg-mint-100 border-mint-200 text-mint-600"
                : "bg-white border-lavender-200 text-plum-700"
            }`}
            title="Toggle grounding responses in uploaded wellness PDF guides"
          >
            <Database className="w-3.5 h-3.5" />
            RAG Guides: {useRag ? "On" : "Off"}
          </button>

          <button
            type="button"
            onClick={handleClear}
            disabled={!messages.length}
            className="inline-flex items-center gap-1.5 rounded-full bg-white hover:bg-rose-50 border border-lavender-200 px-3.5 py-1.5 text-xs font-bold text-plum-700 hover:text-rose-600 transition disabled:opacity-40"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear Chat
          </button>
        </div>
      </div>

      {/* Crisis Support Banner if triggered */}
      {hasCrisis && (
        <div className="px-5 py-3 bg-rose-50 border-b border-rose-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-rose-800 text-xs sm:text-sm font-semibold">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>
              Your safety matters. Support is available 24/7: Call or text <strong>988</strong> (US/Canada), text{" "}
              <strong>HOME to 741741</strong>, or contact local emergency services.
            </span>
          </div>
          <a
            href="https://findahelpline.com/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full bg-rose-600 text-white px-3.5 py-1.5 text-xs font-bold hover:bg-rose-700 transition"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            Find a Helpline
          </a>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {loading ? (
          <div className="text-center text-sm text-plum-700 py-10">
            Loading your cozy conversation...
          </div>
        ) : messages.length === 0 ? (
          <div className="max-w-xl mx-auto text-center py-6 space-y-5">
            <div className="inline-flex w-14 h-14 rounded-3xl bg-lavender-100 text-lavender-600 items-center justify-center">
              <MessageCircleHeart className="w-7 h-7" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-plum-900">
                What’s on your mind today?
              </h2>
              <p className="text-sm text-plum-700 mt-1">
                Share anything from exam nerves and study burnout to friendships or just
                needing a calm breather.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-2.5 text-left">
              {STARTER_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleSend(prompt)}
                  className="rounded-2xl border border-lavender-100 bg-lavender-50/60 hover:bg-lavender-100/70 p-3.5 text-xs font-semibold text-plum-800 transition"
                >
                  “{prompt}”
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.role === "user";
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[88%] sm:max-w-[78%] rounded-3xl px-5 py-3.5 text-sm leading-relaxed whitespace-pre-wrap ${
                    isUser
                      ? "bg-lavender-500 text-white rounded-br-md shadow-sm"
                      : msg.is_crisis
                      ? "bg-rose-50 border border-rose-200 text-plum-900 rounded-bl-md"
                      : "bg-cream-100/85 border border-lavender-100 text-plum-900 rounded-bl-md"
                  }`}
                >
                  {!isUser && (
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      {msg.is_crisis ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700">
                          <AlertTriangle className="w-3 h-3" />
                          Safety & Crisis Support
                        </span>
                      ) : msg.guidance_type === "rag_and_general" ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-mint-100 text-mint-600">
                          <BookOpenCheck className="w-3 h-3" />
                          Grounded in Wellness Guides + AI Guidance
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-lavender-100 text-lavender-600">
                          <Sparkles className="w-3 h-3" />
                          General Companion Guidance
                        </span>
                      )}
                    </div>
                  )}

                  <div>{msg.content}</div>

                  {/* Retrieved Document Sources (Transparent Attribution) */}
                  {!isUser && msg.sources && msg.sources.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-lavender-200/70 space-y-2">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-mint-600">
                        Retrieved Wellness Document Sources
                      </p>
                      <div className="space-y-1.5">
                        {msg.sources.map((src, idx) => (
                          <div
                            key={`${src.source}-${idx}`}
                            className="rounded-xl bg-white/85 border border-mint-100 px-3 py-2 text-xs"
                          >
                            <div className="font-bold text-plum-900">
                              {src.source}
                              {src.page ? ` (Page ${src.page})` : ""}
                            </div>
                            <p className="text-[11px] text-plum-700 line-clamp-2 mt-0.5">
                              {src.excerpt}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {sending && (
          <div className="flex items-start">
            <div className="rounded-3xl rounded-bl-md bg-lavender-50 border border-lavender-100 px-5 py-3 text-sm text-plum-700 animate-pulse">
              MindMate is thinking gently with {pet?.name || "your companion"}...
            </div>
          </div>
        )}

        {lastSuggestedActivity && !sending && (
          <div className="flex items-center justify-start">
            <Link
              to={`/activities?open=${lastSuggestedActivity.id}`}
              className="inline-flex items-center gap-2 rounded-full bg-mint-100 hover:bg-mint-200/70 text-mint-600 px-4 py-2 text-xs font-bold transition"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Try Suggested Activity: {lastSuggestedActivity.title} →
            </Link>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Error & Input Form */}
      {error && (
        <div className="mx-5 mb-2 rounded-2xl bg-rose-50 border border-rose-200 px-4 py-2 text-xs text-rose-700">
          {error}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-4 border-t border-lavender-100 bg-cream-50/80 flex items-center gap-3"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Tell MindMate how your day or studies are going..."
          className="flex-1 rounded-2xl border border-lavender-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-lavender-400"
        />
        <button
          type="submit"
          disabled={!input.trim() || sending}
          className="inline-flex items-center gap-2 rounded-2xl bg-lavender-500 hover:bg-lavender-600 text-white px-5 py-3 text-sm font-bold shadow-sm transition disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline">Send</span>
        </button>
      </form>
    </div>
  );
}

