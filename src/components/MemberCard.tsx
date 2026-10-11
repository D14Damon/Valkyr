import { ShieldCheck, Edit3, Trash2, Archive, RotateCcw } from 'lucide-react';
import { ClanMember } from '../types/clan';

interface Props {
  member: ClanMember;
  onSelect: (member: ClanMember) => void;
  isAdmin: boolean;
  onEdit: (member: ClanMember) => void;
  onDelete: (memberId: string) => void;
  onArchive: (member: ClanMember) => void;
}

export function MemberCard({ member, onSelect, isAdmin, onEdit, onDelete, onArchive }: Props) {
  const getDepartmentBadgeStyle = (dept: string) => {
    switch (dept?.toLowerCase()) {
      case 'executive':
      case 'leadership':
        return 'bg-amber-500/20 text-amber-200';
      case 'pro player':
      case 'competitive':
        return 'bg-purple-500/20 text-purple-200';
      case 'content creator':
        return 'bg-indigo-500/20 text-indigo-200';
      case 'sniper':
        return 'bg-emerald-500/20 text-emerald-200';
      default:
        return 'bg-zinc-700 text-zinc-200';
    }
  };

  return (
    <div
      onClick={() => onSelect(member)}
      className="group relative flex cursor-pointer flex-col overflow-hidden rounded-xl border border-white/[0.06] bg-zinc-900/90 shadow-lg transition-all duration-300 hover:border-purple-500/40 hover:bg-zinc-900 hover:shadow-purple-950/30"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-zinc-950">
        <img
          src={member.photoBase64 || '/valkyr-logo.png'}
          alt={member.name || member.ign}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            e.currentTarget.src = '/valkyr-logo.png';
          }}
        />
        {member.archived && (
          <span className="absolute left-2 top-2 rounded-full border border-amber-300/20 bg-black/75 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-200">
            Archived
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="shrink-0 text-xs font-black italic text-orange-500">◢</span>
            <h3 className="truncate text-sm font-bold text-white transition-colors group-hover:text-purple-300">
              {member.name || member.ign}
            </h3>
            {member.verified && (
              <ShieldCheck className="ml-auto h-3.5 w-3.5 shrink-0 text-emerald-400" />
            )}
          </div>
          <p className="mt-2 truncate text-xs text-zinc-300">{member.ign}</p>

          <div className="mt-2 flex min-h-5 flex-wrap gap-1.5">
            {member.department && (
              <span
                className={`rounded px-2 py-0.5 text-[10px] font-medium ${getDepartmentBadgeStyle(member.department)}`}
              >
                {member.department}
              </span>
            )}
            {member.game && (
              <span className="rounded bg-zinc-800 px-2 py-0.5 text-[10px] font-medium text-zinc-300">
                {member.game}
              </span>
            )}
          </div>

          {member.role && (
            <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-zinc-300">
              {member.role}
            </p>
          )}
        </div>

        {isAdmin && (
          <div className="mt-auto flex justify-end gap-1 pt-3">
            <div onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => onEdit(member)}
                className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition"
                title="Edit member"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onArchive(member)}
                className="rounded bg-zinc-800 p-1 text-zinc-300 transition hover:bg-zinc-700 hover:text-white"
                title={member.archived ? 'Restore member' : 'Archive member'}
              >
                {member.archived ? <RotateCcw className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
              </button>
              <button
                onClick={() => onDelete(member.id)}
                className="p-1 rounded bg-red-950/50 hover:bg-red-900 text-red-400 hover:text-red-200 transition"
                title="Delete member"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
