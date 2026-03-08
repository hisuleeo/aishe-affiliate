import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import Providers from "./providers";
import ChatWidget from "@/components/chat/ChatWidget";
import CookieConsent from "@/components/cookies/CookieConsent";

const interSans = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const interMono = Inter({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AISHE | Autonomous AI Assistant",
  description:
    "AISHE, yerel çalışan otonom AI asistanıyla analiz, otomasyon ve güvenli kontrol katmanlarını tek panelde sunar.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className={`${interSans.variable} ${interMono.variable} antialiased`}>
        <Providers>
          {children}
          <ChatWidget />
          <CookieConsent />
        </Providers>
        <Script id="google-translate-init" strategy="afterInteractive">
          {`function googleTranslateElementInit(){new window.google.translate.TranslateElement({pageLanguage:'tr',includedLanguages:'af,sq,am,ar,hy,az,eu,be,bn,bs,bg,ca,ceb,zh-CN,zh-TW,co,hr,cs,da,nl,en,eo,et,fi,fr,fy,gl,ka,de,el,gu,ht,ha,haw,he,hi,hmn,hu,is,ig,id,ga,it,ja,jv,kn,kk,km,ko,ku,ky,lo,la,lv,lt,lb,mk,mg,ms,ml,mt,mi,mr,mn,my,ne,no,ny,ps,fa,pl,pt,pa,ro,ru,sm,gd,sr,st,sn,sd,si,sk,sl,so,es,su,sw,sv,tl,tg,ta,te,th,tr,uk,ur,uz,vi,cy,xh,yi,yo,zu',layout:window.google.translate.TranslateElement.InlineLayout.SIMPLE},'google_translate_element');}`}
        </Script>
        <Script
          src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
