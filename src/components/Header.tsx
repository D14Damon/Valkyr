import { useState } from 'react';
import {
  ShieldCheck,
  UserPlus,
  Settings,
  Lock,
  Menu,
  X,
} from 'lucide-react';
import { ClanSettings } from '../types/clan';

interface Props {
  settings: ClanSettings;
  isAdmin: boolean;
  onOpenLegitimacyChecker: () => void;
  onOpenAddMember: () => void;
  onOpenAdminSettings: () => void;
  onOpenAdminAuth: () => void;
  memberCount: number;
}

export function Header({
  settings,
  isAdmin,
  onOpenLegitimacyChecker,
  onOpenAddMember,
  onOpenAdminSettings,
  onOpenAdminAuth,
  memberCount,
}: Props) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-850">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3.5">
            <div className="relative group">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl overflow-hidden border border-zinc-700 bg-zinc-900 shadow-lg shadow-purple-950/30 flex items-center justify-center p-0.5">
                <img
                  src="/valkyr-logo.png"
                  alt="VALKYR Clan Logo"
                  className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    // Fallback if needed
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
              <div className="absolute -inset-1 bg-purple-600/20 rounded-xl blur-xs -z-10 group-hover:bg-purple-600/40 transition" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-2xl font-black text-white tracking-widest uppercase font-mono">
                  {settings.name || 'VALKYR'}
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold tracking-wider text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  <ShieldCheck className="w-3 h-3" />
                  OFFICIAL
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-medium">
                Official Clan Member Directory
              </p>
            </div>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            {/* Quick Legitimacy Check button */}
            <button
              onClick={onOpenLegitimacyChecker}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-850 text-zinc-200 hover:text-white text-xs font-semibold border border-zinc-800 hover:border-zinc-700 transition shadow-sm"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Verify Legitimacy</span>
              <span className="px-1.5 py-0.5 text-[10px] rounded bg-zinc-800 text-zinc-400 font-mono">
                {memberCount}
              </span>
            </button>

            {/* Admin Controls */}
            {isAdmin ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={onOpenAddMember}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-purple-950/40 transition"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Add Member</span>
                </button>

                <button
                  onClick={onOpenAdminSettings}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-850 text-zinc-300 hover:text-white text-xs font-semibold border border-zinc-800 transition"
                  title="Admin Settings & Database"
                >
                  <Settings className="w-4 h-4 text-purple-400" />
                  <span>Admin</span>
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAdminAuth}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs font-medium border border-zinc-800 transition"
              >
                <Lock className="w-3.5 h-3.5 text-zinc-500" />
                <span>Admin Login</span>
              </button>
            )}
          </div>

          {/* Mobile menu trigger */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={onOpenLegitimacyChecker}
              className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-emerald-400"
              title="Verify Legitimacy"
            >
              <ShieldCheck className="w-5 h-5" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-zinc-800 bg-zinc-950 px-4 pt-3 pb-5 space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between text-xs text-zinc-400 px-1 pb-1">
            <span>Roster: {memberCount} Verified</span>
            <span className="font-mono text-[10px] text-purple-400">VALKYR CLAN</span>
          </div>

          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenLegitimacyChecker();
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-zinc-900 text-white text-xs font-semibold border border-zinc-800"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Verify Player Legitimacy</span>
          </button>

          {isAdmin ? (
            <div className="space-y-2 pt-1">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAddMember();
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-purple-600 text-white text-xs font-bold shadow-md"
              >
                <UserPlus className="w-4 h-4" />
                <span>Add Member (Custom Photo)</span>
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAdminSettings();
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-zinc-900 text-zinc-300 text-xs font-semibold border border-zinc-800"
              >
                <Settings className="w-4 h-4 text-purple-400" />
                <span>Admin Dashboard & Database</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenAdminAuth();
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-zinc-900 text-zinc-400 text-xs font-medium border border-zinc-800"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Admin Login</span>
            </button>
          )}
        </div>
      )}
    </header>
  );
}
