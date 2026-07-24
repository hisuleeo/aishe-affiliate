import type { MarketSession } from '@/types/market-command-center';
import { getSessionState } from '@/lib/market-command-center/time';
import { CommandCenterCard } from './CommandCenterCard';

type MarketSessionsProps = {
  sessions: MarketSession[];
};

export function MarketSessions({ sessions }: MarketSessionsProps) {
  return (
    <CommandCenterCard title="Market Sessions" subtitle="Global session map">
      <div className="grid gap-3 sm:grid-cols-2">
        {sessions.map((session) => {
          const state = getSessionState(session.open, session.close);
          return (
            <article
              key={session.name}
              className={`rounded-xl border p-3 ${
                state.status === 'open'
                  ? 'border-[#22C55E]/40 bg-[#22C55E]/10 shadow-[0_0_20px_rgba(34,197,94,0.25)]'
                  : state.status === 'upcoming'
                    ? 'border-[#06B6D4]/25 bg-[#06B6D4]/10'
                    : 'border-white/10 bg-white/[0.02]'
              }`}
            >
              <p className="text-sm font-semibold text-[#F8FAFC]">{session.name}</p>
              <p className="mt-1 text-xs text-[#94A3B8]">{session.open} - {session.close}</p>
              <p className="mt-2 text-xs text-[#F8FAFC]">{state.label}</p>
            </article>
          );
        })}
      </div>
    </CommandCenterCard>
  );
}
