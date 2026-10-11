import { ShieldCheck, Eye, Edit3, Trash2, Archive, RotateCcw } from 'lucide-react';
import { ClanMember } from '../types/clan';

interface Props {
  members: ClanMember[];
  onSelect: (member: ClanMember) => void;
  isAdmin: boolean;
  onEdit: (member: ClanMember) => void;
  onDelete: (memberId: string) => void;
  onArchive: (member: ClanMember) => void;
}

export function RosterTableView({
  members,
  onSelect,
  isAdmin,
  onEdit,
  onDelete,
  onArchive,
}: Props) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-zinc-850 bg-zinc-900/50 shadow-xl">
      <table className="w-full text-left text-xs">
        <thead className="bg-zinc-950/80 border-b border-zinc-800 text-zinc-400 font-mono uppercase tracking-wider text-[11px]">
          <tr>
            <th className="px-4 py-3.5">Member / IGN</th>
            <th className="px-4 py-3.5">Real Name</th>
            <th className="px-4 py-3.5">Division</th>
            <th className="px-4 py-3.5">Role</th>
            <th className="px-4 py-3.5">Verification Code</th>
            <th className="px-4 py-3.5">Status</th>
            <th className="px-4 py-3.5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/60">
          {members.map((member) => (
            <tr
              key={member.id}
              onClick={() => onSelect(member)}
              className="hover:bg-zinc-850/60 transition cursor-pointer group"
            >
              {/* IGN */}
              <td className="px-4 py-3.5">
                <div className="flex items-center gap-3">
                  <img
                    src={member.photoBase64 || '/valkyr-logo.png'}
                    alt={member.name || member.ign}
                    className="w-10 h-10 rounded-lg object-cover border border-zinc-700 shrink-0"
                    onError={(e) => {
                      e.currentTarget.src = '/valkyr-logo.png';
                    }}
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-white text-sm group-hover:text-purple-400 transition">
                        {member.ign}
                      </span>
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    {member.archived && <span className="text-[10px] font-bold uppercase text-amber-300">Archived</span>}
                    <span className="text-[10px] font-mono text-purple-400 uppercase">
                      {member.clanTag || 'VALKYR'}
                    </span>
                  </div>
                </div>
              </td>

              {/* Real Name */}
              <td className="px-4 py-3.5 text-zinc-300 font-medium">
                {member.name}
              </td>

              {/* Department */}
              <td className="px-4 py-3.5">
                <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700 text-[11px]">
                  {member.department}
                </span>
              </td>

              {/* Role */}
              <td className="px-4 py-3.5 text-zinc-400">
                {member.role}
              </td>

              {/* Verification Code */}
              <td className="px-4 py-3.5 font-mono text-emerald-400 text-[11px]">
                {member.verificationCode}
              </td>

              {/* Status */}
              <td className="px-4 py-3.5">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  {member.status}
                </span>
              </td>

              {/* Actions */}
              <td className="px-4 py-3.5 text-right">
                <div
                  className="flex items-center justify-end gap-1.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => onSelect(member)}
                    className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition"
                    title="View Dossier"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  {isAdmin && (
                    <>
                      <button
                        onClick={() => onEdit(member)}
                        className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition"
                        title="Edit member"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onArchive(member)}
                        className="rounded-lg bg-zinc-800 p-1.5 text-zinc-300 transition hover:bg-zinc-700 hover:text-white"
                        title={member.archived ? 'Restore member' : 'Archive member'}
                      >
                        {member.archived ? <RotateCcw className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
                      </button>
                      <button
                        onClick={() => onDelete(member.id)}
                        className="p-1.5 rounded-lg bg-red-950/50 hover:bg-red-900 text-red-400 hover:text-red-200 transition"
                        title="Delete member"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
