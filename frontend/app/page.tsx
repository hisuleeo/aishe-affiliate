"use client";

import { MarketingSiteHeader } from "@/components/layout/MarketingSiteHeader";

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#232323] text-white">
      <MarketingSiteHeader sectionHrefPrefix="/" solidBackground />

      <section className="relative h-screen w-screen pt-[74px]">
        <div className="relative h-full w-full overflow-hidden bg-black">
          <video
            className="h-full w-full object-cover"
            src="/media/new.mp4"
            autoPlay
            muted
            loop
            playsInline
          />
        </div>
      </section>
    </main>
  );
}
