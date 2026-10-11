import { useState } from 'react';
import {
  X,
  Lock,
  LogIn,
  AlertCircle,
  Shield,
} from 'lucide-react';
import { FirebaseError } from 'firebase/app';
import {
  auth,
  isAuthorizedAdmin,
  signInWithEmailAndPassword,
  signOut,
} from '../firebase';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAdminAuthenticated: (email: string) => void;
}

export function AdminAuthModal({
  isOpen,
  onClose,
  onAdminAuthenticated,
}: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSigningIn(true);
    setErrorMessage(null);
    try {
      const result = await signInWithEmailAndPassword(auth, email.trim(), password);
      const authorized = await isAuthorizedAdmin(result.user);
      if (!authorized) {
        await signOut(auth);
        setErrorMessage('This account is not registered as a clan admin.');
        return;
      }

      onAdminAuthenticated(result.user.email || email.trim());
      onClose();
    } catch (err) {
      console.error('Admin sign-in error:', err);
      if (err instanceof FirebaseError) {
        switch (err.code) {
          case 'auth/invalid-credential':
          case 'auth/user-not-found':
          case 'auth/wrong-password':
            setErrorMessage('Incorrect email or password.');
            break;
          case 'auth/invalid-email':
            setErrorMessage('Enter a valid email address.');
            break;
          case 'auth/too-many-requests':
            setErrorMessage('Too many attempts. Please wait and try again.');
            break;
          default:
            setErrorMessage(err.message);
        }
      } else {
        setErrorMessage(err instanceof Error ? err.message : 'Failed to sign in.');
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden p-6">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-850">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-red-600/20 text-red-500 border border-red-600/30">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Clan Admin Portal</h3>
              <p className="text-xs text-zinc-400">
                Authorized roster & photo management
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

        {errorMessage && (
          <div className="mt-4 p-3 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-3">
          <div>
            <label htmlFor="admin-email" className="mb-1 block text-xs font-semibold text-zinc-400">
              Admin email
            </label>
            <input
              id="admin-email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-red-500 focus:outline-none"
              placeholder="admin@example.com"
            />
          </div>

          <div>
            <label htmlFor="admin-password" className="mb-1 block text-xs font-semibold text-zinc-400">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 py-2.5 pl-10 pr-4 text-sm text-white placeholder-zinc-600 focus:border-red-500 focus:outline-none"
                placeholder="Enter your password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSigningIn}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-red-500 disabled:cursor-wait disabled:opacity-50"
          >
            <LogIn className="h-4 w-4" />
            {isSigningIn ? 'Signing in...' : 'Sign in to Admin'}
          </button>
        </form>
      </div>
    </div>
  );
}
