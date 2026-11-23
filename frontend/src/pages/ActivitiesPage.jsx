import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Bell,
  CheckCircle2,
  Clock,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Wind,
  X,
} from "lucide-react";
import { api } from "../api/client";
import PetAvatar from "../components/PetAvatar";
import { useAuth } from "../context/AuthContext";

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "breathing", label: "Breathing" },
  { id: "mindfulness", label: "Mindfulness" },
  { id: "study_break", label: "Study Breaks" },
  { id: "gratitude", label: "Gratitude" },
  { id: "reflection", label: "Reflection" },
  { id: "stretching", label: "Stretching" },
  { id: "focus_timer", label: "Focus & Relax Timers" },
];

function getBreathingPhases(activityId) {
  if (activityId === "478-breathing") {
    return [
      { label: "Inhale softly", seconds: 4, scale: "scale-125 bg-mint-200/80" },
      { label: "Hold gently", seconds: 7, scale: "scale-125 bg-lavender-200/80" },
      { label: "Exhale slowly", seconds: 8, scale: "scale-95 bg-skysoft-200/80" },
    ];
  }
  return [
    { label: "Inhale", seconds: 4, scale: "scale-125 bg-mint-200/80" },
    { label: "Hold", seconds: 4, scale: "scale-125 bg-lavender-200/80" },
    { label: "Exhale", seconds: 4, scale: "scale-95 bg-skysoft-200/80" },
    { label: "Rest", seconds: 4, scale: "scale-95 bg-cream-200/80" },
  ];
}

