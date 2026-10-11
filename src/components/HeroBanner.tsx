import { Users } from 'lucide-react';

interface Props {
  memberCount: number;
}

export function HeroBanner({ memberCount }: Props) {
  return (
    <section className="relative z-10 overflow-hidden border-b border-white/[0.06] bg-[#080a11]/75">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_18%_0%,rgba(139,92,246,0.16),transparent_48%),linear-gradient(110deg,transparent_35%,rgba(255,255,255,0.025),transparent_70%)]" />
      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-7 sm:px-8 sm:py-8 md:flex-row md:items-center md:justify-between lg:px-10">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.24em] text-purple-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
            Official clan directory
          </div>
          <h2 className="text-2xl font-black uppercase tracking-wide text-white sm:text-3xl">
            Member roster
          </h2>
          <p className="mt-1 max-w-xl text-sm text-zinc-400">
            The verified home for every VALKYR member.
          </p>
        </div>

        <div className="flex w-full items-center gap-4 rounded-2xl border border-white/[0.08] bg-black/25 px-4 py-3 md:w-auto md:min-w-56">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-purple-400/20 bg-purple-500/10 text-purple-300">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-black leading-none text-white">{memberCount}</p>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Verified members
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
