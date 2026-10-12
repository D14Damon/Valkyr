import { FormEvent, useEffect, useState } from 'react';
import { auth } from '../firebase';
import {
  Bell,
  CalendarDays,
  Check,
  ExternalLink,
  Flag,
  History,
  Megaphone,
  ShieldCheck,
  Trophy,
  UserPlus,
  Users,
} from 'lucide-react';
import {
  AdminAccount,
  AdminRole,
  ClanAnnouncement,
  ClanEvent,
  ClanMember,
  ClanSettings,
  ImpersonationReport,
  MemberAuditEntry,
  RecruitmentApplication,
  TournamentResult,
} from '../types/clan';
import {
  deleteAdminAccount,
  deleteContentRecord,
  listAdminAccounts,
  saveAdminAccount,
  saveContentRecord,
  submitPublicRecord,
  syncTursoAdminRoles,
  subscribeToAnnouncements,
  subscribeToApplications,
  subscribeToAuditLog,
  subscribeToEvents,
  subscribeToReports,
  subscribeToResults,
} from '../services/communityService';
import { saveClanSettings } from '../services/memberService';

interface Props {
  members: ClanMember[];
  settings: ClanSettings;
  adminRole: AdminRole | null;
  adminEmail?: string;
  onUpdateSettings: (settings: ClanSettings) => void;
}

const panelClass = 'rounded-2xl border border-white/10 bg-gradient-to-br from-zinc-950/90 to-zinc-900/50 p-5 shadow-xl shadow-black/20 backdrop-blur-sm';
const inputClass = 'w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-purple-500 focus:outline-none';
const buttonClass = 'inline-flex items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50';
const communitySections = [
  { id: 'activity', label: 'Clan activity', description: 'Announcements, upcoming events and the latest roster updates.', icon: Bell },
  { id: 'recruitment', label: 'Recruitment', description: 'Explore open roles and apply to join the roster.', icon: UserPlus },
  { id: 'trust', label: 'Verification & rules', description: 'Verify a member, review clan guidelines or report impersonation.', icon: ShieldCheck },
  { id: 'community', label: 'Community', description: 'Connect through official VALKYR channels and community resources.', icon: Users },
] as const;
type CommunitySection = (typeof communitySections)[number]['id'];

function formatDate(date: string): string {
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? date : parsed.toLocaleString();
}

function safeExternalUrl(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null;
  } catch {
    return null;
  }
}

