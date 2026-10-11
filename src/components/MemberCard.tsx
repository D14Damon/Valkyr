import { ShieldCheck, Edit3, Trash2, Eye } from 'lucide-react';
import { ClanMember } from '../types/clan';

interface Props {
  member: ClanMember;
  onSelect: (member: ClanMember) => void;
  isAdmin: boolean;
  onEdit: (member: ClanMember) => void;
  onDelete: (memberId: string) => void;
}

export function MemberCard({ member, onSelect, isAdmin, onEdit, onDelete }: Props) {
  const getDepartmentBadgeStyle = (dept: string) => {
    switch (dept?.toLowerCase()) {
      case 'executive':
      case 'leadership':
        return 'bg-amber-950/40 text-amber-300 border-amber-600/40';
      case 'pro player':
      case 'competitive':
        return 'bg-purple-950/40 text-purple-300 border-purple-600/40';
      case 'content creator':
        return 'bg-indigo-950/40 text-indigo-300 border-indigo-600/40';
      case 'sniper':
        return 'bg-emerald-950/40 text-emerald-300 border-emerald-600/40';
      default:
        return 'bg-zinc-800 text-zinc-300 border-zinc-700';
    }
  };

  return (
    <div
      onClick={() => onSelect(member)}
      className="group relative bg-zinc-900/70 hover:bg-zinc-900/95 border border-zinc-800/90 hover:border-purple-500/50 rounded-2xl overflow-hidden shadow-lg hover:shadow-purple-950/30 transition-all duration-300 cursor-pointer flex flex-col"
    >
      {/* Top Photo Container */}
      <div className="relative aspect-[16/11] sm:aspect-[4/3] w-full overflow-hidden bg-zinc-950">
        <img
          src={member.photoBase64 || '/valkyr-logo.png'}
          alt={member.name || member.ign}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            e.currentTarget.src = '/valkyr-logo.png';
          }}
        />

        {/* Ambient Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />

        {/* Verified Badge */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-950/80 backdrop-blur-md border border-emerald-500/40 text-emerald-400 text-[11px] font-semibold">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Verified</span>
        </div>

        {/* Clan Tag / Division */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md border border-white/10 text-[10px] font-mono font-bold text-purple-400">
          <span>{member.clanTag || 'VALKYR'}</span>
        </div>

        {/* Verification code */}
        {member.verificationCode && (
          <div className="absolute bottom-2 left-2.5 text-[10px] font-mono text-zinc-400 bg-black/60 px-1.5 py-0.5 rounded backdrop-blur-xs">
            {member.verificationCode}
          </div>
        )}
      </div>

      {/* Card Content Details */}
      <div className="p-4 flex flex-col flex-1 justify-between">
        <div className="space-y-1.5">
          {/* Real Name */}
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium">
            <span className="text-purple-400 text-sm font-black leading-none">◤</span>
            <span className="truncate">{member.name || 'Member'}</span>
          </div>

          {/* IGN */}
          <h3 className="text-base sm:text-lg font-bold text-white tracking-wide group-hover:text-purple-400 transition-colors truncate">
            {member.ign}
          </h3>

          {/* Department Badges */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {member.department && (
              <span
                className={`text-[11px] font-medium px-2 py-0.5 rounded-md border ${getDepartmentBadgeStyle(
                  member.department
                )}`}
              >
                {member.department}
              </span>
            )}
            {member.game && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700">
                {member.game}
              </span>
            )}
          </div>

          {/* Role Description */}
          {member.role && (
            <p className="text-xs text-zinc-400 font-normal pt-1 line-clamp-1">
              {member.role}
            </p>
          )}
        </div>

        {/* Bottom bar & Admin controls */}
        <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex items-center justify-between text-xs">
          <span className="text-[11px] text-zinc-500 flex items-center gap-1 group-hover:text-zinc-300 transition-colors">
            <Eye className="w-3.5 h-3.5 text-zinc-400" />
            Inspect Dossier
          </span>

          {isAdmin ? (
            <div
              className="flex items-center gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => onEdit(member)}
                className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition"
                title="Edit member"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onDelete(member.id)}
                className="p-1 rounded bg-red-950/50 hover:bg-red-900 text-red-400 hover:text-red-200 transition"
                title="Delete member"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <span className="text-[10px] font-mono text-zinc-600">
              {member.joinDate}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
