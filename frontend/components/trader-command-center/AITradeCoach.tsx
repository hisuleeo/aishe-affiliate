import { CommandCenterCard } from './CommandCenterCard';

type AITradeCoachProps = {
  messages: string[];
};

export function AITradeCoach({ messages }: AITradeCoachProps) {
  return (
    <CommandCenterCard title="AI Trade Coach" subtitle="Nokta atisi yonlendirme">
      <div className="space-y-2">
        {messages.slice(0, 3).map((message, index) => (
          <article key={`${message}-${index}`} className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2.5">
            <p className="text-[11px] uppercase tracking-[0.14em] text-[#94A3B8]">Adim {index + 1}</p>
            <p className="mt-1 text-sm font-medium text-[#CFFAFE]">{message}</p>
          </article>
        ))}
      </div>
    </CommandCenterCard>
  );
}
