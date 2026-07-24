import { MarketingSiteHeader } from "@/components/layout/MarketingSiteHeader";

export default function ComingSoonPage() {
  return (
    <>
      <MarketingSiteHeader sectionHrefPrefix="/" solidBackground />
      <main className="min-h-screen bg-[#232323] text-slate-100 flex items-center justify-center px-6 pt-24 pb-10">
        <section className="w-full max-w-2xl rounded-2xl border border-white/12 bg-[#2a2a2a]/92 p-8 text-center shadow-2xl">
          <p className="text-sm uppercase tracking-[0.18em] text-slate-300">AISHE</p>
          <h1 className="mt-4 text-4xl sm:text-5xl font-semibold">Coming Soon</h1>
          <p className="mt-4 text-slate-200 leading-relaxed">
            We are preparing an updated experience. Please check back shortly.
          </p>
        </section>
      </main>
    </>
  );
}
