import type { TimelineEvent } from '@/types/market-command-center';
import { getTimelineState, importanceToStars } from '@/lib/market-command-center/time';
import { CommandCenterCard } from './CommandCenterCard';

type TodaysTimelineProps = {
  events: TimelineEvent[];
};

function statusClass(status: 'completed' | 'active' | 'upcoming') {
  if (status === 'completed') return 'border-[#22C55E]/35 bg-[#22C55E]/10';
  if (status === 'active') return 'border-[#06B6D4]/70 bg-[#06B6D4]/15 shadow-[0_0_18px_rgba(6,182,212,0.4)]';
  return 'border-white/10 bg-white/[0.02]';
}

export function TodaysTimeline({ events }: TodaysTimelineProps) {
  const { getEventStatus } = getTimelineState(events);

  return (
    <CommandCenterCard title="Today's Timeline" subtitle="Most critical intraday guide" className="h-full">
      <div className="relative space-y-3 pl-4">
        <div className="absolute bottom-2 left-[11px] top-2 w-px bg-gradient-to-b from-[#06B6D4]/60 via-white/15 to-white/10" />
        {events.map((event, index) => {
          const status = getEventStatus(index);
          return (
            <article
              key={`${event.time}-${event.title}`}
              className={`relative rounded-xl border p-3 transition ${statusClass(status)}`}
            >
              <span
                className={`absolute -left-[13px] top-5 h-2.5 w-2.5 rounded-full border border-white/35 ${
                  status === 'completed'
                    ? 'bg-[#22C55E]'
                    : status === 'active'
                      ? 'animate-pulse bg-[#06B6D4]'
                      : 'bg-[#64748B]'
                }`}
              />
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-[#F8FAFC]">{event.time} · {event.title}</p>
                  <p className="text-xs text-[#94A3B8]">{event.subtitle}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-[#F59E0B]">{importanceToStars(event.importance)}</p>
                  <p className="mt-1 text-[11px] uppercase tracking-wide text-[#94A3B8]">
                    {status === 'completed' ? 'Tamamlandi' : status === 'active' ? 'Simdi' : 'Bekleniyor'}
                  </p>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </CommandCenterCard>
  );
}