export default function ActivitiesPage() {
  const { pet, setPet, refreshPet } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [activities, setActivities] = useState([]);
  const [progress, setProgress] = useState(null);
  const [category, setCategory] = useState("all");
  const [activeActivity, setActiveActivity] = useState(null);
  const [reflectionNote, setReflectionNote] = useState("");
  const [completionResult, setCompletionResult] = useState(null);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState("");

  // Interactive timer state
  const [timerRunning, setTimerRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(180);

  // Interactive breathing phase state
  const [breathPhaseIdx, setBreathPhaseIdx] = useState(0);
  const [breathCountdown, setBreathCountdown] = useState(4);

  // Study-break gentle reminder
  const [breakReminderMins, setBreakReminderMins] = useState(0);
  const [breakAlertMessage, setBreakAlertMessage] = useState("");

  const loadData = async () => {
    try {
      const [acts, prog] = await Promise.all([
        api.getActivities(),
        api.getWellnessProgress(),
      ]);
      setActivities(acts);
      setProgress(prog);
      const openId = searchParams.get("open");
      if (openId) {
        const match = acts.find((a) => a.id === openId);
        if (match) openGuidedActivity(match);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openGuidedActivity = (act) => {
    setActiveActivity(act);
    setCompletionResult(null);
    setReflectionNote("");
    setSecondsLeft(act.duration_minutes * 60);
    setTimerRunning(act.category === "breathing");
    const phases = getBreathingPhases(act.id);
    setBreathPhaseIdx(0);
    setBreathCountdown(phases[0].seconds);
  };

  const closeModal = () => {
    setActiveActivity(null);
    setTimerRunning(false);
    if (searchParams.get("open")) {
      searchParams.delete("open");
      setSearchParams(searchParams);
    }
  };

  // Timer tick
  useEffect(() => {
    if (!timerRunning || !activeActivity) return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));

      if (activeActivity.category === "breathing") {
        const phases = getBreathingPhases(activeActivity.id);
        setBreathCountdown((prev) => {
          if (prev > 1) return prev - 1;
          const nextIdx = (breathPhaseIdx + 1) % phases.length;
          setBreathPhaseIdx(nextIdx);
          return phases[nextIdx].seconds;
        });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [timerRunning, activeActivity, breathPhaseIdx]);

  // Study-break gentle reminder timer
  useEffect(() => {
    if (!breakReminderMins) return;
    const timeout = setTimeout(() => {
      setBreakAlertMessage(
        `Gentle study-break chime: It has been ${breakReminderMins} minute(s). Rest your eyes, sip water, and stretch softly!`
      );
      setBreakReminderMins(0);
    }, breakReminderMins * 60 * 1000);
    return () => clearTimeout(timeout);
  }, [breakReminderMins]);

  const handleComplete = async () => {
    if (!activeActivity) return;
    setCompleting(true);
    setError("");
    try {
      const res = await api.completeActivity({
        activity_id: activeActivity.id,
        duration_minutes: activeActivity.duration_minutes,
        reflection_note: reflectionNote.trim() || null,
      });
      setCompletionResult(res);
      setTimerRunning(false);
      await Promise.all([refreshPet(), api.getWellnessProgress().then(setProgress)]);
      if (pet) {
        setPet((prev) =>
          prev
            ? {
                ...prev,
                mood: res.pet_mood,
                happiness: res.pet_happiness,
                energy: res.pet_energy,
                xp: res.pet_xp,
                stage: res.pet_stage,
                last_reaction: res.pet_reaction,
              }
            : prev
        );
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setCompleting(false);
    }
  };

  const filtered =
    category === "all"
      ? activities
      : activities.filter((a) => a.category === category);

  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const secs = String(secondsLeft % 60).padStart(2, "0");

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-plum-900">
            Wellness Activities
          </h1>
          <p className="text-sm text-plum-700 mt-1">
            Gentle pauses designed for busy college days — no streak guilt, just care.
          </p>
        </div>

        {/* Gentle Study-Break Reminder Widget */}
        <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-white/90 border border-lavender-100 px-4 py-2.5 shadow-sm">
          <Bell className="w-4 h-4 text-lavender-500" />
          <span className="text-xs font-bold text-plum-800">Study-Break Reminder:</span>
          {[15, 25, 45].map((m) => (
            <button
              key={m}
              onClick={() => {
                setBreakReminderMins(m);
                setBreakAlertMessage("");
              }}
              className={`px-2.5 py-1 rounded-full text-xs font-bold transition ${
                breakReminderMins === m
                  ? "bg-mint-500 text-white"
                  : "bg-lavender-50 text-plum-700 hover:bg-lavender-100"
              }`}
            >
              {m}m
            </button>
          ))}
          {breakReminderMins > 0 && (
            <button
              onClick={() => setBreakReminderMins(0)}
              className="text-[11px] font-semibold text-rose-600 ml-1"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {breakAlertMessage && (
        <div className="rounded-2xl bg-mint-100 border border-mint-200 px-5 py-3.5 flex items-center justify-between gap-3 text-sm font-semibold text-mint-600">
          <span>🌿 {breakAlertMessage}</span>
          <button onClick={() => setBreakAlertMessage("")}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="rounded-2xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* Progress Strip */}
      {progress && (
        <div className="rounded-3xl bg-gradient-to-r from-lavender-50 via-white to-mint-50 border border-lavender-100 p-5 shadow-cozy flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-0.5">
            <p className="text-xs font-bold uppercase tracking-wider text-lavender-600">
              Your Gentle Care Journey
            </p>
            <p className="text-sm font-semibold text-plum-900">
              {progress.encouragement_message}
            </p>
          </div>
          <div className="flex items-center gap-4 text-center">
            <div className="px-4 py-2 rounded-2xl bg-white border border-lavender-100">
              <div className="text-lg font-extrabold text-lavender-600">
                {progress.completed_today}
              </div>
              <div className="text-[11px] text-plum-700">Today</div>
            </div>
            <div className="px-4 py-2 rounded-2xl bg-white border border-lavender-100">
              <div className="text-lg font-extrabold text-mint-600">
                {progress.total_completed}
              </div>
              <div className="text-[11px] text-plum-700">Completed</div>
            </div>
            <div className="px-4 py-2 rounded-2xl bg-white border border-lavender-100">
              <div className="text-lg font-extrabold text-skysoft-500">
                {progress.total_minutes}m
              </div>
              <div className="text-[11px] text-plum-700">Mindful Min</div>
            </div>
          </div>
        </div>
      )}

      {/* Category Filter Pills */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            className={`px-4 py-2 rounded-full text-xs font-bold transition ${
              category === cat.id
                ? "bg-lavender-500 text-white shadow-sm"
                : "bg-white/85 border border-lavender-100 text-plum-700 hover:bg-lavender-50"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Activity Cards Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((act) => (
          <div
            key={act.id}
            className="rounded-3xl bg-white/90 border border-lavender-100 shadow-cozy p-6 flex flex-col justify-between hover:-translate-y-0.5 transition"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="px-3 py-1 rounded-full bg-lavender-50 text-lavender-600 text-[11px] font-bold">
                  {act.category_label}
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-plum-700">
                  <Clock className="w-3.5 h-3.5 text-mint-500" />
                  {act.duration_minutes} min
                </span>
              </div>
              <h3 className="font-display text-lg font-extrabold text-plum-900">
                {act.title}
              </h3>
              <p className="text-sm text-plum-700 mt-2 leading-relaxed">
                {act.description}
              </p>
              <p className="text-xs font-medium text-mint-600 mt-3 bg-mint-50 rounded-xl px-3 py-2">
                {act.pet_reward_text}
              </p>
            </div>

            <button
              onClick={() => openGuidedActivity(act)}
              className="mt-5 w-full rounded-2xl bg-lavender-500 hover:bg-lavender-600 text-white font-bold py-2.5 text-sm shadow-sm transition"
            >
              Start Gently
            </button>
          </div>
        ))}
      </div>

      {/* Interactive Activity Modal */}
      {activeActivity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-plum-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-[2rem] bg-cream-50 border border-lavender-200 shadow-cozy-lg p-6 sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-lavender-600 bg-lavender-100 px-3 py-1 rounded-full">
                  {activeActivity.category_label}
                </span>
                <h2 className="font-display text-2xl font-extrabold text-plum-900 mt-2">
                  {activeActivity.title}
                </h2>
              </div>
              <button
                onClick={closeModal}
                className="p-2 rounded-xl hover:bg-lavender-100 text-plum-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {completionResult ? (
              <div className="mt-6 text-center space-y-4 py-4">
                <div className="flex justify-center">
                  <PetAvatar
                    species={pet?.species || "cat"}
                    colorTheme={pet?.color_theme || "lavender"}
                    mood={completionResult.pet_mood}
                    accessory={pet?.equipped_accessory || "sprout"}
                    stage={completionResult.pet_stage}
                    size={160}
                    interactive={false}
                  />
                </div>
                <div className="inline-flex items-center gap-2 rounded-full bg-mint-100 text-mint-600 px-4 py-1.5 text-sm font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  Activity Complete!
                </div>
                <p className="text-base font-bold text-plum-900">
                  {completionResult.completion_message}
                </p>
                <p className="text-sm text-plum-700 bg-white rounded-2xl border border-lavender-100 p-4">
                  🐾 {completionResult.pet_reaction}
                </p>
                {completionResult.newly_unlocked_accessories?.length > 0 && (
                  <p className="text-xs font-bold text-lavender-600 bg-lavender-100 rounded-xl px-3 py-2">
                    ✨ Unlocked New Pet Accessory:{" "}
                    {completionResult.newly_unlocked_accessories.join(", ")}!
                  </p>
                )}
                <button
                  onClick={closeModal}
                  className="rounded-full bg-lavender-500 hover:bg-lavender-600 text-white px-7 py-2.5 text-sm font-bold transition"
                >
                  Back to Activities
                </button>
              </div>
            ) : (
              <div className="mt-5 space-y-5">
                {/* Interactive Breathing Orb */}
                {activeActivity.category === "breathing" && (
                  <div className="rounded-3xl bg-white border border-lavender-100 p-6 flex flex-col items-center justify-center text-center">
                    {(() => {
                      const phases = getBreathingPhases(activeActivity.id);
                      const currentPhase = phases[breathPhaseIdx] || phases[0];
                      return (
                        <>
                          <div className="h-44 flex items-center justify-center">
                            <div
                              className={`w-32 h-32 rounded-full flex flex-col items-center justify-center transition-all duration-1000 shadow-cozy ${
                                timerRunning ? currentPhase.scale : "scale-100 bg-lavender-100"
                              }`}
                            >
                              <Wind className="w-6 h-6 text-plum-800 mb-1" />
                              <span className="text-sm font-extrabold text-plum-900">
                                {currentPhase.label}
                              </span>
                              <span className="text-xs font-bold text-plum-700">
                                {breathCountdown}s
                              </span>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}

                {/* Interactive Timer Controls */}
                <div className="rounded-2xl bg-white border border-lavender-100 p-4 flex items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-bold text-plum-700">Session Timer</div>
                    <div className="font-display text-2xl font-extrabold text-plum-900">
                      {mins}:{secs}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setTimerRunning(!timerRunning)}
                      className="inline-flex items-center gap-1.5 rounded-full bg-lavender-500 hover:bg-lavender-600 text-white px-4 py-2 text-xs font-bold transition"
                    >
                      {timerRunning ? (
                        <>
                          <Pause className="w-3.5 h-3.5" /> Pause
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5" /> Start Timer
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTimerRunning(false);
                        setSecondsLeft(activeActivity.duration_minutes * 60);
                        const phases = getBreathingPhases(activeActivity.id);
                        setBreathPhaseIdx(0);
                        setBreathCountdown(phases[0].seconds);
                      }}
                      className="p-2 rounded-full bg-cream-100 hover:bg-lavender-100 text-plum-700"
                      title="Reset timer"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Guided Steps */}
                <div className="rounded-2xl bg-white/90 border border-lavender-100 p-4 space-y-2.5">
                  <p className="text-xs font-bold uppercase tracking-wider text-lavender-600">
                    Gentle Steps
                  </p>
                  <ol className="space-y-2 text-sm text-plum-800">
                    {activeActivity.steps.map((step, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-lavender-100 text-lavender-600 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Optional Reflection / Gratitude Input */}
                {(activeActivity.prompt_question ||
                  activeActivity.category === "gratitude" ||
                  activeActivity.category === "reflection") && (
                  <div>
                    <label className="block text-xs font-bold text-plum-800 mb-1.5">
                      {activeActivity.prompt_question || "Optional Private Note"}
                    </label>
                    <textarea
                      rows={3}
                      value={reflectionNote}
                      onChange={(e) => setReflectionNote(e.target.value)}
                      placeholder="Write a few quiet words for yourself..."
                      className="w-full rounded-2xl border border-lavender-200 bg-white p-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-lavender-400"
                    />
                  </div>
                )}

                <button
                  type="button"
                  disabled={completing}
                  onClick={handleComplete}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-mint-500 hover:bg-mint-600 text-white font-bold py-3 text-sm shadow-sm transition disabled:opacity-60"
                >
                  <Sparkles className="w-4 h-4" />
                  {completing
                    ? "Saving your progress..."
                    : "Complete Activity & Cheer Companion"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

