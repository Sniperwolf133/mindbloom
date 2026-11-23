import { useEffect, useState } from "react";
import {
  Check,
  Cookie,
  Download,
  Heart,
  Lock,
  Moon,
  Palette,
  PawPrint,
  Sparkles,
} from "lucide-react";
import { api } from "../api/client";
import PetAvatar from "../components/PetAvatar";
import { useAuth } from "../context/AuthContext";

const SPECIES_OPTIONS = [
  { id: "cat", label: "Cozy Cat", desc: "Gentle purrs & curious whiskers" },
  { id: "bunny", label: "Soft Bunny", desc: "Floppy ears & calm hops" },
  { id: "fox", label: "Warm Fox", desc: "Fluffy tail & cozy woodland energy" },
];

const COLOR_THEMES = [
  { id: "lavender", label: "Lavender", swatch: "bg-[#DCD0FB]" },
  { id: "mint", label: "Mint Green", swatch: "bg-[#BDE9D1]" },
  { id: "peach", label: "Soft Peach", swatch: "bg-[#FFD0B3]" },
  { id: "sky", label: "Sky Blue", swatch: "bg-[#BBE0FB]" },
];

export default function PetPage() {
  const { pet, setPet } = useAuth();
  const [name, setName] = useState(pet?.name || "Mochi");
  const [species, setSpecies] = useState(pet?.species || "cat");
  const [colorTheme, setColorTheme] = useState(pet?.color_theme || "lavender");
  const [accessory, setAccessory] = useState(pet?.equipped_accessory || "sprout");
  const [previewMood, setPreviewMood] = useState(pet?.mood || "calm");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .getPet()
      .then((data) => {
        setPet(data);
        setName(data.name);
        setSpecies(data.species);
        setColorTheme(data.color_theme);
        setAccessory(data.equipped_accessory);
        setPreviewMood(data.mood);
      })
      .catch((err) => setError(err.message));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const updated = await api.updatePet({
        name,
        species,
        color_theme: colorTheme,
        equipped_accessory: accessory,
      });
      setPet(updated);
      setMessage(`Saved ${updated.name}'s cozy new look!`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleInteract = async (action) => {
    setError("");
    try {
      const updated = await api.interactPet(action);
      setPet(updated);
      setPreviewMood(updated.mood);
      setMessage(updated.last_reaction);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDownloadBadge = async () => {
    try {
      const blob = await api.downloadPetBadge();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${name || "mindmate"}-companion-card.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message);
    }
  };

  const xp = pet?.xp ?? 0;
  const stagePct =
    pet?.stage === 3
      ? 100
      : pet?.stage === 2
      ? Math.min(100, Math.round(((xp - 100) / 150) * 100))
      : Math.min(100, Math.round((xp / 100) * 100));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-plum-900">
            Pet Companion Studio
          </h1>
          <p className="text-sm text-plum-700 mt-1">
            Customize your buddy and unlock cozy accessories simply by taking care of yourself.
          </p>
        </div>

        <button
          onClick={handleDownloadBadge}
          className="inline-flex items-center gap-2 rounded-full bg-white hover:bg-lavender-50 border border-lavender-200 px-4 py-2 text-xs font-bold text-plum-900 shadow-sm transition"
        >
          <Download className="w-4 h-4 text-lavender-600" />
          Download Keepsake Card (PNG)
        </button>
      </div>

      {message && (
        <div className="rounded-2xl bg-mint-100 border border-mint-200 px-4 py-3 text-sm font-semibold text-mint-600">
          🐾 {message}
        </div>
      )}

      {error && (
        <div className="rounded-2xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="grid lg:grid-cols-12 gap-6">
        {/* Live Pet Stage */}
        <div className="lg:col-span-5 rounded-3xl bg-white/90 border border-lavender-100 shadow-cozy p-6 flex flex-col items-center text-center">
          <div className="w-full flex items-center justify-between mb-2">
            <span className="px-3 py-1 rounded-full bg-lavender-100 text-lavender-600 text-xs font-bold">
              Stage {pet?.stage || 1}: {pet?.stage_name || "Tiny Sprout"}
            </span>
            <span className="text-xs font-bold text-plum-700">{xp} XP</span>
          </div>

          <PetAvatar
            species={species}
            colorTheme={colorTheme}
            mood={previewMood}
            accessory={accessory}
            stage={pet?.stage || 1}
            size={230}
            onPetClick={() => handleInteract("cuddle")}
          />

          <h2 className="font-display text-2xl font-extrabold text-plum-900 mt-1">
            {name || "Mochi"}
          </h2>
          <p className="text-xs text-plum-700 mt-1">
            Preview expressions or interact below
          </p>

          {/* Mood Preview Selector */}
          <div className="mt-4 flex flex-wrap justify-center gap-1.5">
            {["happy", "calm", "excited", "sleepy", "sad"].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setPreviewMood(m)}
                className={`px-3 py-1 rounded-full text-[11px] font-bold capitalize transition ${
                  previewMood === m
                    ? "bg-lavender-500 text-white"
                    : "bg-lavender-50 text-plum-700 hover:bg-lavender-100"
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          {/* Evolution Bar */}
          <div className="w-full mt-5 pt-4 border-t border-lavender-100 text-left space-y-2">
            <div className="flex justify-between text-xs font-bold text-plum-800">
              <span>Companion Growth</span>
              <span>
                {pet?.next_stage_xp
                  ? `${pet.next_stage_xp - xp} XP to Stage ${(pet?.stage || 1) + 1}`
                  : "Fully Evolved!"}
              </span>
            </div>
            <div className="h-3 rounded-full bg-lavender-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-lavender-400 via-mint-400 to-skysoft-400 transition-all duration-500"
                style={{ width: `${Math.max(8, stagePct)}%` }}
              />
            </div>
          </div>

          {/* Interactive Actions */}
          <div className="w-full mt-5 grid grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => handleInteract("cuddle")}
              className="flex flex-col items-center gap-1 rounded-2xl bg-lavender-50 hover:bg-lavender-100 py-2.5 text-[11px] font-bold text-plum-800"
            >
              <Heart className="w-4 h-4 text-pink-500" />
              Cuddle
            </button>
            <button
              type="button"
              onClick={() => handleInteract("snack")}
              className="flex flex-col items-center gap-1 rounded-2xl bg-peach-50 hover:bg-peach-100 py-2.5 text-[11px] font-bold text-plum-800"
            >
              <Cookie className="w-4 h-4 text-peach-500" />
              Snack
            </button>
            <button
              type="button"
              onClick={() => handleInteract("nap")}
              className="flex flex-col items-center gap-1 rounded-2xl bg-skysoft-50 hover:bg-skysoft-100 py-2.5 text-[11px] font-bold text-plum-800"
            >
              <Moon className="w-4 h-4 text-skysoft-500" />
              Nap
            </button>
            <button
              type="button"
              onClick={() => handleInteract("cheer")}
              className="flex flex-col items-center gap-1 rounded-2xl bg-mint-50 hover:bg-mint-100 py-2.5 text-[11px] font-bold text-plum-800"
            >
              <Sparkles className="w-4 h-4 text-mint-600" />
              Cheer
            </button>
          </div>
        </div>

        {/* Customization Form */}
        <form
          onSubmit={handleSave}
          className="lg:col-span-7 rounded-3xl bg-white/90 border border-lavender-100 shadow-cozy p-6 space-y-6"
        >
          {/* Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-plum-700 mb-2">
              Companion Name
            </label>
            <input
              type="text"
              required
              maxLength={30}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-2xl border border-lavender-200 bg-cream-50/50 px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-lavender-400"
            />
          </div>

          {/* Species */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-plum-700 mb-2">
              <PawPrint className="w-3.5 h-3.5 text-lavender-500" />
              Companion Species
            </label>
            <div className="grid sm:grid-cols-3 gap-3">
              {SPECIES_OPTIONS.map((sp) => (
                <button
                  type="button"
                  key={sp.id}
                  onClick={() => setSpecies(sp.id)}
                  className={`rounded-2xl border p-3.5 text-left transition ${
                    species === sp.id
                      ? "bg-lavender-500 text-white border-lavender-500 shadow-sm"
                      : "bg-cream-50/70 border-lavender-100 text-plum-800 hover:bg-lavender-50"
                  }`}
                >
                  <div className="text-sm font-bold">{sp.label}</div>
                  <div
                    className={`text-[11px] mt-0.5 ${
                      species === sp.id ? "text-white/90" : "text-plum-700/80"
                    }`}
                  >
                    {sp.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Pastel Color Theme */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-plum-700 mb-2">
              <Palette className="w-3.5 h-3.5 text-mint-500" />
              Pastel Coat Theme
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {COLOR_THEMES.map((theme) => (
                <button
                  type="button"
                  key={theme.id}
                  onClick={() => setColorTheme(theme.id)}
                  className={`rounded-2xl border p-3 flex items-center gap-2.5 text-xs font-bold transition ${
                    colorTheme === theme.id
                      ? "border-lavender-500 bg-lavender-50 text-plum-900 ring-2 ring-lavender-300"
                      : "border-lavender-100 bg-white text-plum-700 hover:bg-cream-50"
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full ${theme.swatch} border border-plum-700/20`} />
                  <span>{theme.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Accessories Closet */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-plum-700 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-peach-500" />
              Accessories Closet
            </label>
            <div className="grid sm:grid-cols-2 gap-2.5">
              {(pet?.accessories_catalog || []).map((item) => {
                const isEquipped = accessory === item.id;
                return (
                  <button
                    type="button"
                    key={item.id}
                    disabled={!item.unlocked}
                    onClick={() => setAccessory(item.id)}
                    className={`rounded-2xl border p-3.5 text-left transition flex items-start justify-between gap-2 ${
                      !item.unlocked
                        ? "bg-cream-100/70 border-cream-200 opacity-65 cursor-not-allowed"
                        : isEquipped
                        ? "bg-mint-100 border-mint-400 text-plum-900"
                        : "bg-white border-lavender-100 hover:bg-lavender-50"
                    }`}
                  >
                    <div>
                      <div className="text-xs font-extrabold text-plum-900">
                        {item.name}
                      </div>
                      <div className="text-[11px] text-plum-700 mt-0.5">
                        {item.unlocked
                          ? item.description
                          : `Unlocks gently at ${item.unlock_xp} XP`}
                      </div>
                    </div>
                    {!item.unlocked ? (
                      <Lock className="w-4 h-4 text-plum-700/60 shrink-0" />
                    ) : isEquipped ? (
                      <Check className="w-4 h-4 text-mint-600 shrink-0" />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-2xl bg-lavender-500 hover:bg-lavender-600 text-white font-bold py-3 text-sm shadow-sm transition disabled:opacity-60"
          >
            {saving ? "Saving Changes..." : "Save Companion Customization"}
          </button>
        </form>
      </div>
    </div>
  );
}

