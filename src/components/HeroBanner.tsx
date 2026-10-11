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
    <div className="relative overflow-hidden bg-zinc-950 border-b border-zinc-850">
      {/* Clan Hero Graphic Banner with VALKYR Logo */}
      <div className="relative w-full py-10 sm:py-14 bg-gradient-to-b from-purple-950/20 via-zinc-950 to-zinc-950 flex flex-col items-center justify-center overflow-hidden">
        {/* Futuristic subtle background particles & grid */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(rgba(168, 85, 247, 0.4) 1px, transparent 1px), linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px)`,
            backgroundSize: '32px 32px, 64px 64px',
          }}
        />

        {/* Ambient violet and crimson glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 sm:w-[500px] h-48 bg-purple-600/15 blur-3xl rounded-full pointer-events-none" />

        {/* Center Official Clan Emblem & Title */}
        <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-3xl">
          {/* VALKYR Official Clan Logo */}
          <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-2xl overflow-hidden border-2 border-purple-500/40 shadow-2xl shadow-purple-950/80 mb-4 group bg-black/60 backdrop-blur-sm p-1">
            <img
              src="/valkyr-logo.png"
              alt="VALKYR Clan Logo"
              className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 rounded-xl ring-1 ring-white/10 pointer-events-none" />
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-widest uppercase font-mono drop-shadow-[0_0_25px_rgba(168,85,247,0.4)]">
            {settings.name || 'VALKYR'}
          </h1>
          <p className="text-xs sm:text-sm text-purple-300/80 font-mono tracking-wider mt-1 uppercase font-semibold">
            Official Clan Member Directory
          </p>

          <p className="text-xs sm:text-sm text-zinc-300 max-w-xl mx-auto mt-3 leading-relaxed">
            Search any in-game name (IGN) or member to verify their official legitimacy within the clan.
          </p>

          {/* Quick Roster Search */}
          <div className="w-full max-w-lg mt-6">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search member by IGN, Name, or Role..."
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-900/90 border border-zinc-700/80 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-white"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Verification trigger badge */}
          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={onOpenLegitimacyChecker}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900/90 hover:bg-zinc-800 text-xs font-semibold text-emerald-400 border border-emerald-500/30 transition shadow-sm"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verify Clan Legitimacy</span>
              <span className="text-zinc-500 font-mono text-[11px]">({memberCount} Registered)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
