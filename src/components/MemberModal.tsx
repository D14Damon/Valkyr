import { useState } from 'react';
import {
  ShieldCheck,
  X,
  Share2,
  Check,
  Calendar,
  Gamepad2,
  Briefcase,
  Layers,
  Edit3,
  ExternalLink,
} from 'lucide-react';
import { ClanMember } from '../types/clan';

interface Props {
  member: ClanMember | null;
  onClose: () => void;
  isAdmin: boolean;
  onEdit: (member: ClanMember) => void;
}

export function MemberModal({ member, onClose, isAdmin, onEdit }: Props) {
  const [copied, setCopied] = useState(false);

  if (!member) return null;

  const handleCopyLink = () => {
    const url = `${window.location.origin}?member=${member.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getDepartmentColor = (dept: string) => {
    switch (dept?.toLowerCase()) {
      case 'executive':
      case 'leadership':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'pro player':
      case 'competitive':
        return 'bg-purple-500/10 text-purple-300 border-purple-500/30';
      case 'content creator':
        return 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30';
      case 'sniper':
        return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30';
      default:
        return 'bg-zinc-800 text-zinc-300 border-zinc-700';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Ambient background glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/80 bg-zinc-900/50 relative z-10 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-purple-600/20 text-purple-300 border border-purple-600/30">
              {member.clanTag || 'VALKYR'}
            </span>
            <span className="text-xs text-zinc-400">Official Player Dossier</span>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                onClick={() => {
                  onEdit(member);
                  onClose();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-white border border-zinc-700 transition"
              >
                <Edit3 className="w-3.5 h-3.5 text-purple-400" />
                Edit Member
              </button>
            )}
            <button
              onClick={handleCopyLink}
              className="p-1.5 rounded-lg bg-zinc-850 hover:bg-zinc-800 text-zinc-400 hover:text-white transition"
              title="Copy verification link"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-start">
            {/* Member Photo */}
            <div className="sm:col-span-5 relative group">
              <div className="relative aspect-[4/5] rounded-xl overflow-hidden border border-zinc-700/80 bg-zinc-900 shadow-xl">
                <img
                  src={member.photoBase64 || '/valkyr-logo.png'}
                  alt={member.name || member.ign}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => {
                    e.currentTarget.src = '/valkyr-logo.png';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/70 backdrop-blur-sm text-zinc-300 border border-white/10">
                    {member.verificationCode}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/40 backdrop-blur-sm">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Verified
                  </span>
                </div>
              </div>
            </div>

            {/* Member Info */}
            <div className="sm:col-span-7 space-y-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold tracking-wider text-purple-400 uppercase">
                    {member.clanTag || 'VALKYR'}
                  </span>
                  <span className="text-zinc-500">•</span>
                  <span className="text-xs text-zinc-400 font-mono">STATUS: {member.status}</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-0.5">
                  {member.ign}
                </h2>
                <p className="text-sm text-zinc-400 font-medium">{member.name}</p>
              </div>

              {/* Department & Role badges */}
              <div className="flex flex-wrap gap-2">
                {member.department && (
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-md border ${getDepartmentColor(
                      member.department
                    )}`}
                  >
                    {member.department}
                  </span>
                )}
                {member.role && (
                  <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-zinc-800/80 text-zinc-300 border border-zinc-700/60">
                    {member.role}
                  </span>
                )}
              </div>

              {/* Details List */}
              <div className="space-y-2 pt-2 border-t border-zinc-800/80 text-xs">
                {member.game && (
                  <div className="flex items-center justify-between py-1 border-b border-zinc-850">
                    <span className="text-zinc-400 flex items-center gap-1.5">
                      <Gamepad2 className="w-3.5 h-3.5 text-zinc-500" />
                      Game / Discipline
                    </span>
                    <span className="text-zinc-200 font-medium">{member.game}</span>
                  </div>
                )}

                {member.joinDate && (
                  <div className="flex items-center justify-between py-1 border-b border-zinc-850">
                    <span className="text-zinc-400 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                      Induction Date
                    </span>
                    <span className="text-zinc-200 font-medium">{member.joinDate}</span>
                  </div>
                )}

                {member.role && (
                  <div className="flex items-center justify-between py-1 border-b border-zinc-850">
                    <span className="text-zinc-400 flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-zinc-500" />
                      Assigned Role
                    </span>
                    <span className="text-zinc-200 font-medium">{member.role}</span>
                  </div>
                )}

                {member.verificationCode && (
                  <div className="flex items-center justify-between py-1">
                    <span className="text-zinc-400 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-zinc-500" />
                      Verification Code
                    </span>
                    <span className="font-mono text-emerald-400 font-semibold">{member.verificationCode}</span>
                  </div>
                )}
              </div>

              {/* Social Channels if provided */}
              {member.socials && Object.values(member.socials).some(Boolean) && (
                <div className="pt-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-2">
                    Official Channels
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {member.socials.tiktok && (
                      <a
                        href={member.socials.tiktok}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-zinc-300 hover:text-white px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 hover:border-zinc-700 flex items-center gap-1 transition"
                      >
                        TikTok
                        <ExternalLink className="w-3 h-3 text-zinc-500" />
                      </a>
                    )}
                    {member.socials.youtube && (
                      <a
                        href={member.socials.youtube}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-zinc-300 hover:text-white px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 hover:border-zinc-700 flex items-center gap-1 transition"
                      >
                        YouTube
                        <ExternalLink className="w-3 h-3 text-zinc-500" />
                      </a>
                    )}
                    {member.socials.facebook && (
                      <a
                        href={member.socials.facebook}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-zinc-300 hover:text-white px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 hover:border-zinc-700 flex items-center gap-1 transition"
                      >
                        Facebook
                        <ExternalLink className="w-3 h-3 text-zinc-500" />
                      </a>
                    )}
                    {member.socials.twitter && (
                      <a
                        href={member.socials.twitter}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-zinc-300 hover:text-white px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 hover:border-zinc-700 flex items-center gap-1 transition"
                      >
                        Twitter/X
                        <ExternalLink className="w-3 h-3 text-zinc-500" />
                      </a>
                    )}
                    {member.socials.instagram && (
                      <a
                        href={member.socials.instagram}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-zinc-300 hover:text-white px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 hover:border-zinc-700 flex items-center gap-1 transition"
                      >
                        Instagram
                        <ExternalLink className="w-3 h-3 text-zinc-500" />
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Member Bio */}
          {member.bio && (
            <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                Player Overview
              </h4>
              <p className="text-sm text-zinc-300 leading-relaxed italic">
                "{member.bio}"
              </p>
            </div>
          )}

          {/* Legitimacy Certification Box */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/30 via-zinc-900/60 to-zinc-900/60 border border-emerald-500/30 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-semibold text-white">
                VALKYR Legitimacy Certification
              </p>
              <p className="text-zinc-400 leading-normal">
                This player is officially registered and recognized as an active member of VALKYR. Any tournament participation, team representation, or deal under this IGN is verified legitimate.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
