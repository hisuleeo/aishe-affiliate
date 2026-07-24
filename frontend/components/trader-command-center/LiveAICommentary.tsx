'use client';

import { useEffect, useMemo, useState } from 'react';

type LiveAICommentaryProps = {
  lines: string[];
};

export function LiveAICommentary({ lines }: LiveAICommentaryProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % lines.length);
    }, 9000);

    return () => window.clearInterval(timer);
  }, [lines.length]);

  const visible = useMemo(() => {
    if (lines.length < 3) return lines;
    return [lines[index], lines[(index + 1) % lines.length], lines[(index + 2) % lines.length]];
  }, [index, lines]);

  return (
    <aside className="fixed bottom-4 right-4 z-30 hidden w-[320px] rounded-2xl border border-[#06B6D4]/30 bg-[#0F172A]/85 p-4 shadow-[0_20px_50px_rgba(2,8,23,0.6)] backdrop-blur-xl xl:block">
      <p className="text-[11px] uppercase tracking-[0.22em] text-[#94A3B8]">Live AI Commentary</p>
      <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.02] p-3">
        <p className="text-[11px] uppercase tracking-[0.14em] text-[#94A3B8]">Anlik yorum</p>
        <p className="mt-1 text-sm font-medium text-[#CFFAFE]">{visible[0]}</p>
        <p className="mt-2 text-xs text-[#94A3B8]">Sonraki: {visible[1]}</p>
      </div>
    </aside>
  );
}
