import { useEffect, useState } from "react";
import { ShieldCheck, Trash2, X, CheckCircle2 } from "lucide-react";
import { api } from "../api/client";

export default function PrivacyModal({ open, onClose }) {
  const [summary, setSummary] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  const loadSummary = async () => {
    try {
      const data = await api.privacySummary();
      setSummary(data);
    } catch {
      // Ignore if unauthenticated
    }
  };

  useEffect(() => {
    if (open) {
      setNotice("");
      loadSummary();
    }
  }, [open]);

  if (!open) return null;

  const handleClearChats = async () => {
    setBusy(true);
    try {
      await api.clearChatHistory();
      setNotice("Your conversation history has been cleared.");
      await loadSummary();
    } catch (err) {
      setNotice(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleClearMoods = async () => {
    setBusy(true);
    try {
      await api.clearMoodHistory();
      setNotice("Your mood entries and journals have been cleared.");
      await loadSummary();
    } catch (err) {
      setNotice(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm("Remove all your mood logs, chats, and activity completions?")) {
      return;
    }
    setBusy(true);
    try {
      await api.deleteAllMyData();
      setNotice("All personal wellness records have been permanently deleted.");
      await loadSummary();
    } catch (err) {
      setNotice(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-plum-900/35 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-3xl bg-cream-50 border border-lavender-200 shadow-cozy-lg p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-mint-100 text-mint-600 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-plum-900">Your Privacy & Data Controls</h2>
              <p className="text-xs text-plum-700">
                Everything you share stays private to your space.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-lavender-100 text-plum-700 transition"
            aria-label="Close privacy dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {notice && (
          <div className="mt-4 flex items-center gap-2 rounded-2xl bg-mint-100 text-mint-600 px-4 py-2.5 text-sm font-medium">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{notice}</span>
          </div>
        )}

        {summary && (
          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-2xl bg-lavender-50 p-3 border border-lavender-100">
              <div className="text-lg font-bold text-plum-900">
                {summary.stored_counts.mood_entries}
              </div>
              <div className="text-xs text-plum-700">Mood Entries</div>
            </div>
            <div className="rounded-2xl bg-skysoft-50 p-3 border border-skysoft-100">
              <div className="text-lg font-bold text-plum-900">
                {summary.stored_counts.chat_messages}
              </div>
              <div className="text-xs text-plum-700">Chat Messages</div>
            </div>
            <div className="rounded-2xl bg-mint-50 p-3 border border-mint-100">
              <div className="text-lg font-bold text-plum-900">
                {summary.stored_counts.wellness_completions}
              </div>
              <div className="text-xs text-plum-700">Activities Done</div>
            </div>
          </div>
        )}

        <ul className="mt-4 space-y-2 text-xs text-plum-700 bg-white/80 rounded-2xl p-4 border border-lavender-100">
          {(summary?.commitments || [
            "Minimal data collection — only what you choose to log.",
            "Private isolation — journal entries are never shared with other students.",
            "Non-clinical tool — MindMate supports everyday wellness, never diagnoses.",
          ]).map((item, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="text-mint-500 font-bold">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <div className="mt-5 space-y-2.5">
          <div className="grid grid-cols-2 gap-2.5">
            <button
              disabled={busy}
              onClick={handleClearChats}
              className="flex items-center justify-center gap-2 rounded-2xl border border-lavender-200 bg-white px-3 py-2.5 text-xs font-semibold text-plum-800 hover:bg-lavender-50 transition disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5 text-lavender-600" />
              Clear Chat History
            </button>
            <button
              disabled={busy}
              onClick={handleClearMoods}
              className="flex items-center justify-center gap-2 rounded-2xl border border-lavender-200 bg-white px-3 py-2.5 text-xs font-semibold text-plum-800 hover:bg-lavender-50 transition disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5 text-peach-500" />
              Clear Mood History
            </button>
          </div>
          <button
            disabled={busy}
            onClick={handleDeleteAll}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-rose-50 border border-rose-200 px-4 py-2.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete All My Wellness History
          </button>
        </div>
      </div>
    </div>
  );
}

