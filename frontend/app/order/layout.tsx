import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Order",
  description:
    "Choose your AISHE plan and get instant access to autonomous AI analysis, automation, and enterprise security controls.",
  alternates: {
    canonical: "/order",
  },
  openGraph: {
    title: "Order AISHE | Autonomous AI Assistant Plans",
    description:
      "Choose your AISHE plan and get instant access to autonomous AI analysis, automation, and enterprise security controls.",
    url: "https://app.aishe.pro/order",
  },
};

export default function OrderLayout({ children }: { children: React.ReactNode }) {
  return children;
}
