import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login",
  description:
    "Sign in to your AISHE account to access your autonomous AI assistant dashboard, manage automations, and monitor intelligent workflows.",
  alternates: {
    canonical: "/login",
  },
  openGraph: {
    title: "Login | AISHE",
    description:
      "Sign in to your AISHE account to access your autonomous AI assistant dashboard.",
    url: "https://app.aishe.pro/login",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
