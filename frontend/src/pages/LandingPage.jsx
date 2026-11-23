import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BookOpenCheck,
  HeartHandshake,
  MessageCircleHeart,
  PawPrint,
  ShieldCheck,
  SmilePlus,
  Sparkles,
} from "lucide-react";
import PetAvatar from "../components/PetAvatar";
import { useAuth } from "../context/AuthContext";

const DEMO_SPECIES = ["cat", "bunny", "fox"];

export default function LandingPage() {
  const { isAuthenticated, demoLogin } = useAuth();
  const navigate = useNavigate();
  const [previewSpeciesIdx, setPreviewSpeciesIdx] = useState(0);
  const [previewMood, setPreviewMood] = useState("happy");
  const [demoLoading, setDemoLoading] = useState(false);
  const [error, setError] = useState("");

  const handleQuickDemo = async () => {
    setDemoLoading(true);
    setError("");
    try {
      await demoLogin("student");
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Could not launch demo right now. Is the backend running?");
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Navbar */}
      <header className="max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-lavender-500 to-mint-400 flex items-center justify-center text-white shadow-sm">
            <PawPrint className="w-5 h-5" />
          </div>
          <span className="font-display text-2xl font-extrabold text-plum-900">
            MindMate
          </span>
        </Link>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 rounded-full bg-lavender-500 hover:bg-lavender-600 text-white px-5 py-2.5 text-sm font-semibold shadow-sm transition"
            >
              Open Dashboard
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <>
              <Link
                to="/auth"
                className="rounded-full px-4 py-2 text-sm font-semibold text-plum-800 hover:bg-lavender-100/70 transition"
              >
                Sign In
              </Link>
              <Link
                to="/auth?mode=signup"
                className="inline-flex items-center gap-2 rounded-full bg-lavender-500 hover:bg-lavender-600 text-white px-5 py-2.5 text-sm font-semibold shadow-sm transition"
              >
                Get Started
                <ArrowRight className="w-4 h-4" />
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-16 grid lg:grid-cols-12 gap-10 items-center">
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-mint-100 text-mint-600 px-4 py-1.5 text-xs font-bold tracking-wide">
            <Sparkles className="w-3.5 h-3.5" />
            STUDENT WELLNESS & DIGITAL COMPANION
          </div>

          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold text-plum-900 leading-tight">
            Take care of yourself, and your little companion{" "}
            <span className="text-lavender-600">grows with you.</span>
          </h1>

          <p className="text-base sm:text-lg text-plum-700 leading-relaxed max-w-2xl">
            MindMate is a cozy, non-clinical wellness space built for college students.
            Talk through exam stress or busy days with an empathetic AI companion, track
            your mood gently, practice calming breaks, and care for a virtual pet who
            celebrates every tiny step with you.
          </p>

          {error && (
            <div className="rounded-2xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3.5 pt-1">
            <Link
              to={isAuthenticated ? "/dashboard" : "/auth?mode=signup"}
              className="inline-flex items-center gap-2 rounded-full bg-lavender-500 hover:bg-lavender-600 text-white px-7 py-3.5 text-sm font-bold shadow-cozy transition"
            >
              {isAuthenticated ? "Go to My Space" : "Adopt Your Companion"}
              <ArrowRight className="w-4 h-4" />
            </Link>

            {!isAuthenticated && (
              <button
                onClick={handleQuickDemo}
                disabled={demoLoading}
                className="inline-flex items-center gap-2 rounded-full bg-white hover:bg-mint-50 border border-lavender-200 text-plum-900 px-6 py-3.5 text-sm font-bold shadow-sm transition disabled:opacity-60"
              >
                <PawPrint className="w-4 h-4 text-mint-500" />
                {demoLoading ? "Opening Cozy Demo..." : "Try Student Demo"}
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-5 pt-2 text-xs font-medium text-plum-700/85">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-mint-500" />
              Private & user-controlled history
            </span>
            <span className="flex items-center gap-1.5">
              <HeartHandshake className="w-4 h-4 text-lavender-500" />
              Zero guilt, zero streak punishment
            </span>
          </div>
        </div>

        {/* Interactive Pet Preview Card */}
        <div className="lg:col-span-5">
          <div className="relative rounded-[2rem] bg-white/85 backdrop-blur-md border border-lavender-100 shadow-cozy-lg p-7 text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-lavender-50 px-3.5 py-1 text-xs font-semibold text-lavender-600 mb-3">
              Tap pet to say hi!
            </div>

            <div className="flex justify-center">
              <PetAvatar
                species={DEMO_SPECIES[previewSpeciesIdx]}
                colorTheme={previewSpeciesIdx === 1 ? "mint" : previewSpeciesIdx === 2 ? "peach" : "lavender"}
                mood={previewMood}
                accessory={previewMood === "calm" ? "sprout" : "scarf"}
                stage={2}
                size={215}
                onPetClick={() => setPreviewMood("excited")}
              />
            </div>

            <h3 className="font-display text-xl font-bold text-plum-900 mt-2">
              {previewSpeciesIdx === 0 ? "Mochi the Cat" : previewSpeciesIdx === 1 ? "Clover the Bunny" : "Pip the Fox"}
            </h3>
            <p className="text-xs text-plum-700 mt-1">
              Reacts warmly when you breathe, rest, or check in
            </p>

            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {["cat", "bunny", "fox"].map((sp, i) => (
                <button
                  key={sp}
                  onClick={() => setPreviewSpeciesIdx(i)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold capitalize transition ${
                    previewSpeciesIdx === i
                      ? "bg-lavender-500 text-white"
                      : "bg-lavender-50 text-plum-700 hover:bg-lavender-100"
                  }`}
                >
                  {sp}
                </button>
              ))}
            </div>

            <div className="mt-2.5 flex flex-wrap justify-center gap-1.5">
              {["happy", "calm", "sleepy", "excited"].map((m) => (
                <button
                  key={m}
                  onClick={() => setPreviewMood(m)}
                  className={`px-3 py-1 rounded-full text-[11px] font-medium capitalize transition ${
                    previewMood === m
                      ? "bg-mint-500 text-white"
                      : "bg-cream-100 text-plum-700 hover:bg-mint-50"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            {
              icon: MessageCircleHeart,
              title: "Empathetic AI Companion",
              desc: "Powered by Groq & LangChain with warm student-first prompts and immediate safety care.",
              bg: "bg-lavender-50",
              iconColor: "text-lavender-600",
            },
            {
              icon: PawPrint,
              title: "Growing Pet Friend",
              desc: "Customize a cat, bunny, or fox that evolves and unlocks cozy accessories as you care for yourself.",
              bg: "bg-mint-50",
              iconColor: "text-mint-600",
            },
            {
              icon: SmilePlus,
              title: "Gentle Mood Tracking",
              desc: "Check in with 6 relatable moods, keep private reflections, and view soft visual trends.",
              bg: "bg-skysoft-50",
              iconColor: "text-skysoft-500",
            },
            {
              icon: BookOpenCheck,
              title: "RAG Wellness Guides",
              desc: "Grounded in real campus & stress-management PDFs indexed with Sentence Transformers & ChromaDB.",
              bg: "bg-peach-50",
              iconColor: "text-peach-500",
            },
          ].map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="rounded-3xl bg-white/85 border border-lavender-100 p-6 shadow-cozy hover:-translate-y-0.5 transition"
              >
                <div
                  className={`w-11 h-11 rounded-2xl ${f.bg} ${f.iconColor} flex items-center justify-center mb-4`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-display text-lg font-bold text-plum-900">{f.title}</h3>
                <p className="text-sm text-plum-700 mt-2 leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer Note */}
      <footer className="mt-auto border-t border-lavender-100 bg-white/60 py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-plum-700">
          <p>
            MindMate is a supportive student wellness prototype — not a substitute for
            licensed therapy, diagnosis, or medical care.
          </p>
          <p className="font-semibold text-lavender-600">
            In crisis? Call or text 988 (US/Canada) or contact campus counseling.
          </p>
        </div>
      </footer>
    </div>
  );
}

