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
    <header className="sticky top-0 z-40 px-4 sm:px-6 lg:px-8 pt-4">
      <div className="mx-auto max-w-7xl rounded-2xl border border-white/10 bg-zinc-950/55 px-4 py-3 shadow-[0_12px_45px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
        <div className="flex items-center justify-between h-16 sm:h-20">
          <div className="flex items-center gap-3.5">
            <div className="relative group">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl overflow-hidden border border-white/10 bg-zinc-900/80 shadow-[0_0_30px_rgba(168,85,247,0.35)] flex items-center justify-center p-0.5">
                <img
                  src="/valkyr-logo.png"
                  alt="VALKYR Clan Logo"
                  className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
              <div className="absolute -inset-1 bg-purple-600/20 rounded-2xl blur-md -z-10 group-hover:bg-purple-600/30 transition" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-2xl font-black text-white tracking-[0.22em] uppercase font-mono">
                  {settings.name || 'VALKYR'}
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold tracking-[0.18em] text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-400/25">
                  <ShieldCheck className="w-3 h-3" />
                  OFFICIAL
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-medium tracking-[0.18em] uppercase">
                Official Clan Member Directory
              </p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={onOpenLegitimacyChecker}
              className="group flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-500/5 px-3.5 py-2 text-xs font-semibold text-emerald-200 transition hover:border-emerald-300/35 hover:bg-emerald-500/10"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400 transition group-hover:scale-110" />
              <span>Verify Legitimacy</span>
              <span className="rounded-full border border-white/10 bg-zinc-950/80 px-1.5 py-0.5 text-[10px] font-mono text-zinc-300">
                {memberCount}
              </span>
            </button>

            {isAdmin ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={onOpenAddMember}
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-[0_12px_24px_rgba(168,85,247,0.35)] transition hover:brightness-110"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Add Member</span>
                </button>

                <button
                  onClick={onOpenAdminSettings}
                  className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-zinc-900/80 px-3 py-2 text-xs font-semibold text-zinc-200 transition hover:border-white/20 hover:bg-zinc-800/90"
                  title="Admin Settings & Database"
                >
                  <Settings className="w-4 h-4 text-purple-400" />
                  <span>Admin</span>
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAdminAuth}
                className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-zinc-900/70 px-3.5 py-2 text-xs font-medium text-zinc-200 transition hover:border-white/20 hover:bg-zinc-800/90"
              >
                <Lock className="w-3.5 h-3.5 text-zinc-400" />
                <span>Admin Login</span>
              </button>
            )}
          </div>

          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={onOpenLegitimacyChecker}
              className="rounded-xl border border-emerald-400/20 bg-emerald-500/5 p-2 text-emerald-400"
              title="Verify Legitimacy"
            >
              <ShieldCheck className="w-5 h-5" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-xl border border-white/10 bg-zinc-900/80 p-2 text-zinc-300"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="mx-auto mt-3 max-w-7xl rounded-2xl border border-white/10 bg-zinc-950/75 px-4 pt-3 pb-5 shadow-[0_18px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl md:hidden animate-fadeIn">
          <div className="flex items-center justify-between px-1 pb-2 text-xs uppercase tracking-[0.18em] text-zinc-400">
            <span>Roster: {memberCount} Verified</span>
            <span className="font-mono text-[10px] text-purple-300">VALKYR CLAN</span>
          </div>

          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenLegitimacyChecker();
            }}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-500/5 py-2.5 text-xs font-semibold text-emerald-200"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Verify Player Legitimacy</span>
          </button>

          {isAdmin ? (
            <div className="space-y-2 pt-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAddMember();
                }}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 py-2.5 text-xs font-bold text-white"
              >
                <UserPlus className="w-4 h-4" />
                <span>Add Member</span>
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAdminSettings();
                }}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-zinc-900 py-2.5 text-xs font-semibold text-zinc-200"
              >
                <Settings className="w-4 h-4 text-purple-400" />
                <span>Admin Dashboard</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenAdminAuth();
              }}
              className="mt-2 w-full flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-zinc-900 py-2.5 text-xs font-medium text-zinc-300"
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
