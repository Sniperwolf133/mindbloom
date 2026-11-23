import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Coffee,
  Cookie,
  Download,
  Heart,
  MessageCircleHeart,
  Moon,
  SmilePlus,
  Sparkles,
  Sun,
} from "lucide-react";
import { api } from "../api/client";
import PetAvatar from "../components/PetAvatar";
import { useAuth } from "../context/AuthContext";

const MOOD_OPTIONS = [
  { label: "Happy", emoji: "😊", pill: "bg-mint-100 text-mint-600 border-mint-200" },
  { label: "Calm", emoji: "🌿", pill: "bg-skysoft-100 text-skysoft-500 border-skysoft-200" },
  { label: "Okay", emoji: "☁️", pill: "bg-lavender-100 text-lavender-600 border-lavender-200" },
  { label: "Stressed", emoji: "😣", pill: "bg-peach-100 text-peach-500 border-peach-200" },
  { label: "Sad", emoji: "🌧️", pill: "bg-slate-100 text-slate-600 border-slate-200" },
  { label: "Overwhelmed", emoji: "🫧", pill: "bg-rose-100 text-rose-600 border-rose-200" },
];

export default function DashboardPage() {
  const { user, pet, setPet } = useAuth();
  const [moodHistory, setMoodHistory] = useState(null);
  const [progress, setProgress] = useState(null);
  const [activities, setActivities] = useState([]);
  const [checkinBusy, setCheckinBusy] = useState(false);
  const [petBusy, setPetBusy] = useState(false);
  const [checkinFeedback, setCheckinFeedback] = useState("");
  const [error, setError] = useState("");

  const loadDashboard = async () => {
    try {
      const [moodsRes, progRes, actsRes, petRes] = await Promise.all([
        api.getMoodHistory(5),
        api.getWellnessProgress(),
        api.getActivities(),
        api.getPet(),
      ]);
      setMoodHistory(moodsRes);
      setProgress(progRes);
      setActivities(actsRes);
      setPet(petRes);
    } catch (err) {
      setError(err.message || "Could not load dashboard data.");
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleQuickMood = async (moodLabel) => {
    setCheckinBusy(true);
    setCheckinFeedback("");
    try {
      const entry = await api.recordMood({ mood: moodLabel });
      setCheckinFeedback(entry.suggestion);
      await loadDashboard();
    } catch (err) {
      setError(err.message);
    } finally {
      setCheckinBusy(false);
    }
  };

  const handlePetAction = async (action) => {
    setPetBusy(true);
    try {
      const updated = await api.interactPet(action);
      setPet(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setPetBusy(false);
    }
  };

  const handleDownloadBadge = async () => {
    try {
      const blob = await api.downloadPetBadge();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${pet?.name || "mindmate"}-keepsake.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message);
    }
  };

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const latestMood = moodHistory?.entries?.[0];
  const dailySuggestion =
    checkinFeedback ||
    latestMood?.suggestion ||
    "Take one unhurried breath right now. Drop your shoulders and unclench your jaw — small pauses count.";

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-lavender-100/80 via-cream-100 to-mint-100/80 border border-lavender-200/70 p-6 sm:p-7 shadow-cozy flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-lavender-600 bg-white/80 px-3 py-1 rounded-full mb-2">
            <Sun className="w-3.5 h-3.5" />
            COZY CHECK-IN SPACE
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-plum-900">
            {greeting}, {user?.name?.split(" ")[0] || "friend"}!
          </h1>
          <p className="text-sm text-plum-700 mt-1">
            Take care of yourself, and {pet?.name || "your little companion"} grows right
            beside you.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <Link
            to="/chat"
            className="inline-flex items-center gap-2 rounded-full bg-lavender-500 hover:bg-lavender-600 text-white px-5 py-2.5 text-sm font-bold shadow-sm transition"
          >
            <MessageCircleHeart className="w-4 h-4" />
            Chat with MindMate
          </Link>
          <Link
            to="/activities"
            className="inline-flex items-center gap-2 rounded-full bg-white hover:bg-mint-50 border border-lavender-200 text-plum-900 px-5 py-2.5 text-sm font-bold transition"
          >
            <Sparkles className="w-4 h-4 text-mint-500" />
            Breathing & Breaks
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* Main Grid: Pet Companion + Mood & Wellness */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* Interactive Pet Companion Card */}
        <div className="lg:col-span-5 rounded-3xl bg-white/90 border border-lavender-100 shadow-cozy p-6 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-lavender-600">
                Your Companion
              </span>
              <h2 className="font-display text-2xl font-extrabold text-plum-900">
                {pet?.name || "Mochi"}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-lavender-100 text-lavender-600 text-xs font-bold">
                Stage {pet?.stage || 1}: {pet?.stage_name || "Tiny Sprout"}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center py-2">
            <PetAvatar
              species={pet?.species || "cat"}
              colorTheme={pet?.color_theme || "lavender"}
              mood={pet?.mood || "calm"}
              accessory={pet?.equipped_accessory || "sprout"}
              stage={pet?.stage || 1}
              size={195}
              onPetClick={() => handlePetAction("cuddle")}
            />
            <p className="mt-2 text-center text-sm font-medium text-plum-800 bg-lavender-50/80 border border-lavender-100 rounded-2xl px-4 py-2.5 max-w-sm">
              “{pet?.last_reaction || "Glad you are taking a gentle moment today."}”
            </p>
          </div>

          {/* Pet Meters */}
          <div className="mt-4 space-y-3">
            <div>
              <div className="flex justify-between text-xs font-semibold text-plum-700 mb-1">
                <span>Happiness</span>
                <span>{pet?.happiness ?? 75}%</span>
              </div>
              <div className="h-2.5 rounded-full bg-lavender-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-lavender-400 to-lavender-500 transition-all duration-500"
                  style={{ width: `${pet?.happiness ?? 75}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-plum-700 mb-1">
                <span>Energy</span>
                <span>{pet?.energy ?? 80}%</span>
              </div>
              <div className="h-2.5 rounded-full bg-mint-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-mint-400 to-mint-500 transition-all duration-500"
                  style={{ width: `${pet?.energy ?? 80}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs font-semibold text-plum-700 pt-1">
              <span>Growth XP: {pet?.xp ?? 0}</span>
              <span>
                {pet?.next_stage_xp
                  ? `${pet.next_stage_xp - pet.xp} XP to next stage`
                  : "Max Cozy Stage ✨"}
              </span>
            </div>
          </div>

          {/* Interactive Pet Buttons */}
          <div className="mt-5 grid grid-cols-3 gap-2">
            <button
              disabled={petBusy}
              onClick={() => handlePetAction("cuddle")}
              className="flex flex-col items-center gap-1 rounded-2xl bg-lavender-50 hover:bg-lavender-100 py-2.5 px-2 text-xs font-bold text-plum-800 transition"
            >
              <Heart className="w-4 h-4 text-pink-500" />
              Cuddle
            </button>
            <button
              disabled={petBusy}
              onClick={() => handlePetAction("snack")}
              className="flex flex-col items-center gap-1 rounded-2xl bg-peach-50 hover:bg-peach-100 py-2.5 px-2 text-xs font-bold text-plum-800 transition"
            >
              <Cookie className="w-4 h-4 text-peach-500" />
              Snack
            </button>
            <button
              disabled={petBusy}
              onClick={() => handlePetAction("nap")}
              className="flex flex-col items-center gap-1 rounded-2xl bg-skysoft-50 hover:bg-skysoft-100 py-2.5 px-2 text-xs font-bold text-plum-800 transition"
            >
              <Moon className="w-4 h-4 text-skysoft-500" />
              Nap
            </button>
          </div>

          <div className="mt-4 pt-4 border-t border-lavender-100 flex items-center justify-between">
            <Link
              to="/pet"
              className="text-xs font-bold text-lavender-600 hover:underline"
            >
              Customize & Accessories →
            </Link>
            <button
              onClick={handleDownloadBadge}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-plum-700 hover:text-plum-900"
            >
              <Download className="w-3.5 h-3.5" />
              Keepsake Card
            </button>
          </div>
        </div>

        {/* Right Column: Today's Mood + Suggestion + Progress */}
        <div className="lg:col-span-7 space-y-6">
          {/* Today's Mood Quick Check-in */}
          <div className="rounded-3xl bg-white/90 border border-lavender-100 shadow-cozy p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <SmilePlus className="w-5 h-5 text-lavender-500" />
                <h2 className="font-display text-xl font-bold text-plum-900">
                  How are you feeling right now?
                </h2>
              </div>
              <Link to="/mood" className="text-xs font-bold text-lavender-600 hover:underline">
                Full Mood Journal →
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {MOOD_OPTIONS.map((m) => (
                <button
                  key={m.label}
                  disabled={checkinBusy}
                  onClick={() => handleQuickMood(m.label)}
                  className={`flex items-center justify-center gap-2 rounded-2xl border px-3 py-3 text-sm font-bold transition hover:scale-[1.02] disabled:opacity-60 ${m.pill}`}
                >
                  <span>{m.emoji}</span>
                  <span>{m.label}</span>
                </button>
              ))}
            </div>

            {/* Daily Wellness Suggestion */}
            <div className="mt-4 rounded-2xl bg-mint-50/90 border border-mint-100 p-4">
              <div className="flex items-center gap-2 text-xs font-bold text-mint-600 uppercase tracking-wide mb-1">
                <Coffee className="w-3.5 h-3.5" />
                Gentle Suggestion for You
              </div>
              <p className="text-sm text-plum-800 leading-relaxed">{dailySuggestion}</p>
            </div>
          </div>

          {/* Wellness Progress + Quick Launchers */}
          <div className="rounded-3xl bg-white/90 border border-lavender-100 shadow-cozy p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-display text-xl font-bold text-plum-900">
                  Your Gentle Wellness Progress
                </h2>
                <p className="text-xs text-plum-700 mt-0.5">
                  {progress?.encouragement_message ||
                    "Every small pause counts — no streaks or pressure."}
                </p>
              </div>
              <Link
                to="/activities"
                className="text-xs font-bold text-lavender-600 hover:underline shrink-0"
              >
                All Activities →
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="rounded-2xl bg-lavender-50 p-3.5 text-center">
                <div className="text-2xl font-extrabold text-lavender-600">
                  {progress?.completed_today ?? 0}
                </div>
                <div className="text-xs font-medium text-plum-700">Today</div>
              </div>
              <div className="rounded-2xl bg-mint-50 p-3.5 text-center">
                <div className="text-2xl font-extrabold text-mint-600">
                  {progress?.total_completed ?? 0}
                </div>
                <div className="text-xs font-medium text-plum-700">Total Pauses</div>
              </div>
              <div className="rounded-2xl bg-skysoft-50 p-3.5 text-center">
                <div className="text-2xl font-extrabold text-skysoft-500">
                  {progress?.total_minutes ?? 0}m
                </div>
                <div className="text-xs font-medium text-plum-700">Care Minutes</div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              {activities.slice(0, 4).map((act) => (
                <Link
                  key={act.id}
                  to={`/activities?open=${act.id}`}
                  className="rounded-2xl border border-lavender-100 bg-cream-50/70 hover:bg-lavender-50 p-3.5 flex items-center justify-between gap-3 transition"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-lavender-600">{act.category_label}</p>
                    <p className="text-sm font-bold text-plum-900 truncate">{act.title}</p>
                    <p className="text-[11px] text-plum-700">{act.duration_minutes} min</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-lavender-500 shrink-0" />
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Mood History */}
          <div className="rounded-3xl bg-white/90 border border-lavender-100 shadow-cozy p-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-lg font-bold text-plum-900">
                Recent Mood Check-Ins
              </h2>
              <Link to="/mood" className="text-xs font-bold text-lavender-600 hover:underline">
                View Trends →
              </Link>
            </div>
            {moodHistory?.entries?.length ? (
              <div className="space-y-2.5">
                {moodHistory.entries.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start justify-between gap-3 rounded-2xl bg-cream-50 border border-lavender-100 px-4 py-3"
                  >
                    <div>
                      <span className="inline-block text-xs font-bold px-2.5 py-0.5 rounded-full bg-lavender-100 text-lavender-600">
                        {item.mood}
                      </span>
                      {item.journal && (
                        <p className="text-xs text-plum-800 mt-1.5 line-clamp-2">
                          “{item.journal}”
                        </p>
                      )}
                    </div>
                    <span className="text-[11px] text-plum-700/75 shrink-0">
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-plum-700">
                No check-ins yet today. Pick a mood above whenever you'd like!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

