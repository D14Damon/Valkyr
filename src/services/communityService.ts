import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
} from 'firebase/firestore';
import { db } from '../firebase';
import { apiRequest, jsonRequest } from './apiClient';
import {
  AdminAccount,
  ClanAnnouncement,
  ClanEvent,
  ImpersonationReport,
  MemberAuditEntry,
  RecruitmentApplication,
  TournamentResult,
} from '../types/clan';

function subscribeFirestoreRecords<T extends { id: string }>(
  collectionName: string,
  sortField: string,
  onUpdate: (records: T[]) => void,
  onError: (error: Error) => void,
  direction: 'asc' | 'desc' = 'desc'
): () => void {
  const recordsQuery = query(collection(db, collectionName), orderBy(sortField, direction));
  return onSnapshot(
    recordsQuery,
    (snapshot) => {
      onUpdate(snapshot.docs.map((entry) => ({ ...entry.data(), id: entry.id }) as T));
    },
    (error) => {
      console.error(`Failed to subscribe to ${collectionName}:`, error);
      onError(error);
    }
  );
}

export const subscribeToApplications = (
  onUpdate: (records: RecruitmentApplication[]) => void,
  onError: (error: Error) => void
) => subscribeFirestoreRecords<RecruitmentApplication>('recruitment_applications', 'createdAt', onUpdate, onError);

export const subscribeToReports = (
  onUpdate: (records: ImpersonationReport[]) => void,
  onError: (error: Error) => void
) => subscribeFirestoreRecords<ImpersonationReport>('impersonation_reports', 'createdAt', onUpdate, onError);

export const subscribeToAuditLog = (
  onUpdate: (records: MemberAuditEntry[]) => void,
  onError: (error: Error) => void
) => {
  let active = true;
  const load = async () => {
    try {
      const entries = await apiRequest<MemberAuditEntry[]>('/api/member-audit');
      if (active) onUpdate(entries);
    } catch (error) {
      console.error('Failed to load Turso member audit history:', error);
      if (active) onError(error instanceof Error ? error : new Error('Could not load member audit history.'));
    }
  };
  void load();
  const interval = window.setInterval(() => void load(), 15000);
  return () => {
    active = false;
    window.clearInterval(interval);
  };
};

type ActivityTable = 'announcements' | 'events' | 'tournament_results';

function subscribeActivityRecords<T extends { id: string }>(
  collectionName: ActivityTable,
  onUpdate: (records: T[]) => void,
  onError: (error: Error) => void
): () => void {
  let active = true;
  const loadRecords = async () => {
    try {
      const records = await apiRequest<T[]>(`/api/activity/${collectionName}`);
      if (active) onUpdate(records);
    } catch (error) {
      console.error(`Failed to load ${collectionName} from Turso:`, error);
      if (active) onError(error instanceof Error ? error : new Error(`Could not load ${collectionName}.`));
    }
  };
  void loadRecords();
  const interval = window.setInterval(() => void loadRecords(), 15000);
  return () => {
    active = false;
    window.clearInterval(interval);
  };
}

export const subscribeToAnnouncements = (
  onUpdate: (records: ClanAnnouncement[]) => void,
  onError: (error: Error) => void
) => subscribeActivityRecords('announcements', onUpdate, onError);

export const subscribeToEvents = (
  onUpdate: (records: ClanEvent[]) => void,
  onError: (error: Error) => void
) => subscribeActivityRecords('events', onUpdate, onError);

export const subscribeToResults = (
  onUpdate: (records: TournamentResult[]) => void,
  onError: (error: Error) => void
) => subscribeActivityRecords('tournament_results', onUpdate, onError);

export async function saveContentRecord<T extends { id: string }>(
  collectionName: string,
  record: T
): Promise<void> {
  if (isActivityTable(collectionName)) {
    await apiRequest(
      `/api/activity/${collectionName}/${encodeURIComponent(record.id)}`,
      jsonRequest('PUT', record)
    );
    return;
  }
  await setDoc(doc(db, collectionName, record.id), record);
}

export async function deleteContentRecord(collectionName: string, id: string): Promise<void> {
  if (isActivityTable(collectionName)) {
    await apiRequest<void>(
      `/api/activity/${collectionName}/${encodeURIComponent(id)}`,
      { method: 'DELETE' }
    );
    return;
  }
  await deleteDoc(doc(db, collectionName, id));
}

function isActivityTable(collectionName: string): collectionName is ActivityTable {
  return collectionName === 'announcements'
    || collectionName === 'events'
    || collectionName === 'tournament_results';
}

export async function submitPublicRecord<T extends object>(
  collectionName: string,
  record: T
): Promise<void> {
  await addDoc(collection(db, collectionName), record);
}

export async function listAdminAccounts(): Promise<AdminAccount[]> {
  const snapshot = await getDocs(collection(db, 'admins'));
  return snapshot.docs.map((entry) => ({
    ...entry.data(),
    uid: entry.id,
  }) as AdminAccount);
}

export async function saveAdminAccount(account: AdminAccount): Promise<void> {
  await setDoc(doc(db, 'admins', account.uid), {
    email: account.email.trim().toLowerCase(),
    role: account.role,
    createdAt: account.createdAt,
  });
  await apiRequest<void>(
    `/api/admin-roles/${encodeURIComponent(account.uid)}`,
    jsonRequest('PUT', { email: account.email, role: account.role })
  );
}

export async function deleteAdminAccount(uid: string): Promise<void> {
  await deleteDoc(doc(db, 'admins', uid));
  await apiRequest<void>(`/api/admin-roles/${encodeURIComponent(uid)}`, { method: 'DELETE' });
}

export async function syncTursoAdminRoles(accounts: AdminAccount[]): Promise<void> {
  await apiRequest<void>('/api/admin-roles/sync', jsonRequest('POST', { accounts }));
}
