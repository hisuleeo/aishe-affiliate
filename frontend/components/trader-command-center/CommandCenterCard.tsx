import { PropsWithChildren } from 'react';

type CommandCenterCardProps = PropsWithChildren<{
  title?: string;
  subtitle?: string;
  className?: string;
}>;

export function CommandCenterCard({ title, subtitle, className, children }: CommandCenterCardProps) {
  return (
    <section
      className={`rounded-2xl border border-white/10 bg-[#0F172A]/70 p-5 shadow-[0_20px_60px_rgba(2,8,23,0.45)] backdrop-blur-xl ${className ?? ''}`}
    >
      {title ? (
        <header className="mb-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[#94A3B8]">{subtitle}</p>
          <h2 className="mt-1 text-lg font-semibold text-[#F8FAFC]">{title}</h2>
        </header>
      ) : null}
      {children}
    </section>
  );
}
