"use client";

import type { HighwayCertificate } from "@/services/highwayQuizService";

type Props = {
  certificate: HighwayCertificate;
};

export function HighwayLicenseCard({ certificate }: Props) {
  return (
    <div className="rounded-xl border border-amber-500/20 bg-[#2c2a24]/85 p-5">
      <p className="text-xs uppercase tracking-widest text-amber-300/70">Highway License</p>
      <h3 className="mt-2 text-lg font-bold text-amber-200">{certificate.holderName || "AISHE User"}</h3>
      <p className="mt-2 text-sm text-slate-300">Level: {certificate.level || "Standard"}</p>
      <p className="text-sm text-slate-400">Issued: {certificate.issuedAt || "-"}</p>
    </div>
  );
}
