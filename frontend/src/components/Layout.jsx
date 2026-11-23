import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  BookOpenCheck,
  HeartHandshake,
  Home,
  LogOut,
  Menu,
  MessageCircleHeart,
  PawPrint,
  ShieldCheck,
  SmilePlus,
  Sparkles,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import PetAvatar from "./PetAvatar";
import PrivacyModal from "./PrivacyModal";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: Home },
  { to: "/chat", label: "AI Companion", icon: MessageCircleHeart },
  { to: "/mood", label: "Mood Tracker", icon: SmilePlus },
  { to: "/activities", label: "Wellness Activities", icon: Sparkles },
  { to: "/pet", label: "Pet Companion", icon: PawPrint },
  { to: "/admin/documents", label: "Knowledge PDFs", icon: BookOpenCheck },
];

export default function Layout({ children }) {
  const { user, pet, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
      isActive
        ? "bg-lavender-500 text-white shadow-sm"
        : "text-plum-700 hover:bg-lavender-100/70 hover:text-plum-900"
    }`;

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-cream-50/90 backdrop-blur-md border-b border-lavender-100">
        <Link to="/dashboard" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-lavender-400 to-mint-400 flex items-center justify-center text-white shadow-sm">
            <PawPrint className="w-5 h-5" />
          </div>
          <span className="font-display text-lg font-extrabold text-plum-900">MindMate</span>
        </Link>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-xl bg-lavender-50 text-plum-800"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Mobile Nav Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-[61px] z-40 bg-cream-50/95 backdrop-blur-md p-4 overflow-y-auto">
          <nav className="space-y-1.5">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={navLinkClass}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
          <div className="mt-6 pt-4 border-t border-lavender-100 space-y-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setPrivacyOpen(true);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold text-plum-700 hover:bg-mint-50"
            >
              <ShieldCheck className="w-4 h-4 text-mint-600" />
              Privacy & Data Controls
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold text-rose-600 hover:bg-rose-50"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-72 lg:flex-col lg:fixed lg:inset-y-0 p-4">
        <div className="flex flex-col h-full rounded-3xl bg-white/85 backdrop-blur-md border border-lavender-100 shadow-cozy p-5">
          <Link to="/dashboard" className="flex items-center gap-3 px-2 mb-5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-lavender-500 to-mint-400 flex items-center justify-center text-white shadow-sm">
              <PawPrint className="w-5 h-5" />
            </div>
            <div>
              <span className="font-display text-xl font-extrabold text-plum-900 block leading-tight">
                MindMate
              </span>
              <span className="text-[11px] font-medium text-plum-700/75">
                Cozy Student Companion
              </span>
            </div>
          </Link>

          {/* Mini Pet Status Badge */}
          {pet && (
            <Link
              to="/pet"
              className="mb-5 flex items-center gap-3 rounded-2xl bg-gradient-to-r from-lavender-50 to-mint-50 border border-lavender-100 p-3 hover:shadow-sm transition"
            >
              <PetAvatar
                species={pet.species}
                colorTheme={pet.color_theme}
                mood={pet.mood}
                accessory={pet.equipped_accessory}
                stage={pet.stage}
                size={54}
                interactive={false}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <p className="text-sm font-bold text-plum-900 truncate">{pet.name}</p>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white text-lavender-600">
                    Stage {pet.stage}
                  </span>
                </div>
                <p className="text-xs text-plum-700 capitalize">
                  Feeling {pet.mood} • {pet.xp} XP
                </p>
              </div>
            </Link>
          )}

          <nav className="space-y-1 flex-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink key={item.to} to={item.to} className={navLinkClass}>
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          <div className="pt-4 mt-4 border-t border-lavender-100 space-y-2">
            <div className="rounded-2xl bg-skysoft-50 p-3 text-[11px] text-plum-700 leading-relaxed flex items-start gap-2">
              <HeartHandshake className="w-4 h-4 text-skysoft-500 shrink-0 mt-0.5" />
              <span>
                Friendly wellness space, not a medical or clinical therapy service.
              </span>
            </div>

            <button
              onClick={() => setPrivacyOpen(true)}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-xs font-semibold text-plum-700 hover:bg-mint-50 transition"
            >
              <ShieldCheck className="w-4 h-4 text-mint-600" />
              Privacy & Data Controls
            </button>

            <div className="flex items-center justify-between px-3 py-2 rounded-2xl bg-cream-100/80">
              <div className="min-w-0">
                <p className="text-xs font-bold text-plum-900 truncate">{user?.name}</p>
                <p className="text-[11px] text-plum-700/75 capitalize">{user?.role} account</p>
              </div>
              <button
                onClick={handleLogout}
                title="Sign out"
                className="p-2 rounded-xl text-plum-700 hover:bg-white hover:text-rose-600 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:pl-72">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          {children}
        </div>
      </main>

      <PrivacyModal open={privacyOpen} onClose={() => setPrivacyOpen(false)} />
    </div>
  );
}

