import type { CriticalEvent } from '@/types/market-command-center';
import { importanceToStars } from '@/lib/market-command-center/time';
import { CommandCenterCard } from './CommandCenterCard';

type CriticalEventsProps = {
  events: CriticalEvent[];
};

export function CriticalEvents({ events }: CriticalEventsProps) {
  return (
    <CommandCenterCard title="Critical Events" subtitle="Sadece kritik saatler">
      <div className="space-y-2">
        {events.slice(0, 3).map((event) => (
          <article key={`${event.time}-${event.title}`} className="rounded-xl border border-white/10 bg-[#050D18]/45 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-[#F8FAFC]">{event.time} · {event.currency}</p>
              <p className="text-xs text-[#F59E0B]">{importanceToStars(event.impact)}</p>
            </div>
            <p className="mt-1 text-sm text-[#E2E8F0]">{event.title}</p>
            <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-[#94A3B8]">
              <span>Beklenti {event.forecast}</span>
              <span>·</span>
              <span>Onceki {event.previous}</span>
            </div>
            <p className="mt-2 text-xs text-[#CFFAFE]">AI: {event.aiCommentary}</p>
          </article>
        ))}
      </div>
    </CommandCenterCard>
  );
}
