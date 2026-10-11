import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, doc, getDoc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

export const BOOTSTRAPPED_ADMIN_EMAIL = 'kyledesillarico@gmail.com';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

export async function isAuthorizedAdmin(user: User): Promise<boolean> {
  if (user.email === BOOTSTRAPPED_ADMIN_EMAIL) return true;

  try {
    const adminDoc = await getDoc(doc(db, 'admins', user.uid));
    return adminDoc.exists();
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'permission-denied'
    ) {
      return false;
    }
    throw error;
  }
}

export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or database initializing.');
      return false;
    }
    // Expected if test doc does not exist yet
    return true;
  }
}

export { signInWithEmailAndPassword, signOut, onAuthStateChanged };
export type { User };
