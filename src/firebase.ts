import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { AdminRole } from './types/clan';

export const BOOTSTRAPPED_ADMIN_EMAIL = 'kyledesillarico@gmail.com';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

export async function getAdminRole(user: User): Promise<AdminRole | null> {
  if (user.email === BOOTSTRAPPED_ADMIN_EMAIL) return 'owner';

  try {
    const adminDoc = await getDoc(doc(db, 'admins', user.uid));
    if (!adminDoc.exists()) return null;
    const role = adminDoc.data().role;
    return role === 'owner' || role === 'roster_manager' || role === 'moderator'
      ? role
      : null;
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'permission-denied'
    ) {
      return null;
    }
    throw error;
  }
}

export async function isAuthorizedAdmin(user: User): Promise<boolean> {
  return (await getAdminRole(user)) !== null;
}

export async function testConnection(): Promise<boolean> {
  try {
    const response = await fetch('/api/health');
    if (!response.ok) throw new Error(`Turso API responded with status ${response.status}.`);
    return true;
  } catch (error) {
    console.error('Turso API connection test failed:', error);
    return false;
  }
}

export { signInWithEmailAndPassword, signOut, onAuthStateChanged };
export type { User };
