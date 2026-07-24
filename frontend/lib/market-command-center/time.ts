import type { TimelineEvent } from '@/types/market-command-center';

function toMinutes(time: string) {
  const [h, m] = time.split(':').map((value) => Number(value));
  return h * 60 + m;
}

export function getNowMinutes() {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

export function getTimelineState(events: TimelineEvent[]) {
  const nowMinutes = getNowMinutes();
  let activeIndex = -1;

  events.forEach((event, index) => {
    if (toMinutes(event.time) <= nowMinutes) {
      activeIndex = index;
    }
  });

  return {
    activeIndex,
    getEventStatus: (index: number) => {
      if (index < activeIndex) return 'completed' as const;
      if (index === activeIndex) return 'active' as const;
      return 'upcoming' as const;
    },
  };
}

export function getSessionState(open: string, close: string) {
  const now = getNowMinutes();
  const openMin = toMinutes(open);
  const closeMin = close === '24:00' ? 24 * 60 : toMinutes(close);

  const isOpen = now >= openMin && now < closeMin;
  if (isOpen) return { status: 'open' as const, label: 'Acik' };

  if (now < openMin) {
    return {
      status: 'upcoming' as const,
      label: `${openMin - now} dk sonra aciliyor`,
    };
  }

  const nextOpenIn = 24 * 60 - now + openMin;
  return {
    status: 'closed' as const,
    label: `${nextOpenIn} dk sonra aciliyor`,
  };
}

export function importanceToStars(level: number) {
  return '★'.repeat(level) + '☆'.repeat(Math.max(0, 5 - level));
}