export function CommunityHub({ members, settings, adminRole, adminEmail, onUpdateSettings }: Props) {
  const canModerate = adminRole !== null;
  const canManageRoster = adminRole === 'owner' || adminRole === 'roster_manager';
  const isOwner = adminRole === 'owner';
  const [announcements, setAnnouncements] = useState<ClanAnnouncement[]>([]);
  const [events, setEvents] = useState<ClanEvent[]>([]);
  const [results, setResults] = useState<TournamentResult[]>([]);
  const [applications, setApplications] = useState<RecruitmentApplication[]>([]);
  const [reports, setReports] = useState<ImpersonationReport[]>([]);
  const [auditEntries, setAuditEntries] = useState<MemberAuditEntry[]>([]);
  const [adminAccounts, setAdminAccounts] = useState<AdminAccount[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [adminUid, setAdminUid] = useState('');
  const [adminAccountEmail, setAdminAccountEmail] = useState('');
  const [adminAccountRole, setAdminAccountRole] = useState<AdminRole>('roster_manager');
  const [activeSection, setActiveSection] = useState<CommunitySection>('activity');

  useEffect(() => {
    const onError = (error: Error) => setErrorMessage(error.message);
    const unsubscribers = [
      subscribeToAnnouncements(setAnnouncements, onError),
      subscribeToEvents(setEvents, onError),
      subscribeToResults(setResults, onError),
    ];
    if (canModerate) {
      unsubscribers.push(
        subscribeToApplications(setApplications, onError),
        subscribeToReports(setReports, onError)
      );
    } else {
      setApplications([]);
      setReports([]);
    }
    if (canManageRoster) {
      unsubscribers.push(subscribeToAuditLog(setAuditEntries, onError));
    } else {
      setAuditEntries([]);
    }
    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, [canManageRoster, canModerate]);

  useEffect(() => {
    if (!isOwner) {
      setAdminAccounts([]);
      return;
    }
    let isCurrent = true;
    listAdminAccounts()
      .then(async (accounts) => {
        if (!isCurrent) return;
        setAdminAccounts(accounts);
        await syncTursoAdminRoles(accounts);
      })
      .catch((error: unknown) => {
        if (isCurrent) setErrorMessage(error instanceof Error ? error.message : 'Could not load admin accounts.');
      });
    return () => {
      isCurrent = false;
    };
  }, [isOwner]);

  const runAdminAction = async (action: () => Promise<void>, success: string) => {
    setBusy(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      await action();
      setSuccessMessage(success);
    } catch (error) {
      console.error(error);
      setErrorMessage(error instanceof Error ? error.message : 'The action failed.');
    } finally {
      setBusy(false);
    }
  };

  const onSubmitPublic = async (
    event: FormEvent<HTMLFormElement>,
    collectionName: string,
    data: Record<string, string>
  ) => {
    event.preventDefault();
    const form = event.currentTarget;
    setBusy(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      await submitPublicRecord(collectionName, data);
      form.reset();
      setSuccessMessage(collectionName === 'recruitment_applications'
        ? 'Application submitted. The clan team will review it.'
        : 'Report submitted. The clan team will review it.');
    } catch (error) {
      console.error(error);
      setErrorMessage(error instanceof Error ? error.message : 'Submission failed.');
    } finally {
      setBusy(false);
    }
  };

  const createAnnouncement = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const now = new Date().toISOString();
    const record: ClanAnnouncement = {
      id: crypto.randomUUID(),
      title: String(form.get('title') || '').trim(),
      body: String(form.get('body') || '').trim(),
      createdAt: now,
      updatedAt: now,
      createdBy: adminEmail || 'Admin',
    };
    void runAdminAction(async () => {
      await saveContentRecord('announcements', record);
      formElement.reset();
    }, 'Announcement posted.');
  };

  const createEvent = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const record: ClanEvent = {
      id: crypto.randomUUID(),
      title: String(form.get('title') || '').trim(),
      description: String(form.get('description') || '').trim(),
      startsAt: new Date(String(form.get('startsAt'))).toISOString(),
      location: String(form.get('location') || '').trim(),
      createdAt: new Date().toISOString(),
      createdBy: adminEmail || 'Admin',
    };
    void runAdminAction(async () => {
      await saveContentRecord('events', record);
      formElement.reset();
    }, 'Event added to the calendar.');
  };

  const createResult = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const record: TournamentResult = {
      id: crypto.randomUUID(),
      tournament: String(form.get('tournament') || '').trim(),
      placement: String(form.get('placement') || '').trim(),
      date: String(form.get('date') || ''),
      notes: String(form.get('notes') || '').trim(),
      memberIds: String(form.get('memberIds') || '').split(',').map((id) => id.trim()).filter(Boolean),
      createdAt: new Date().toISOString(),
      createdBy: adminEmail || 'Admin',
    };
    void runAdminAction(async () => {
      await saveContentRecord('tournament_results', record);
      formElement.reset();
    }, 'Tournament result published.');
  };

  const updateSettings = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const updated: ClanSettings = {
      ...settings,
      recruitmentOpen: form.get('recruitmentOpen') === 'on',
      recruitingRoles: String(form.get('recruitingRoles') || '').split(',').map((role) => role.trim()).filter(Boolean),
      verificationInstructions: String(form.get('verificationInstructions') || '').trim(),
      clanRules: String(form.get('clanRules') || '').trim(),
      faq: String(form.get('faq') || '')
        .split('\n')
        .map((line) => line.split('|').map((part) => part.trim()))
        .filter((parts) => parts.length >= 2 && parts[0] && parts[1])
        .map(([question, answer]) => ({ question, answer })),
    };
    void runAdminAction(async () => {
      await saveClanSettings(updated);
      onUpdateSettings(updated);
    }, 'Recruitment and community settings saved.');
  };

  const handleAdminAssignment = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const account: AdminAccount = {
      uid: adminUid.trim(),
      email: adminAccountEmail.trim().toLowerCase(),
      role: adminAccountRole,
      createdAt: new Date().toISOString(),
    };
    void runAdminAction(async () => {
      await saveAdminAccount(account);
      setAdminAccounts((current) => [...current.filter((entry) => entry.uid !== account.uid), account]);
      setAdminUid('');
      setAdminAccountEmail('');
    }, 'Admin role saved.');
  };

  const recentMembers = [...members]
    .filter((member) => !member.archived)
    .sort((a, b) => (b.updatedAt || b.createdAt || '').localeCompare(a.updatedAt || a.createdAt || ''))
    .slice(0, 8);
  const socials = [
    { label: 'Discord', href: safeExternalUrl(settings.discordUrl) },
    { label: 'Facebook', href: safeExternalUrl(settings.facebookUrl) },
    { label: 'TikTok', href: safeExternalUrl(settings.tiktokUrl) },
    { label: 'YouTube', href: safeExternalUrl(settings.youtubeUrl) },
  ].filter((item): item is { label: string; href: string } => item.href !== null);
  const activeSectionDetails = communitySections.find(({ id }) => id === activeSection) ?? communitySections[0];
  const ActiveSectionIcon = activeSectionDetails.icon;

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-10 sm:px-6 lg:px-8">
      {(errorMessage || successMessage) && (
        <div className={`flex items-start gap-2 rounded-xl border p-3 text-sm ${errorMessage ? 'border-red-500/30 bg-red-950/40 text-red-200' : 'border-emerald-500/30 bg-emerald-950/40 text-emerald-200'}`}>
          {errorMessage || <Check className="h-4 w-4 shrink-0" />}
          {successMessage}
        </div>
      )}

      <nav aria-label="Community sections" className="inline-flex max-w-full gap-1 overflow-x-auto rounded-2xl border border-white/10 bg-zinc-950/70 p-1.5 shadow-lg shadow-black/20">
        {communitySections.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            aria-pressed={activeSection === id}
            onClick={() => setActiveSection(id)}
            className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 ${
              activeSection === id
                ? 'bg-purple-500/15 text-white shadow-inner shadow-purple-500/10'
                : 'text-zinc-400 hover:bg-white/[0.04] hover:text-white'
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${activeSection === id ? 'bg-purple-300' : 'bg-zinc-700'}`} aria-hidden="true" />
            {label}
          </button>
        ))}
      </nav>

      <header className="flex items-center justify-between gap-4 rounded-2xl border border-white/[0.07] bg-gradient-to-r from-white/[0.035] to-transparent px-4 py-4 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-purple-400/20 bg-purple-500/10 text-purple-200">
            <ActiveSectionIcon className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-purple-300">VALKYR community</p>
            <h2 className="mt-0.5 text-xl font-black text-white sm:text-2xl">{activeSectionDetails.label}</h2>
            <p className="mt-1 hidden text-sm text-zinc-400 sm:block">{activeSectionDetails.description}</p>
          </div>
        </div>
        {activeSection === 'activity' && (
          <span className="hidden shrink-0 items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-500/[0.07] px-3 py-1.5 text-xs font-medium text-emerald-200 sm:inline-flex">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
            Live updates
          </span>
        )}
      </header>

      <section id="activity" hidden={activeSection !== 'activity'} className="scroll-mt-8 space-y-5">

        {canModerate && (
          <div className="grid gap-4 lg:grid-cols-3">
            <form onSubmit={createAnnouncement} className={`${panelClass} space-y-3`}>
              <h3 className="flex items-center gap-2 text-sm font-bold text-white"><Megaphone className="h-4 w-4 text-purple-300" /> Post announcement</h3>
              <input name="title" className={inputClass} placeholder="Announcement title" required maxLength={120} />
              <textarea name="body" className={inputClass} placeholder="Share clan news..." required maxLength={3000} rows={3} />
              <button className={buttonClass} disabled={busy}>Publish</button>
            </form>
            <form onSubmit={createEvent} className={`${panelClass} space-y-3`}>
              <h3 className="flex items-center gap-2 text-sm font-bold text-white"><CalendarDays className="h-4 w-4 text-purple-300" /> Add clan event</h3>
              <input name="title" className={inputClass} placeholder="Event name" required maxLength={120} />
              <input name="startsAt" className={inputClass} type="datetime-local" required />
              <input name="location" className={inputClass} placeholder="Location or voice channel" maxLength={150} />
              <textarea name="description" className={inputClass} placeholder="Event details" rows={2} maxLength={1500} />
              <button className={buttonClass} disabled={busy}>Add event</button>
            </form>
            <form onSubmit={createResult} className={`${panelClass} space-y-3`}>
              <h3 className="flex items-center gap-2 text-sm font-bold text-white"><Trophy className="h-4 w-4 text-amber-300" /> Publish tournament result</h3>
              <input name="tournament" className={inputClass} placeholder="Tournament" required maxLength={120} />
              <div className="grid grid-cols-2 gap-2">
                <input name="placement" className={inputClass} placeholder="Placement" required maxLength={40} />
                <input name="date" className={inputClass} type="date" required />
              </div>
              <input name="memberIds" className={inputClass} placeholder="Participant member IDs (comma-separated)" />
              <textarea name="notes" className={inputClass} placeholder="Match notes" rows={2} maxLength={1200} />
              <button className={buttonClass} disabled={busy}>Publish result</button>
            </form>
          </div>
        )}

        <div className="grid items-stretch gap-4 lg:grid-cols-3">
          <div className={`${panelClass} lg:col-span-1`}>
            <h3 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-zinc-300"><Megaphone className="h-4 w-4 text-purple-300" />Announcements</h3>
            <div className="space-y-4">
              {announcements.length ? announcements.slice(0, 5).map((item) => (
                <article key={item.id} className="border-b border-white/[0.07] pb-4 last:border-0 last:pb-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-semibold text-white">{item.title}</h4>
                    {canModerate && <button type="button" onClick={() => void runAdminAction(() => deleteContentRecord('announcements', item.id), 'Announcement removed.')} className="text-xs text-red-300 hover:text-red-200">Remove</button>}
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-zinc-400">{item.body}</p>
                  <time className="mt-2 block text-[10px] text-zinc-600">{formatDate(item.createdAt)}</time>
                </article>
              )) : <p className="rounded-xl border border-dashed border-white/10 bg-black/10 px-3 py-5 text-center text-sm text-zinc-500">No announcements posted yet.</p>}
            </div>
          </div>

          <div className={`${panelClass} lg:col-span-1`}>
            <h3 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-zinc-300"><CalendarDays className="h-4 w-4 text-purple-300" />Events calendar</h3>
            <div className="space-y-3">
              {events.length ? events.filter((item) => new Date(item.startsAt).getTime() >= Date.now() - 86400000).slice(0, 6).map((item) => (
                <article key={item.id} className="flex gap-3 border-b border-white/[0.07] pb-3 last:border-0">
                  <div className="w-14 shrink-0 rounded-lg bg-purple-500/10 p-2 text-center text-[10px] font-bold uppercase text-purple-200">
                    {new Date(item.startsAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-semibold text-white">{item.title}</h4>
                    <p className="text-xs text-zinc-400">{new Date(item.startsAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}{item.location ? ` · ${item.location}` : ''}</p>
                    {item.description && <p className="mt-1 text-xs text-zinc-500">{item.description}</p>}
                  </div>
                  {canModerate && <button type="button" onClick={() => void runAdminAction(() => deleteContentRecord('events', item.id), 'Event removed.')} className="self-start text-xs text-red-300">Remove</button>}
                </article>
              )) : <p className="rounded-xl border border-dashed border-white/10 bg-black/10 px-3 py-5 text-center text-sm text-zinc-500">No upcoming events.</p>}
            </div>
          </div>

          <div className={`${panelClass} lg:col-span-1`}>
            <h3 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-zinc-300"><Trophy className="h-4 w-4 text-amber-300" />Tournament results</h3>
            <div className="space-y-3">
              {results.length ? results.slice(0, 6).map((item) => (
                <article key={item.id} className="border-b border-white/[0.07] pb-3 last:border-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-semibold text-white">{item.tournament}</h4>
                      <p className="mt-0.5 text-xs text-zinc-400">{item.placement} · {item.date}</p>
                    </div>
                    {canModerate && <button type="button" onClick={() => void runAdminAction(() => deleteContentRecord('tournament_results', item.id), 'Result removed.')} className="text-xs text-red-300">Remove</button>}
                  </div>
                  {item.memberIds.length > 0 && <p className="mt-1 text-[11px] text-zinc-500">Players: {item.memberIds.map((id) => members.find((member) => member.id === id)?.ign || id).join(', ')}</p>}
                  {item.notes && <p className="mt-1 text-xs text-zinc-500">{item.notes}</p>}
                </article>
              )) : <p className="rounded-xl border border-dashed border-white/10 bg-black/10 px-3 py-5 text-center text-sm text-zinc-500">Tournament results will appear here.</p>}
            </div>
          </div>
        </div>

        <div className={panelClass}>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-zinc-300"><History className="h-4 w-4 text-purple-300" />Recent roster updates</h3>
            <span className="text-[10px] uppercase tracking-wider text-zinc-600">Latest members</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {recentMembers.length ? recentMembers.map((member) => (
              <div key={member.id} className="rounded-xl border border-white/[0.06] bg-black/20 p-3">
                <p className="truncate text-sm font-semibold text-white">{member.name || member.ign}</p>
                <p className="truncate text-xs text-purple-200">{member.ign} · {member.department}</p>
                <p className="mt-1 text-[10px] text-zinc-500">{member.updatedAt ? 'Profile updated' : 'Roster member'} · {formatDate(member.updatedAt || member.createdAt || member.joinDate)}</p>
              </div>
            )) : <p className="text-sm text-zinc-500">Roster updates will show here when members are added.</p>}
          </div>
        </div>
      </section>

      <section id="recruitment" hidden={activeSection !== 'recruitment'} className="scroll-mt-8 grid items-start gap-4 lg:grid-cols-[1.4fr_0.8fr]">
        <div className={panelClass}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-purple-300">Join the roster</p>
              <h3 className="mt-1 text-xl font-black text-white">Application</h3>
            </div>
            <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${settings.recruitmentOpen ? 'border-emerald-400/20 bg-emerald-500/[0.08] text-emerald-200' : 'border-zinc-700 bg-zinc-900 text-zinc-400'}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${settings.recruitmentOpen ? 'bg-emerald-300' : 'bg-zinc-500'}`} />
              {settings.recruitmentOpen ? 'Applications open' : 'Currently closed'}
            </span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-zinc-400">
            {settings.recruitmentOpen ? `Applications are open${settings.recruitingRoles?.length ? ` for ${settings.recruitingRoles.join(', ')}` : ''}.` : 'Recruitment is currently closed. Check back for future openings.'}
          </p>
          {settings.recruitmentOpen && (
            <form onSubmit={(event) => {
              const form = new FormData(event.currentTarget);
              void onSubmitPublic(event, 'recruitment_applications', {
                name: String(form.get('name') || '').trim(),
                ign: String(form.get('ign') || '').trim(),
                game: String(form.get('game') || '').trim(),
                role: String(form.get('role') || '').trim(),
                contact: String(form.get('contact') || '').trim(),
                message: String(form.get('message') || '').trim(),
                status: 'pending',
                createdAt: new Date().toISOString(),
              });
            }} className="mt-5 grid gap-3 sm:grid-cols-2">
              <input name="name" className={inputClass} placeholder="Name" required maxLength={100} />
              <input name="ign" className={inputClass} placeholder="In-game name" required maxLength={100} />
              <input name="game" className={inputClass} placeholder="Game / platform" maxLength={100} />
              <input name="role" className={inputClass} placeholder="Role applying for" required maxLength={100} />
              <input name="contact" className={`${inputClass} sm:col-span-2`} placeholder="Discord or contact" required maxLength={200} />
              <textarea name="message" className={`${inputClass} sm:col-span-2`} placeholder="Tell us about yourself" rows={3} maxLength={2000} />
              <button className={`${buttonClass} sm:col-span-2`} disabled={busy}><UserPlus className="h-4 w-4" />Submit application</button>
            </form>
          )}
        </div>

        <div className={`${panelClass} h-full`}>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-purple-300" />
            <h3 className="text-sm font-bold text-white">Open roles</h3>
          </div>
          {settings.recruitingRoles?.length ? (
            <div className="mt-4 flex flex-wrap gap-2">{settings.recruitingRoles.map((role) => <span key={role} className="rounded-lg border border-purple-400/20 bg-purple-500/[0.08] px-3 py-2 text-xs font-medium text-purple-100">{role}</span>)}</div>
          ) : <p className="mt-3 rounded-xl border border-dashed border-white/10 px-3 py-4 text-sm leading-relaxed text-zinc-500">Contact the clan team about current openings.</p>}
          {canManageRoster && (
            <details className="mt-6 border-t border-white/10 pt-4">
              <summary className="cursor-pointer text-sm font-semibold text-purple-200">Edit recruitment, verification, FAQ & rules</summary>
              <form onSubmit={updateSettings} className="mt-4 space-y-3">
                <label className="flex items-center gap-2 text-sm text-zinc-200">
                  <input type="checkbox" name="recruitmentOpen" defaultChecked={settings.recruitmentOpen} className="accent-purple-500" />
                  Recruitment is open
                </label>
                <input name="recruitingRoles" defaultValue={settings.recruitingRoles?.join(', ')} className={inputClass} placeholder="Open roles, comma separated" />
                <textarea name="verificationInstructions" defaultValue={settings.verificationInstructions} className={inputClass} rows={3} placeholder="How visitors can verify an official member" />
                <textarea name="clanRules" defaultValue={settings.clanRules} className={inputClass} rows={4} placeholder="Clan rules (one rule per line)" />
                <textarea name="faq" defaultValue={settings.faq?.map(({ question, answer }) => `${question} | ${answer}`).join('\n')} className={inputClass} rows={5} placeholder={'FAQ, one per line: Question | Answer'} />
                <button className={buttonClass} disabled={busy}>Save community information</button>
              </form>
            </details>
          )}
        </div>
      </section>

      <section id="trust" hidden={activeSection !== 'trust'} className="scroll-mt-8 grid items-stretch gap-4 lg:grid-cols-2">
        <div className={panelClass}>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-500/[0.08] text-emerald-200"><ShieldCheck className="h-5 w-5" /></span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-200/70">Stay safe</p>
              <h3 className="text-base font-bold text-white">Verify a VALKYR member</h3>
            </div>
          </div>
          <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-zinc-300">
            {settings.verificationInstructions || 'Find the player in the official roster and compare their IGN and verification code with the profile. If anything does not match, contact the clan through an official social link before trading or arranging a match.'}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <a href="#member-roster" className="rounded-lg border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-500/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300">Browse verified roster</a>
            <a href="#report" className="rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-zinc-300 transition hover:border-white/20 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400">Report an impersonator</a>
          </div>
        </div>
        <div className={panelClass}>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-purple-300" />
            <h3 className="text-sm font-bold text-white">FAQ & clan rules</h3>
          </div>
          {settings.clanRules && <ul className="mt-4 space-y-2 text-sm text-zinc-300">{settings.clanRules.split('\n').filter(Boolean).map((rule, index) => <li key={`${index}-${rule}`} className="flex gap-2 rounded-lg bg-black/15 px-3 py-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-purple-300/70" />{rule}</li>)}</ul>}
          {settings.faq?.length ? (
            <div className="mt-4 space-y-2">{settings.faq.map((item, index) => <details key={`${index}-${item.question}`} className="group rounded-xl border border-white/[0.08] bg-black/15 p-3 transition open:border-purple-400/20"><summary className="cursor-pointer list-none text-sm font-semibold text-zinc-200 marker:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400">{item.question}<span className="float-right text-zinc-500 transition group-open:rotate-45">+</span></summary><p className="mt-3 border-t border-white/[0.07] pt-3 text-sm leading-relaxed text-zinc-400">{item.answer}</p></details>)}</div>
          ) : !settings.clanRules && <p className="mt-2 text-sm text-zinc-500">Clan rules and answers to common questions will be posted here.</p>}
        </div>
      </section>

      <section id="report" hidden={activeSection !== 'trust'} className="scroll-mt-8">
        <form onSubmit={(event) => {
          const form = new FormData(event.currentTarget);
          void onSubmitPublic(event, 'impersonation_reports', {
            reportedAccount: String(form.get('reportedAccount') || '').trim(),
            platform: String(form.get('platform') || '').trim(),
            evidenceUrl: String(form.get('evidenceUrl') || '').trim(),
            details: String(form.get('details') || '').trim(),
            contact: String(form.get('contact') || '').trim(),
            status: 'open',
            createdAt: new Date().toISOString(),
          });
        }} className={`${panelClass} grid gap-5 md:grid-cols-[0.75fr_1.25fr]`}>
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-400/20 bg-red-500/[0.08] text-red-200"><Flag className="h-5 w-5" /></span>
              <h3 className="text-base font-bold text-white">Report impersonation</h3>
            </div>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-zinc-400">Send suspected fake accounts to the moderation team. Reports are private to clan admins.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <input name="reportedAccount" className={inputClass} placeholder="Account / IGN" required maxLength={150} />
            <input name="platform" className={inputClass} placeholder="Platform" required maxLength={80} />
            <input name="evidenceUrl" type="url" className={`${inputClass} sm:col-span-2`} placeholder="Evidence link (optional)" maxLength={500} />
            <textarea name="details" className={`${inputClass} sm:col-span-2`} placeholder="What happened?" required rows={3} maxLength={2000} />
            <input name="contact" className={inputClass} placeholder="Your contact (optional)" maxLength={200} />
            <button className={`${buttonClass} self-end`} disabled={busy}><Flag className="h-4 w-4" />Send private report</button>
          </div>
        </form>
      </section>

      {canModerate && (
        <section hidden={activeSection !== 'community'} className={panelClass}>
          <h2 className="text-xl font-black text-white">Admin review queue</h2>
          <div className="mt-4 grid gap-5 lg:grid-cols-2">
            <div>
              <h3 className="mb-2 text-sm font-bold text-zinc-200">Recruitment applications ({applications.filter((item) => item.status === 'pending').length} pending)</h3>
              <div className="max-h-80 space-y-2 overflow-y-auto">
                {applications.map((item) => <article key={item.id} className="rounded-xl border border-white/[0.07] p-3"><div className="flex justify-between gap-2"><p className="font-semibold text-white">{item.name} · {item.ign}</p><span className="text-[10px] uppercase text-purple-200">{item.status}</span></div><p className="mt-1 text-xs text-zinc-400">{item.game} · {item.role} · {item.contact}</p>{item.message && <p className="mt-2 text-xs text-zinc-300">{item.message}</p>}{item.status === 'pending' && <div className="mt-2 flex gap-2">{(['approved', 'declined'] as const).map((status) => <button key={status} type="button" onClick={() => void runAdminAction(() => saveContentRecord('recruitment_applications', { ...item, status }), `Application ${status}.`)} className="rounded bg-zinc-800 px-2 py-1 text-xs capitalize text-zinc-200">{status}</button>)}</div>}</article>)}
                {!applications.length && <p className="text-xs text-zinc-500">No applications yet.</p>}
              </div>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-bold text-zinc-200">Impersonation reports ({reports.filter((item) => item.status !== 'resolved').length} open)</h3>
              <div className="max-h-80 space-y-2 overflow-y-auto">
                {reports.map((item) => <article key={item.id} className="rounded-xl border border-white/[0.07] p-3"><div className="flex justify-between gap-2"><p className="font-semibold text-white">{item.reportedAccount} · {item.platform}</p><span className="text-[10px] uppercase text-amber-200">{item.status}</span></div><p className="mt-1 text-xs text-zinc-300">{item.details}</p>{item.evidenceUrl && <a className="mt-1 inline-flex items-center gap-1 text-xs text-purple-300" href={safeExternalUrl(item.evidenceUrl) || '#'} target="_blank" rel="noreferrer">View evidence <ExternalLink className="h-3 w-3" /></a>}<div className="mt-2 flex gap-2">{(['reviewing', 'resolved'] as const).map((status) => <button key={status} type="button" onClick={() => void runAdminAction(() => saveContentRecord('impersonation_reports', { ...item, status }), `Report marked ${status}.`)} className="rounded bg-zinc-800 px-2 py-1 text-xs capitalize text-zinc-200">{status}</button>)}</div></article>)}
                {!reports.length && <p className="text-xs text-zinc-500">No reports received.</p>}
              </div>
            </div>
          </div>
          {canManageRoster && <div className="mt-5 border-t border-white/10 pt-4">
            <h3 className="mb-2 text-sm font-bold text-zinc-200">Member change history</h3>
            <div className="max-h-60 space-y-2 overflow-y-auto">
              {auditEntries.slice(0, 40).map((entry) => <div key={entry.id} className="flex flex-wrap justify-between gap-2 rounded-lg bg-black/20 px-3 py-2 text-xs"><span className="text-zinc-200">{entry.action} · {entry.memberName}</span><span className="text-zinc-500">{entry.actor} · {formatDate(entry.createdAt)}</span>{entry.changedFields.length > 0 && <span className="w-full text-zinc-500">Changed: {entry.changedFields.join(', ')}</span>}</div>)}
              {!auditEntries.length && <p className="text-xs text-zinc-500">Member changes will appear here.</p>}
            </div>
          </div>}
        </section>
      )}

      {isOwner && (
        <section hidden={activeSection !== 'community'} className={panelClass}>
          <h2 className="flex items-center gap-2 text-xl font-black text-white"><Users className="h-5 w-5 text-purple-300" />Admin roles</h2>
          <p className="mt-1 text-xs text-zinc-400">Assign a Firebase Authentication user by UID. Managers edit the roster; moderators manage announcements, events, applications, and reports.</p>
          <form onSubmit={handleAdminAssignment} className="mt-4 grid gap-3 sm:grid-cols-4">
            <input value={adminUid} onChange={(event) => setAdminUid(event.target.value)} className={inputClass} placeholder="Firebase Auth UID" required />
            <input value={adminAccountEmail} onChange={(event) => setAdminAccountEmail(event.target.value)} className={inputClass} placeholder="Account email" type="email" required />
            <select value={adminAccountRole} onChange={(event) => setAdminAccountRole(event.target.value as AdminRole)} className={inputClass}>
              <option value="roster_manager">Roster manager</option>
              <option value="moderator">Moderator</option>
              <option value="owner">Owner</option>
            </select>
            <button className={buttonClass} disabled={busy}>Save role</button>
          </form>
          <div className="mt-4 space-y-2">
            {adminAccounts.map((account) => <div key={account.uid} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/[0.07] px-3 py-2 text-xs"><span className="text-zinc-200">{account.email} <span className="text-zinc-500">({account.uid})</span></span><span className="mr-auto rounded bg-purple-500/10 px-2 py-1 capitalize text-purple-200">{account.role.replace('_', ' ')}</span>{account.uid !== auth.currentUser?.uid && <button type="button" onClick={() => void runAdminAction(async () => { await deleteAdminAccount(account.uid); setAdminAccounts((current) => current.filter((item) => item.uid !== account.uid)); }, 'Admin access removed.')} className="text-red-300 hover:text-red-200">Remove</button>}</div>)}
            {!adminAccounts.length && <p className="text-xs text-zinc-500">No additional administrators are assigned.</p>}
          </div>
        </section>
      )}

      <section id="community" hidden={activeSection !== 'community'} className={`${panelClass} flex flex-col justify-between gap-5 sm:flex-row sm:items-center`}>
        <div>
          <h3 className="text-lg font-black text-white">Connect with VALKYR</h3>
          <p className="mt-1 max-w-md text-sm leading-relaxed text-zinc-400">Follow official channels and join the community.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {socials.map((item) => <a key={item.label} href={item.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-zinc-900/80 px-4 py-3 text-xs font-semibold text-zinc-200 transition hover:border-purple-400/40 hover:bg-purple-500/[0.08] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"><ExternalLink className="h-3.5 w-3.5 text-purple-300" />{item.label}</a>)}
          {!socials.length && <p className="text-xs text-zinc-500">Official social links will appear here.</p>}
        </div>
      </section>
    </main>
  );
}
