import {
  collection,
  doc,
  getDoc,
  getDocs,
} from 'firebase/firestore';
import { db } from '../firebase';
import { ClanMember, ClanSettings } from '../types/clan';
import { DEFAULT_CLAN_SETTINGS } from '../data/initialMembers';
import { apiRequest, authorizedFetch, jsonRequest } from './apiClient';

const POLL_INTERVAL_MS = 15000;

export function subscribeToMembers(
  onUpdate: (members: ClanMember[]) => void,
  onError?: (error: unknown) => void
): () => void {
  let active = true;
  let etag: string | null = null;
  let controller: AbortController | null = null;
  let refreshing = false;

  const refresh = async () => {
    if (!active || refreshing) return;
    refreshing = true;
    controller = new AbortController();
    try {
      const headers = new Headers();
      if (etag) headers.set('If-None-Match', etag);
      const response = await authorizedFetch('/api/members', {
        headers,
        signal: controller.signal,
      });
      if (response.status === 304) return;
      if (!response.ok) throw new Error(`Roster request failed (${response.status}).`);
      etag = response.headers.get('ETag');
      const members: ClanMember[] = await response.json();
      if (active) onUpdate(members);
    } catch (error) {
      if (active && !(error instanceof DOMException && error.name === 'AbortError')) {
        console.error('Failed to load Turso roster:', error);
        onError?.(error);
      }
    } finally {
      refreshing = false;
    }
  };

  void refresh();
  const intervalId = window.setInterval(() => void refresh(), POLL_INTERVAL_MS);
  return () => {
    active = false;
    window.clearInterval(intervalId);
    controller?.abort();
  };
}

export async function saveMember(
  member: ClanMember,
  _adminEmail?: string,
  auditAction?: 'imported'
): Promise<void> {
  const request = jsonRequest('PUT', member);
  const headers = new Headers(request.headers);
  if (auditAction) headers.set('X-Audit-Action', auditAction);
  await apiRequest<ClanMember>(`/api/members/${encodeURIComponent(member.id)}`, {
    ...request,
    headers,
  });
}

export async function updateMemberInfo(
  memberId: string,
  partialData: Partial<ClanMember>
): Promise<void> {
  await apiRequest<ClanMember>(`/api/members/${encodeURIComponent(memberId)}`, jsonRequest('PATCH', partialData));
}

export async function deleteMember(memberId: string): Promise<void> {
  await apiRequest<void>(`/api/members/${encodeURIComponent(memberId)}`, { method: 'DELETE' });
}

export async function setMemberArchived(member: ClanMember, archived: boolean): Promise<void> {
  await apiRequest<ClanMember>(
    `/api/members/${encodeURIComponent(member.id)}/archive`,
    jsonRequest('PATCH', { archived })
  );
}

export async function getClanSettings(): Promise<ClanSettings> {
  const settings = await apiRequest<ClanSettings | null>('/api/clan-settings');
  return settings ? { ...DEFAULT_CLAN_SETTINGS, ...settings } : DEFAULT_CLAN_SETTINGS;
}

export async function saveClanSettings(settings: ClanSettings): Promise<void> {
  await apiRequest<ClanSettings>('/api/clan-settings', jsonRequest('PUT', settings));
}

export interface MigrationProgress {
  membersCopied: number;
  totalMembers: number;
  auditEntriesCopied: number;
  totalAuditEntries: number;
  settingsCopied: boolean;
}

export async function migrateFirestoreProfiles(
  onProgress: (progress: MigrationProgress) => void
): Promise<MigrationProgress> {
  const [memberSnapshot, settingsSnapshot, auditSnapshot] = await Promise.all([
    getDocs(collection(db, 'members')),
    getDoc(doc(db, 'clan_settings', 'general')),
    getDocs(collection(db, 'member_audit_log')),
  ]);
  const totalMembers = memberSnapshot.size;
  const totalAuditEntries = auditSnapshot.size;
  let membersCopied = 0;
  let auditEntriesCopied = 0;

  for (const memberDoc of memberSnapshot.docs) {
    const member = { ...memberDoc.data(), id: memberDoc.id } as ClanMember;
    const result = await apiRequest<{ copied: boolean }>(
      `/api/admin/migrate/member/${encodeURIComponent(member.id)}`,
      jsonRequest('POST', member)
    );
    if (result.copied) membersCopied += 1;
    onProgress({ membersCopied, totalMembers, auditEntriesCopied, totalAuditEntries, settingsCopied: false });
  }

  for (const auditDoc of auditSnapshot.docs) {
    const entry = { ...auditDoc.data(), id: auditDoc.id };
    const result = await apiRequest<{ copied: boolean }>(
      `/api/admin/migrate/audit/${encodeURIComponent(auditDoc.id)}`,
      jsonRequest('POST', entry)
    );
    if (result.copied) auditEntriesCopied += 1;
    onProgress({ membersCopied, totalMembers, auditEntriesCopied, totalAuditEntries, settingsCopied: false });
  }

  let settingsCopied = false;
  if (settingsSnapshot.exists()) {
    const result = await apiRequest<{ copied: boolean }>(
      '/api/admin/migrate/settings',
      jsonRequest('POST', settingsSnapshot.data())
    );
    settingsCopied = result.copied;
  }

  const result = { membersCopied, totalMembers, auditEntriesCopied, totalAuditEntries, settingsCopied };
  onProgress(result);
  return result;
}
