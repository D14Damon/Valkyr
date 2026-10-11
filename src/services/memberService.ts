import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  getDoc,
} from 'firebase/firestore';
import { db } from '../firebase';
import { ClanMember, ClanSettings } from '../types/clan';
import { DEFAULT_CLAN_SETTINGS } from '../data/initialMembers';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';

const MEMBERS_COLLECTION = 'members';
const SETTINGS_COLLECTION = 'clan_settings';
const SETTINGS_DOC_ID = 'general';

/**
 * Subscribes to real-time updates for Clan Members strictly from Firestore.
 * Does NOT inject fake/local dummy members.
 */
export function subscribeToMembers(
  onUpdate: (members: ClanMember[]) => void,
  onError?: (err: unknown) => void
): () => void {
  try {
    const q = query(collection(db, MEMBERS_COLLECTION), orderBy('order', 'asc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const members: ClanMember[] = [];
        snapshot.forEach((docSnap) => {
          members.push({
            ...(docSnap.data() as ClanMember),
            id: docSnap.id,
          });
        });
        onUpdate(members);
      },
      (error) => {
        console.error('Firestore subscription error:', error);
        onError?.(error);
        try {
          handleFirestoreError(error, OperationType.GET, MEMBERS_COLLECTION);
        } catch {
          onUpdate([]);
        }
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error('Failed to initialize members listener:', error);
    try {
      handleFirestoreError(error, OperationType.GET, MEMBERS_COLLECTION);
    } catch {
      onUpdate([]);
    }
    return () => {};
  }
}

/**
 * Creates or updates a clan member in Firestore with custom Base64 photo and info.
 */
export async function saveMember(member: ClanMember, adminEmail?: string): Promise<void> {
  const path = `${MEMBERS_COLLECTION}/${member.id}`;
  try {
    const dataToSave = {
      ...member,
      clanTag: member.clanTag || 'VALKYR',
      updatedAt: new Date().toISOString(),
      updatedBy: adminEmail || 'Admin',
    };
    await setDoc(doc(db, MEMBERS_COLLECTION, member.id), dataToSave, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Updates partial clan member fields in Firestore.
 */
export async function updateMemberInfo(
  memberId: string,
  partialData: Partial<ClanMember>,
  adminEmail?: string
): Promise<void> {
  const path = `${MEMBERS_COLLECTION}/${memberId}`;
  try {
    const dataToSave = {
      ...partialData,
      updatedAt: new Date().toISOString(),
      updatedBy: adminEmail || 'Admin',
    };
    await updateDoc(doc(db, MEMBERS_COLLECTION, memberId), dataToSave);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Deletes a clan member from Firestore.
 */
export async function deleteMember(memberId: string): Promise<void> {
  const path = `${MEMBERS_COLLECTION}/${memberId}`;
  try {
    await deleteDoc(doc(db, MEMBERS_COLLECTION, memberId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Fetches Clan Settings from Firestore.
 */
export async function getClanSettings(): Promise<ClanSettings> {
  const path = `${SETTINGS_COLLECTION}/${SETTINGS_DOC_ID}`;
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return {
        ...DEFAULT_CLAN_SETTINGS,
        ...(snap.data() as ClanSettings),
      };
    }
    return DEFAULT_CLAN_SETTINGS;
  } catch (error) {
    console.warn('Error fetching clan settings:', error);
    return DEFAULT_CLAN_SETTINGS;
  }
}

/**
 * Saves Clan Settings to Firestore.
 */
export async function saveClanSettings(settings: ClanSettings): Promise<void> {
  const path = `${SETTINGS_COLLECTION}/${SETTINGS_DOC_ID}`;
  try {
    await setDoc(doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID), {
      ...settings,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}
