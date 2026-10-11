import { useState } from 'react';
import { ShieldCheck, ShieldAlert, Search, X, Check, Copy, ExternalLink } from 'lucide-react';
import { ClanMember } from '../types/clan';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  members: ClanMember[];
  onSelectMember: (member: ClanMember) => void;
}

export function LegitimacyCheckerModal({ isOpen, onClose, members, onSelectMember }: Props) {
  const [query, setQuery] = useState('');
  const [searched, setSearched] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const normalizedQuery = query.trim().toLowerCase();
  const matchedMembers = normalizedQuery
    ? members.filter(
        (m) =>
          m.ign?.toLowerCase().includes(normalizedQuery) ||
          m.name?.toLowerCase().includes(normalizedQuery) ||
          m.verificationCode?.toLowerCase().includes(normalizedQuery)
      )
    : [];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearched(true);
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(code);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden p-6">
        {/* Glow ambient accent */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-72 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-wide">
                VALKYR Legitimacy Verification
              </h3>
              <p className="text-xs text-zinc-400">
                Official clan directory authentication registry
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSearch} className="mt-5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
            Search In-Game Name (IGN), Player Name, or Verification ID
          </label>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSearched(true);
              }}
              placeholder="e.g. In-Game Name or VKR-001..."
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-700/80 rounded-xl text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition"
              autoFocus
            />
          </div>
        </form>

        <div className="mt-5 max-h-80 overflow-y-auto space-y-3 pr-1">
          {searched && matchedMembers.length > 0 ? (
            matchedMembers.map((member) => (
              <div
                key={member.id}
                className="p-3.5 bg-zinc-900/90 border border-zinc-800 hover:border-purple-500/50 rounded-xl flex items-center justify-between gap-3 transition group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={member.photoBase64 || '/valkyr-logo.png'}
                    alt={member.name}
                    className="w-12 h-12 rounded-lg object-cover border border-zinc-700 shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-white text-sm truncate">
                        {member.ign}
                      </span>
                      <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    </div>
                    <p className="text-xs text-zinc-400 truncate">{member.name}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      {member.department && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                          {member.department}
                        </span>
                      )}
                      <span className="text-[10px] text-zinc-400 truncate">
                        {member.role}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  {member.verificationCode && (
                    <button
                      onClick={() => copyCode(member.verificationCode)}
                      className="flex items-center gap-1 text-[11px] font-mono text-zinc-400 hover:text-white px-2 py-1 rounded bg-zinc-800/80 hover:bg-zinc-700 transition"
                      title="Copy official ID"
                    >
                      {copiedId === member.verificationCode ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>{member.verificationCode}</span>
                        </>
                      )}
                    </button>
                  )}
                  <button
                    onClick={() => {
                      onSelectMember(member);
                      onClose();
                    }}
                    className="text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1"
                  >
                    View Dossier
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))
          ) : searched && query ? (
            <div className="p-6 text-center bg-red-950/20 border border-red-900/40 rounded-xl">
              <ShieldAlert className="w-8 h-8 text-red-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-white">No Official Record Found</p>
              <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
                No member with "<span className="text-red-400 font-mono">{query}</span>" is currently registered in VALKYR.
                Always cross-check to prevent impostor transactions.
              </p>
            </div>
          ) : (
            <div className="p-6 text-center text-zinc-500 text-xs">
              Type an in-game name or player identity above to check official legitimacy.
            </div>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-500">
          <span>VALKYR Official Ledger</span>
          <span>{members.length} Registered Members</span>
        </div>
      </div>
    </div>
  );
}
