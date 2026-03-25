import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Get Started",
  description:
    "Create your AISHE account and start using autonomous AI for intelligent analysis, workflow automation, and secure enterprise controls — all in one platform.",
  alternates: {
    canonical: "/register",
  },
  openGraph: {
    title: "Get Started with AISHE | Autonomous AI Assistant",
    description:
      "Create your AISHE account and start using autonomous AI for intelligent analysis, workflow automation, and secure enterprise controls.",
    url: "https://app.aishe.pro/register",
  },
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
