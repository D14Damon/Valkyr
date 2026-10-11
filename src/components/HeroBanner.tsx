import { ShieldCheck, Search, Users, Trophy } from 'lucide-react';
import { ClanSettings } from '../types/clan';

interface Props {
  settings: ClanSettings;
  memberCount: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenLegitimacyChecker: () => void;
}

export function HeroBanner({
  settings,
  memberCount,
  searchQuery,
  onSearchChange,
  onOpenLegitimacyChecker,
}: Props) {
  return (
    <section className="relative overflow-hidden px-4 pb-8 pt-6 sm:px-6 lg:px-8">
      <div className="hero-shell relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] border border-white/10 bg-black/95 px-6 py-8 shadow-[0_25px_80px_rgba(89,44,130,0.38)] sm:px-10 sm:py-12">
        <div className="hero-grid" aria-hidden="true" />
        <div className="hero-glow hero-glow-left" aria-hidden="true" />
        <div className="hero-glow hero-glow-right" aria-hidden="true" />

        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="mb-5 flex items-center gap-3 rounded-full border border-purple-400/25 bg-purple-500/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.28em] text-purple-200 shadow-[0_0_25px_rgba(168,85,247,0.2)]">
            <Trophy className="w-3.5 h-3.5 text-purple-300" />
            Elite Roster Network
          </div>

          <div className="relative mb-5 w-28 h-28 sm:w-36 sm:h-36 rounded-[1.75rem] overflow-hidden border-2 border-purple-400/40 bg-black/90 p-1 shadow-[0_0_40px_rgba(168,85,247,0.35)] backdrop-blur-sm">
            <img
              src="/valkyr-logo.png"
              alt="VALKYR Clan Logo"
              className="w-full h-full object-cover rounded-[1.2rem]"
            />
          </div>

          <h1 className="text-3xl font-black tracking-[0.16em] text-white uppercase sm:text-4xl lg:text-5xl">
            {settings.name || 'VALKYR'}
          </h1>
          <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-purple-200 sm:text-xs">
            Official Clan Member Directory
          </p>

          <p className="mt-5 max-w-xl text-sm leading-7 text-zinc-300 sm:text-base">
            Search any in-game name, review verified roster details, and keep the clan network organized with a premium, command-center experience.
          </p>

          <div className="mt-7 w-full max-w-xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search member by IGN, Name, or Role..."
                className="w-full rounded-2xl border border-white/10 bg-zinc-950/95 py-3.5 pl-11 pr-12 text-sm text-white placeholder:text-zinc-500 focus:border-purple-400/60 focus:outline-none focus:ring-2 focus:ring-purple-500/25"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg bg-white/5 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-zinc-300 transition hover:text-white"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={onOpenLegitimacyChecker}
              className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-500/18 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200 transition hover:border-emerald-300/70 hover:bg-emerald-500/24"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Verify Legitimacy
            </button>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-zinc-900/95 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-300">
              <Users className="w-3.5 h-3.5 text-purple-300" />
              {memberCount} Registered
            </div>
          </div>

          <div className="mt-8 grid w-full max-w-4xl gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-black/95 p-4 text-left shadow-[0_10px_35px_rgba(0,0,0,0.5)] backdrop-blur-xl">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-purple-200">
                <Users className="w-3.5 h-3.5" />
                Roster
              </div>
              <div className="text-2xl font-black text-white">{memberCount}</div>
              <p className="mt-1 text-sm text-zinc-300">Verified clan members in the live directory.</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/95 p-4 text-left shadow-[0_10px_35px_rgba(0,0,0,0.5)] backdrop-blur-xl">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5" />
                Verified
              </div>
              <div className="text-2xl font-black text-white">Live</div>
              <p className="mt-1 text-sm text-zinc-300">Check legitimacy and confirmation status instantly.</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/95 p-4 text-left shadow-[0_10px_35px_rgba(0,0,0,0.5)] backdrop-blur-xl">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-orange-200">
                <Trophy className="w-3.5 h-3.5" />
                Access
              </div>
              <div className="text-2xl font-black text-white">Admin</div>
              <p className="mt-1 text-sm text-zinc-300">Manage members, updates, and roster control easily.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
