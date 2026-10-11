import { useState } from 'react';
import {
  X,
  Database,
  Download,
  Check,
  Building,
  Save,
  RefreshCw,
  LogOut,
} from 'lucide-react';
import { AdminRole, ClanSettings, ClanMember } from '../types/clan';
import { saveClanSettings } from '../services/memberService';
import { membersToCsv, parseMemberCsv } from '../utils/memberCsv';
import type { MigrationProgress } from '../services/memberService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  settings: ClanSettings;
  onUpdateSettings: (newSettings: ClanSettings) => void;
  members: ClanMember[];
  adminEmail?: string;
  onSignOut: () => void;
  onRefreshRoster: () => void;
  adminRole: AdminRole | null;
  onImportMembers: (members: ClanMember[]) => Promise<void>;
  onMigrateFirestoreProfiles: (onProgress: (progress: MigrationProgress) => void) => Promise<MigrationProgress>;
}

export function AdminSettingsModal({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  members,
  adminEmail,
  onSignOut,
  onRefreshRoster,
  adminRole,
  onImportMembers,
  onMigrateFirestoreProfiles,
}: Props) {
  const [name, setName] = useState(settings.name);
  const [tagline, setTagline] = useState(settings.tagline);
  const [description, setDescription] = useState(settings.description);
  const [announcement, setAnnouncement] = useState(settings.announcement || '');
  const [discordUrl, setDiscordUrl] = useState(settings.discordUrl || '');
  const [facebookUrl, setFacebookUrl] = useState(settings.facebookUrl || '');
  const [tiktokUrl, setTiktokUrl] = useState(settings.tiktokUrl || '');
  const [youtubeUrl, setYoutubeUrl] = useState(settings.youtubeUrl || '');

  const [isSaving, setIsSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState<string | null>(null);
  const canManageRoster = adminRole === 'owner' || adminRole === 'roster_manager';

  if (!isOpen) return null;

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setStatusMsg(null);
    const updated: ClanSettings = {
      ...settings,
      name: name.trim(),
      tagline: tagline.trim(),
      description: description.trim(),
      announcement: announcement.trim(),
      discordUrl: discordUrl.trim(),
      facebookUrl: facebookUrl.trim(),
      tiktokUrl: tiktokUrl.trim(),
      youtubeUrl: youtubeUrl.trim(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await saveClanSettings(updated);
      onUpdateSettings(updated);
      setStatusMsg('Clan settings saved to Turso successfully!');
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err) {
      setStatusMsg(err instanceof Error ? err.message : 'Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleMigrateFirestore = async () => {
    if (!window.confirm('Copy existing Firebase roster profiles, clan settings, and audit history to Turso? The original Firebase data will remain unchanged.')) return;
    setIsMigrating(true);
    setMigrationStatus('Preparing migration...');
    setImportError(null);
    try {
      const result = await onMigrateFirestoreProfiles((progress) => {
        setMigrationStatus(`Profiles ${progress.membersCopied}/${progress.totalMembers} · history ${progress.auditEntriesCopied}/${progress.totalAuditEntries}`);
      });
      const copiedData = result.membersCopied > 0 || result.auditEntriesCopied > 0 || result.settingsCopied;
      setMigrationStatus(copiedData
        ? `Copied ${result.membersCopied} profiles and ${result.auditEntriesCopied} history entries${result.settingsCopied ? ', plus clan settings' : ''} to Turso.`
        : 'No new profiles, history, or settings needed copying; existing Turso data was kept.');
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Firebase-to-Turso migration failed.');
    } finally {
      setIsMigrating(false);
    }
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(members, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `valkyr_clan_roster_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleExportCsv = () => {
    const blob = new Blob([membersToCsv(members)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.href = url;
    downloadAnchor.download = `valkyr_clan_roster_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    URL.revokeObjectURL(url);
  };

  const handleImportCsv = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (!file) return;
    setImportError(null);
    setStatusMsg(null);
    setIsImporting(true);
    try {
      const parsed = parseMemberCsv(await file.text(), Math.max(0, ...members.map((member) => member.order || 0)));
      if (parsed.length === 0) throw new Error('The CSV file contains no member rows.');
      await onImportMembers(parsed);
      setStatusMsg(`Imported ${parsed.length} members from CSV.`);
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'CSV import failed.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/60 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-purple-600/20 text-purple-400 border border-purple-600/30">
              <Building className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                Admin Dashboard & Database
              </h3>
              <p className="text-xs text-zinc-400">
                Connected: <span className="text-purple-400 font-mono">{adminEmail || 'Admin User'}</span>
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

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Quick Database Actions */}
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-purple-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                Turso Profile Database
              </h4>
            </div>
            <p className="text-xs text-zinc-400">
              Member profiles, profile photos, clan settings, audit history, announcements, events, and tournament results use Turso. Firebase handles admin sign-in and public submissions.
            </p>

            <div className="flex flex-wrap gap-2.5 pt-1">
              {canManageRoster && (
                <>
                  <button
                    type="button"
                    onClick={handleExportJson}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition"
                  >
                    <Download className="w-4 h-4" />
                    Download Roster (JSON)
                  </button>
                  <button
                    type="button"
                    onClick={handleExportCsv}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition"
                  >
                    <Download className="w-4 h-4" />
                    Export CSV
                  </button>
                  <label className={`flex cursor-pointer items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-800 px-3.5 py-2 text-xs font-semibold text-zinc-200 transition hover:bg-zinc-700 ${isImporting ? 'pointer-events-none opacity-50' : ''}`}>
                    <Database className="h-4 w-4" />
                    {isImporting ? 'Importing CSV...' : 'Import CSV'}
                    <input type="file" accept=".csv,text/csv" className="sr-only" disabled={isImporting} onChange={(event) => void handleImportCsv(event)} />
                  </label>
                </>
              )}
              {adminRole === 'owner' && (
                <button
                  type="button"
                  onClick={() => void handleMigrateFirestore()}
                  disabled={isMigrating}
                  className="flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-950/30 px-3.5 py-2 text-xs font-semibold text-amber-100 transition hover:bg-amber-900/40 disabled:opacity-50"
                >
                  <Database className="h-4 w-4" />
                  {isMigrating ? 'Migrating...' : 'Migrate Firebase Profiles'}
                </button>
              )}

              <button
                type="button"
                onClick={onRefreshRoster}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-850 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-medium border border-zinc-750 transition"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh Live Data</span>
              </button>
            </div>
            {(statusMsg || migrationStatus || importError) && (
              <p className={`text-xs ${importError ? 'text-red-300' : 'text-emerald-300'}`}>{importError || migrationStatus || statusMsg}</p>
            )}
          </div>

          {/* Clan Info & Branding Form */}
          {canManageRoster ? <form onSubmit={handleSaveSettings} className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Clan Branding & Info
            </h4>

            {statusMsg && (
              <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>{statusMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Clan Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Tagline / Motto
                </label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Description
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-purple-500 resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <input
                type="text"
                value={discordUrl}
                onChange={(e) => setDiscordUrl(e.target.value)}
                placeholder="Discord Server Invite Link"
                className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white focus:outline-none focus:border-purple-500"
              />
              <input
                type="text"
                value={facebookUrl}
                onChange={(e) => setFacebookUrl(e.target.value)}
                placeholder="Facebook Organization Link"
                className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white focus:outline-none focus:border-purple-500"
              />
              <input
                type="text"
                value={tiktokUrl}
                onChange={(e) => setTiktokUrl(e.target.value)}
                placeholder="TikTok Official Link"
                className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white focus:outline-none focus:border-purple-500"
              />
              <input
                type="text"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="YouTube Channel Link"
                className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white shadow-md transition"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving...' : 'Update Clan Info'}
              </button>
            </div>
          </form> : <p className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 text-sm text-zinc-400">Your moderator role can manage announcements, events, applications, and reports. Only roster managers can edit clan settings or member data.</p>}

          {/* Session controls */}
          <div className="pt-4 border-t border-zinc-800 flex items-center justify-between">
            <span className="text-xs text-zinc-500">
              Admin Session Active
            </span>
            <button
              onClick={() => {
                onSignOut();
                onClose();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-red-400 hover:text-red-300 text-xs font-semibold border border-zinc-800 transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
