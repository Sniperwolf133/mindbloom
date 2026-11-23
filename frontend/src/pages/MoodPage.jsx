import { useEffect, useState } from "react";
import {
  BarChart3,
  Heart,
  Info,
  SmilePlus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { api } from "../api/client";
import MoodTrendChart from "../components/MoodTrendChart";
import { useAuth } from "../context/AuthContext";

const MOODS = [
  {
    value: "Happy",
    emoji: "😊",
    desc: "Bright, glad, or energized",
    bg: "bg-mint-50 border-mint-200 text-mint-600",
    active: "bg-mint-500 text-white border-mint-500 shadow-sm",
  },
  {
    value: "Calm",
    emoji: "🌿",
    desc: "Peaceful, steady, grounded",
    bg: "bg-skysoft-50 border-skysoft-200 text-skysoft-500",
    active: "bg-skysoft-500 text-white border-skysoft-500 shadow-sm",
  },
  {
    value: "Okay",
    emoji: "☁️",
    desc: "Neutral, getting through the day",
    bg: "bg-lavender-50 border-lavender-200 text-lavender-600",
    active: "bg-lavender-500 text-white border-lavender-500 shadow-sm",
  },
  {
    value: "Stressed",
    emoji: "😣",
    desc: "Tense, pressured, deadlines piling up",
    bg: "bg-peach-50 border-peach-200 text-peach-500",
    active: "bg-peach-500 text-white border-peach-500 shadow-sm",
  },
  {
    value: "Sad",
    emoji: "🌧️",
    desc: "Low, lonely, or heavy-hearted",
    bg: "bg-slate-50 border-slate-200 text-slate-600",
    active: "bg-slate-600 text-white border-slate-600 shadow-sm",
  },
  {
    value: "Overwhelmed",
    emoji: "🫧",
    desc: "Too much at once, needing gentle space",
    bg: "bg-rose-50 border-rose-200 text-rose-600",
    active: "bg-rose-500 text-white border-rose-500 shadow-sm",
  },
];

export default function MoodPage() {
  const { refreshPet } = useAuth();
  const [selectedMood, setSelectedMood] = useState("Calm");
  const [journal, setJournal] = useState("");
  const [history, setHistory] = useState(null);
  const [saving, setSaving] = useState(false);
  const [latestResponse, setLatestResponse] = useState(null);
  const [error, setError] = useState("");

  const loadHistory = async () => {
    try {
      const data = await api.getMoodHistory(40);
      setHistory(data);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await api.recordMood({
        mood: selectedMood,
        journal: journal.trim() || null,
      });
      setLatestResponse(res);
      setJournal("");
      await Promise.all([loadHistory(), refreshPet()]);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEntry = async (id) => {
    try {
      await api.deleteMoodEntry(id);
      await loadHistory();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm("Delete all saved mood check-ins and journal entries?")) return;
    try {
      await api.clearMoodHistory();
      setLatestResponse(null);
      await loadHistory();
    } catch (err) {
      setError(err.message);
    }
  };

  const maxCount = Math.max(
    1,
    ...Object.values(history?.mood_counts || { Calm: 1 })
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-plum-900">
            Daily Mood Tracker
          </h1>
          <p className="text-sm text-plum-700 mt-1">
            Notice how you’re feeling without judgment. Your journal entries stay strictly private.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-skysoft-50 border border-skysoft-100 px-4 py-2 text-xs font-semibold text-plum-700">
          <Info className="w-4 h-4 text-skysoft-500" />
          Self-reflection only — never used for diagnosis
        </div>
      </div>

      {error && (
        <div className="rounded-2xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* Check-in Form + Latest Suggestion */}
      <div className="grid lg:grid-cols-12 gap-6">
        <form
          onSubmit={handleSave}
          className="lg:col-span-7 rounded-3xl bg-white/90 border border-lavender-100 shadow-cozy p-6 space-y-5"
        >
          <div className="flex items-center gap-2">
            <SmilePlus className="w-5 h-5 text-lavender-500" />
            <h2 className="font-display text-xl font-bold text-plum-900">
              New Mood Check-In
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {MOODS.map((m) => {
              const isSelected = selectedMood === m.value;
              return (
                <button
                  type="button"
                  key={m.value}
                  onClick={() => setSelectedMood(m.value)}
                  className={`rounded-2xl border p-3.5 text-left transition ${
                    isSelected ? m.active : `${m.bg} hover:scale-[1.01]`
                  }`}
                >
                  <div className="text-xl mb-1">{m.emoji}</div>
                  <div className="text-sm font-bold">{m.value}</div>
                  <div
                    className={`text-[11px] mt-0.5 ${
                      isSelected ? "text-white/90" : "opacity-80"
                    }`}
                  >
                    {m.desc}
                  </div>
                </button>
              );
            })}
          </div>

          <div>
            <label className="block text-xs font-bold text-plum-800 mb-1.5">
              Optional Private Journal Reflection
            </label>
            <textarea
              rows={3}
              value={journal}
              onChange={(e) => setJournal(e.target.value)}
              placeholder="Write whatever feels helpful — an exam coming up, a small win, or how your energy feels..."
              className="w-full rounded-2xl border border-lavender-200 bg-cream-50/50 p-4 text-sm focus:outline-none focus:ring-2 focus:ring-lavender-400"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-lavender-500 hover:bg-lavender-600 text-white px-7 py-3 text-sm font-bold shadow-sm transition disabled:opacity-60"
          >
            <Heart className="w-4 h-4" />
            {saving ? "Saving Check-In..." : "Save Mood & Comfort Companion"}
          </button>
        </form>

        {/* Gentle Suggestion & Distribution */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-3xl bg-gradient-to-br from-mint-50 to-lavender-50 border border-mint-100 shadow-cozy p-6">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-mint-600 mb-2">
              <Sparkles className="w-4 h-4" />
              Gentle Companion Note
            </div>
            {latestResponse ? (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-plum-900">
                  Checked in as <span className="text-lavender-600">{latestResponse.mood}</span>
                </p>
                <p className="text-sm text-plum-800 leading-relaxed">
                  {latestResponse.suggestion}
                </p>
                {latestResponse.pet_reaction && (
                  <p className="text-xs font-medium text-mint-600 bg-white/80 rounded-2xl px-3.5 py-2.5">
                    🐾 {latestResponse.pet_reaction}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-plum-700 leading-relaxed">
                Select how you feel and save a check-in to receive a tailored, low-pressure
                wellness suggestion and affectionate pet reaction.
              </p>
            )}
          </div>

          {/* Mood Distribution */}
          <div className="rounded-3xl bg-white/90 border border-lavender-100 shadow-cozy p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-lavender-500" />
              <h3 className="font-display text-lg font-bold text-plum-900">
                Mood Mix
              </h3>
            </div>
            <div className="space-y-2.5">
              {MOODS.map((m) => {
                const count = history?.mood_counts?.[m.value] || 0;
                const pct = Math.round((count / maxCount) * 100);
                return (
                  <div key={m.value} className="flex items-center gap-3 text-xs">
                    <span className="w-24 font-semibold text-plum-800 truncate">
                      {m.emoji} {m.value}
                    </span>
                    <div className="flex-1 h-2.5 rounded-full bg-cream-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-lavender-400 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-6 text-right font-bold text-plum-700">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Mood Trend Chart */}
      <div className="rounded-3xl bg-white/90 border border-lavender-100 shadow-cozy p-6">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="font-display text-xl font-bold text-plum-900">
              Mood Trends Over Time
            </h2>
            <p className="text-xs text-plum-700">
              Daily gentle overview (1 = Overwhelmed, 5 = Happy)
            </p>
          </div>
          <span className="text-xs font-semibold text-plum-700 bg-lavender-50 px-3 py-1 rounded-full">
            {history?.total_entries || 0} total check-ins
          </span>
        </div>
        <MoodTrendChart trends={history?.trends || []} />
      </div>

      {/* Mood History List */}
      <div className="rounded-3xl bg-white/90 border border-lavender-100 shadow-cozy p-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="font-display text-xl font-bold text-plum-900">
            Previous Check-Ins
          </h2>
          {history?.entries?.length > 0 && (
            <button
              onClick={handleClearAll}
              className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 hover:bg-rose-100 px-3.5 py-1.5 text-xs font-bold text-rose-700 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear Mood History
            </button>
          )}
        </div>

        {!history?.entries?.length ? (
          <p className="text-sm text-plum-700">
            No mood entries recorded yet. Your private history will appear here.
          </p>
        ) : (
          <div className="space-y-3">
            {history.entries.map((entry) => (
              <div
                key={entry.id}
                className="rounded-2xl border border-lavender-100 bg-cream-50/70 p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3"
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-3 py-0.5 rounded-full bg-lavender-100 text-lavender-600 text-xs font-bold">
                      {entry.mood}
                    </span>
                    <span className="text-xs text-plum-700/75">
                      {new Date(entry.created_at).toLocaleString()}
                    </span>
                  </div>
                  {entry.journal && (
                    <p className="text-sm text-plum-900 bg-white rounded-xl px-3.5 py-2 border border-lavender-100">
                      {entry.journal}
                    </p>
                  )}
                  <p className="text-xs text-plum-700 italic">{entry.suggestion}</p>
                </div>

                <button
                  onClick={() => handleDeleteEntry(entry.id)}
                  title="Delete this entry"
                  className="self-start p-2 rounded-xl text-plum-700/70 hover:bg-rose-50 hover:text-rose-600 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

