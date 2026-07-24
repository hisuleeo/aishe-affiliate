import { AlertTriangle, Clock3, Crosshair, Shield } from 'lucide-react';

type QuickActionStripProps = {
  nowAction: string;
  nextHourFocus: string;
  hardWarning: string;
};

export function QuickActionStrip({ nowAction, nextHourFocus, hardWarning }: QuickActionStripProps) {
  return (
    <section className="grid gap-3 md:grid-cols-3">
      <article className="rounded-2xl border border-[#06B6D4]/35 bg-[#06B6D4]/10 p-4 backdrop-blur-xl">
        <p className="inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.16em] text-[#A5F3FC]">
          <Crosshair className="h-3.5 w-3.5" /> Simdi ne yapmali?
        </p>
        <p className="mt-2 text-sm font-semibold text-[#F8FAFC]">{nowAction}</p>
      </article>

      <article className="rounded-2xl border border-white/10 bg-[#0F172A]/70 p-4 backdrop-blur-xl">
        <p className="inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.16em] text-[#94A3B8]">
          <Clock3 className="h-3.5 w-3.5" /> Sonraki 1 saat
        </p>
        <p className="mt-2 text-sm font-semibold text-[#F8FAFC]">{nextHourFocus}</p>
      </article>

      <article className="rounded-2xl border border-[#EF4444]/35 bg-[#EF4444]/10 p-4 backdrop-blur-xl">
        <p className="inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.16em] text-[#FECACA]">
          <AlertTriangle className="h-3.5 w-3.5" /> Kirmizi uyari
        </p>
        <p className="mt-2 text-sm font-semibold text-[#F8FAFC]">{hardWarning}</p>
        <p className="mt-2 inline-flex items-center gap-1 text-xs text-[#FCA5A5]">
          <Shield className="h-3.5 w-3.5" /> Risk disiplini disina cikma.
        </p>
      </article>
    </section>
  );
}
