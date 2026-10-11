import { ShieldCheck } from 'lucide-react';
import { ClanSettings } from '../types/clan';

interface Props {
  settings: ClanSettings;
  onOpenLegitimacyChecker: () => void;
  onOpenAdminAuth: () => void;
  isAdmin: boolean;
}

export function Footer({
  settings,
  onOpenLegitimacyChecker,
  onOpenAdminAuth,
  isAdmin,
}: Props) {
  return (
    <footer className="mt-20 border-t border-zinc-850 bg-zinc-950 text-zinc-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: Clan Branding */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg overflow-hidden border border-zinc-700 bg-zinc-900">
                <img
                  src="/valkyr-logo.png"
                  alt="VALKYR Logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-white font-black tracking-widest text-base uppercase font-mono">
                {settings.name || 'VALKYR'}
              </span>
            </div>
            <p className="text-zinc-400 text-xs leading-relaxed max-w-md">
              {settings.description ||
                'Official member directory and clan legitimacy registry.'}
            </p>
          </div>

          {/* Col 2: Legitimacy & Verification */}
          <div className="space-y-3">
            <h4 className="text-white font-bold tracking-wider uppercase text-xs">
              Anti-Impersonation
            </h4>
            <p className="text-xs text-zinc-400 leading-normal">
              All official clan players are cataloged here. Cross-check IGNs before competitive agreements or trades.
            </p>
            <button
              onClick={onOpenLegitimacyChecker}
              className="text-purple-400 hover:text-purple-300 font-semibold inline-flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Verify Legitimacy</span>
            </button>
          </div>

          {/* Col 3: Quick Links & Admin */}
          <div className="space-y-3">
            <h4 className="text-white font-bold tracking-wider uppercase text-xs">
              Organization
            </h4>
            <ul className="space-y-1.5 text-xs">
              {settings.discordUrl && (
                <li>
                  <a
                    href={settings.discordUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-white transition"
                  >
                    Discord Server
                  </a>
                </li>
              )}
              {settings.facebookUrl && (
                <li>
                  <a
                    href={settings.facebookUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-white transition"
                  >
                    Facebook Page
                  </a>
                </li>
              )}
              {settings.tiktokUrl && (
                <li>
                  <a
                    href={settings.tiktokUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-white transition"
                  >
                    TikTok Channel
                  </a>
                </li>
              )}
              <li className="pt-1">
                <button
                  onClick={onOpenAdminAuth}
                  className="text-zinc-500 hover:text-zinc-300 transition text-[11px]"
                >
                  {isAdmin ? 'Admin Dashboard (Active)' : 'Admin Access'}
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-zinc-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-zinc-600">
          <p>© {new Date().getFullYear()} {settings.name || 'VALKYR'}. All Rights Reserved.</p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-zinc-400">Firebase Firestore Real-Time Active</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
