import Image from "next/image";
import Link from "next/link";

const resources = ["Whitepaper", "Technical Whitepaper", "Roadmap", "News & Blog", "FAQ"];
const legal = ["About Us", "Contact Us", "Compliance Overview", "Brand Assets", "Careers"];

type FooterSite = "uk" | "pro" | "other";

export default function Footer({ site = "other" }: { site?: FooterSite }) {

  if (site === "pro") {
    return (
      <footer className="border-t border-cyan-300/12 bg-[#071427] font-sans text-[#c4d8e8]">
        <div className="mx-auto grid max-w-[1400px] gap-14 px-10 py-14 md:grid-cols-3">
          <div>
            <h3 className="mb-4 text-2xl font-semibold text-white">About AISHE PRO</h3>
            <Image src="/brand/aishelogo.png" alt="AISHE PRO" width={260} height={76} className="mb-4 h-14 w-auto" />
            <p className="max-w-[520px] text-base leading-relaxed text-[#9db3c6]">
              AISHE PRO delivers advanced AI automation for traders and teams who need precision, speed, and control.
            </p>
          </div>

          <div>
            <h3 className="mb-6 text-2xl font-semibold text-white">Resources</h3>
            <ul className="space-y-3 text-base text-[#9db3c6]">
              {resources.map((item) => <li key={item}>➜ {item}</li>)}
            </ul>
          </div>

          <div>
            <h3 className="mb-6 text-2xl font-semibold text-white">Company & Legal</h3>
            <ul className="space-y-3 text-base text-[#9db3c6]">
              {legal.map((item) => <li key={item}>➜ {item}</li>)}
            </ul>
          </div>
        </div>

        <div className="border-t border-cyan-300/12 bg-[#061220]">
          <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-5 px-8 py-4 text-sm">
            <p>Copyright © 2026 AISHE PRO. All rights reserved.</p>
            <div className="flex flex-wrap items-center gap-5 font-sans">
              <Link href="/blog">Blog</Link>
              <Link href="/privacy-policy">Privacy Policy</Link>
              <Link href="/terms-and-conditions">Terms & Conditions</Link>
              <Link href="/risk-disclaimer">Risk Disclaimer</Link>
              <Link href="/sitemap">Sitemap</Link>
            </div>
            <a href="#top">To Top</a>
          </div>
        </div>
      </footer>
    );
  }

  if (site !== "uk") {
    return (
      <footer className="border-t border-slate-800 bg-slate-950 px-6 py-8 text-center text-sm text-slate-400">
        <p>Copyright 2026 AISHE. All rights reserved.</p>
      </footer>
    );
  }

  return (
    <footer className="border-t border-white/10 bg-[#3f3f42] font-sans text-[#d4d4d4]">
      <div className="mx-auto grid max-w-[1400px] gap-16 px-10 py-16 md:grid-cols-3">
        <div>
          <h3 className="mb-4 text-2xl font-semibold">About AISHE - The AISHE Project</h3>
          <Image src="/brand/aisheuk.png" alt="AISHE UK" width={260} height={76} className="mb-4 h-16 w-auto" />
          <p className="max-w-[520px] text-base leading-relaxed text-[#b8b8b8]">
            AISHE is a proven, profitable Applied AI agent for the financial markets. We are transitioning our ...
          </p>
          <div className="mt-6 flex gap-4 text-3xl">
            <span>ⓕ</span><span>𝕏</span><span>▶</span><span>◎</span><span>◔</span>
          </div>
        </div>

        <div>
          <h3 className="mb-6 text-3xl font-semibold">Resources</h3>
          <ul className="space-y-3 text-lg text-[#c3c3c3]">
            {resources.map((item) => <li key={item}>➜ {item}</li>)}
          </ul>
        </div>

        <div>
          <h3 className="mb-6 text-3xl font-semibold">Company & Legal</h3>
          <ul className="space-y-3 text-lg text-[#c3c3c3]">
            {legal.map((item) => <li key={item}>➜ {item}</li>)}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 bg-[#343539]">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-5 px-8 py-4 text-sm">
          <p>Copyright © 2025 AISHE UK. All Right Reserved</p>
          <div className="flex flex-wrap items-center gap-5 font-sans">
            <Link href="/blog">Blog</Link>
            <Link href="/privacy-policy">Privacy Policy</Link>
            <Link href="/terms-and-conditions">Terms & Conditions</Link>
            <Link href="/risk-disclaimer">Risk Disclaimer</Link>
            <Link href="/sitemap">Sitemap</Link>
          </div>
          <a href="#top">To Top</a>
        </div>
      </div>
    </footer>
  );
}
