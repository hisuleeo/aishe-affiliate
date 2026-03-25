import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn about AISHE — the autonomous AI assistant built for enterprises that need local AI, intelligent analysis, and secure automation in one unified platform.",
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: "About AISHE | Autonomous AI Assistant",
    description:
      "Learn about AISHE — the autonomous AI assistant built for enterprises that need local AI, intelligent analysis, and secure automation in one unified platform.",
    url: "https://app.aishe.pro/about",
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
