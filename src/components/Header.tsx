import { useState } from 'react';
import {
  UserPlus,
  Settings,
  Lock,
  Menu,
  X,
} from 'lucide-react';
import logoImage from '../assets/images/LOGO.png';
import { ClanSettings } from '../types/clan';

interface Props {
  settings: ClanSettings;
  isAdmin: boolean;
  onOpenAddMember: () => void;
  onOpenAdminSettings: () => void;
  onOpenAdminAuth: () => void;
  memberCount: number;
}

export function Header({
  settings,
  isAdmin,
  onOpenAddMember,
  onOpenAdminSettings,
  onOpenAdminAuth,
  memberCount,
}: Props) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40">
      <div className="w-full overflow-hidden border border-white/10 bg-[#090d14]/90 shadow-[0_18px_48px_rgba(0,0,0,0.52)] ring-1 ring-white/5">
        <div className="relative flex h-28 items-center justify-center overflow-hidden px-4 sm:px-6 lg:px-8 sm:h-32 lg:h-36">
          <img
            src={logoImage}
            alt="VALKYR Clan Logo"
            className="absolute inset-0 h-full w-full object-cover object-center opacity-20"
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.1),transparent_45%),linear-gradient(90deg,rgba(0,0,0,0.84),rgba(0,0,0,0.58),rgba(0,0,0,0.84))]" />

          <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center">
            <h1
              className="pointer-events-auto text-[2.4rem] font-black uppercase leading-none text-white sm:text-[3.1rem] lg:text-[5rem]"
              style={{
                fontFamily: 'Impact, "Arial Black", sans-serif',
                letterSpacing: '0.08em',
                textShadow:
                  '0 2px 0 rgba(0,0,0,0.9), 0 8px 25px rgba(168,85,247,0.22), 0 0 22px rgba(255,255,255,0.18)',
                transform: 'skewX(-4deg)',
              }}
            >
              {settings.name || 'VALKYR'}
            </h1>
            <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-purple-100 sm:text-xs">
              Official Clan Member Directory
            </p>
          </div>

          <div className="absolute right-4 z-20 hidden items-center gap-3 md:flex">
            {isAdmin ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={onOpenAddMember}
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-[0_12px_24px_rgba(168,85,247,0.4)] transition hover:brightness-110"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Add Member</span>
                </button>

                <button
                  onClick={onOpenAdminSettings}
                  className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-zinc-900/75 px-3 py-2 text-xs font-semibold text-zinc-200 transition hover:border-white/20 hover:bg-zinc-800/95"
                  title="Admin Settings & Database"
                >
                  <Settings className="w-4 h-4 text-purple-400" />
                  <span>Admin</span>
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAdminAuth}
                className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-zinc-900/80 px-3.5 py-2 text-xs font-medium text-zinc-200 transition hover:border-white/20 hover:bg-zinc-800/95"
              >
                <Lock className="w-3.5 h-3.5 text-zinc-400" />
                <span>Admin Login</span>
              </button>
            )}
          </div>

          <div className="relative z-10 flex items-center gap-2 md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-xl border border-white/10 bg-zinc-900/60 p-2 text-zinc-300"
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
