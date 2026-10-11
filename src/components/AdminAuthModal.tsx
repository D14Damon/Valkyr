import { useState } from 'react';
import {
  X,
  Lock,
  LogIn,
  KeyRound,
  Check,
  AlertCircle,
  Shield,
} from 'lucide-react';
import { signInWithPopup, googleProvider, auth } from '../firebase';

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
  const [passcode, setPasscode] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    setErrorMessage(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const email = result.user.email || 'kyledesillarico@gmail.com';
      onAdminAuthenticated(email);
      onClose();
    } catch (err) {
      console.error('Google Sign In error:', err);
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Google sign-in popup failed or was blocked. You can use the Clan Admin Passcode below.'
      );
    } finally {
      setIsSigningIn(false);
    }
  };

  const handlePasscodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const code = passcode.trim().toLowerCase();
    // Default master codes for owner convenience
    if (
      code === 'tyrant2026' ||
      code === 'tyrant' ||
      code === 'admin' ||
      code === 'kyle' ||
      code.includes('kyledesillarico')
    ) {
      onAdminAuthenticated('kyledesillarico@gmail.com');
      onClose();
    } else {
      setErrorMessage('Invalid admin key. (Hint: tyrant2026)');
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

        <div className="mt-5 space-y-4">
          {/* Google Sign In via Firebase Auth */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isSigningIn}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-white hover:bg-zinc-100 text-zinc-900 font-bold text-sm shadow-md transition disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{isSigningIn ? 'Connecting...' : 'Sign in with Google Account'}</span>
          </button>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-zinc-800 w-full" />
            <span className="bg-zinc-950 px-3 text-[11px] text-zinc-500 uppercase font-mono tracking-wider">
              Or Master Access Key
            </span>
          </div>

          {/* Quick passcode unlock */}
          <form onSubmit={handlePasscodeSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">
                Enter Clan Admin Passcode
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="password"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="Master passcode (tyrant2026)"
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-md transition"
            >
              Unlock Admin Dashboard
            </button>
          </form>
        </div>

        <p className="mt-5 text-[11px] text-zinc-500 text-center">
          Default Owner: <span className="text-zinc-400 font-mono">kyledesillarico@gmail.com</span>
        </p>
      </div>
    </div>
  );
}
