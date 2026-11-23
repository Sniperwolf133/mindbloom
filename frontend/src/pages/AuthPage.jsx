import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Lock, Mail, PawPrint, Shield, User } from "lucide-react";
import PetAvatar from "../components/PetAvatar";
import { useAuth } from "../context/AuthContext";

export default function AuthPage() {
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get("mode") === "signup" ? "signup" : "login";
  const [mode, setMode] = useState(initialMode);
  const { login, signup, demoLogin, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [adminCode, setAdminCode] = useState("");
  const [petName, setPetName] = useState("Mochi");
  const [petSpecies, setPetSpecies] = useState("cat");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await signup({
          name,
          email,
          password,
          role,
          admin_code: role === "admin" ? adminCode : null,
          pet_name: petName,
          pet_species: petSpecies,
        });
      }
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Authentication failed. Please check your details.");
    } finally {
      setBusy(false);
    }
  };

  const handleDemo = async (demoRole) => {
    setError("");
    setBusy(true);
    try {
      await demoLogin(demoRole);
      navigate(demoRole === "admin" ? "/admin/documents" : "/dashboard");
    } catch (err) {
      setError(err.message || "Could not start demo session.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-10 px-4 sm:px-6">
      <div className="max-w-4xl w-full mx-auto">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-plum-700 hover:text-lavender-600 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to MindMate Home
        </Link>

        <div className="grid md:grid-cols-12 rounded-[2rem] bg-white/90 backdrop-blur-md border border-lavender-100 shadow-cozy-lg overflow-hidden">
          {/* Left Cozy Companion Panel */}
          <div className="md:col-span-5 bg-gradient-to-br from-lavender-100/80 via-mint-50 to-skysoft-50 p-8 flex flex-col items-center justify-center text-center">
            <PetAvatar
              species={mode === "signup" ? petSpecies : "cat"}
              colorTheme="lavender"
              mood="happy"
              accessory="sprout"
              stage={1}
              size={170}
              interactive={false}
            />
            <h2 className="font-display text-2xl font-extrabold text-plum-900 mt-4">
              {mode === "signup" ? `Meet ${petName || "your buddy"}!` : "Welcome back!"}
            </h2>
            <p className="text-sm text-plum-700 mt-2 leading-relaxed">
              Take a calm breath. Your journal entries and chats stay private to your own
              companion space.
            </p>

            <div className="w-full mt-6 pt-5 border-t border-lavender-200/70 space-y-2.5">
              <p className="text-xs font-bold uppercase tracking-wider text-plum-700/75">
                Quick Prototype Access
              </p>
              <button
                type="button"
                disabled={busy}
                onClick={() => handleDemo("student")}
                className="w-full rounded-2xl bg-white hover:bg-lavender-50 border border-lavender-200 px-4 py-2.5 text-xs font-bold text-plum-900 shadow-sm transition disabled:opacity-60"
              >
                One-Click Student Demo
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => handleDemo("admin")}
                className="w-full rounded-2xl bg-white/80 hover:bg-mint-50 border border-mint-200 px-4 py-2.5 text-xs font-bold text-mint-600 transition disabled:opacity-60"
              >
                One-Click Admin Demo (PDF Uploads)
              </button>
            </div>
          </div>

          {/* Right Form */}
          <div className="md:col-span-7 p-7 sm:p-9">
            <div className="flex rounded-2xl bg-cream-100 p-1 mb-6">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setError("");
                }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition ${
                  mode === "login"
                    ? "bg-white text-plum-900 shadow-sm"
                    : "text-plum-700 hover:text-plum-900"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setError("");
                }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition ${
                  mode === "signup"
                    ? "bg-white text-plum-900 shadow-sm"
                    : "text-plum-700 hover:text-plum-900"
                }`}
              >
                Create Account
              </button>
            </div>

            {error && (
              <div className="mb-4 rounded-2xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "signup" && (
                <div>
                  <label className="block text-xs font-bold text-plum-800 mb-1.5">
                    Your Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-plum-700/60 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., Maya"
                      className="w-full rounded-2xl border border-lavender-200 bg-cream-50/50 pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-lavender-400"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-plum-800 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-plum-700/60 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@university.edu"
                    className="w-full rounded-2xl border border-lavender-200 bg-cream-50/50 pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-lavender-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-plum-800 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-plum-700/60 absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full rounded-2xl border border-lavender-200 bg-cream-50/50 pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-lavender-400"
                  />
                </div>
              </div>

              {mode === "signup" && (
                <>
                  <div className="grid sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-xs font-bold text-plum-800 mb-1.5">
                        Name Your Pet
                      </label>
                      <div className="relative">
                        <PawPrint className="w-4 h-4 text-plum-700/60 absolute left-3.5 top-3.5" />
                        <input
                          type="text"
                          required
                          value={petName}
                          onChange={(e) => setPetName(e.target.value)}
                          placeholder="Mochi"
                          className="w-full rounded-2xl border border-lavender-200 bg-cream-50/50 pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-lavender-400"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-plum-800 mb-1.5">
                        Choose Companion
                      </label>
                      <select
                        value={petSpecies}
                        onChange={(e) => setPetSpecies(e.target.value)}
                        className="w-full rounded-2xl border border-lavender-200 bg-cream-50/50 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-lavender-400"
                      >
                        <option value="cat">Cat</option>
                        <option value="bunny">Bunny</option>
                        <option value="fox">Fox</option>
                      </select>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-lavender-50/60 border border-lavender-100 p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-plum-800 flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-lavender-600" />
                        Account Role
                      </span>
                      <div className="flex gap-2">
                        {["student", "admin"].map((r) => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => setRole(r)}
                            className={`px-3 py-1 rounded-full text-xs font-bold capitalize transition ${
                              role === r
                                ? "bg-lavender-500 text-white"
                                : "bg-white text-plum-700"
                            }`}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    </div>
                    {role === "admin" && (
                      <input
                        type="text"
                        value={adminCode}
                        onChange={(e) => setAdminCode(e.target.value)}
                        placeholder="Admin access code (default: mindmate-admin)"
                        className="w-full rounded-xl border border-lavender-200 bg-white px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-lavender-400"
                      />
                    )}
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-2xl bg-lavender-500 hover:bg-lavender-600 text-white font-bold py-3 text-sm shadow-cozy transition disabled:opacity-60"
              >
                {busy
                  ? "Entering your space..."
                  : mode === "login"
                  ? "Sign In to MindMate"
                  : "Create Account & Meet Pet"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

