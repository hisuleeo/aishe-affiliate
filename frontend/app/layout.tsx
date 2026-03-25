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
  title: {
    default: "AISHE | Autonomous AI Assistant",
    template: "%s | AISHE",
  },
  description:
    "AISHE is an autonomous AI assistant that runs locally — delivering intelligent analysis, workflow automation, and enterprise-grade security controls in a single dashboard.",
  keywords: [
    "AISHE",
    "autonomous AI assistant",
    "AI automation",
    "local AI",
    "AI analysis",
    "workflow automation",
    "secure AI",
    "enterprise AI",
    "AI governance",
    "AI controls",
    "machine learning",
    "AI platform",
  ],
  authors: [{ name: "AISHE" }],
  creator: "AISHE",
  publisher: "AISHE",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    alternateLocale: "tr_TR",
    url: "https://app.aishe.pro",
    siteName: "AISHE",
    title: "AISHE | Autonomous AI Assistant",
    description:
      "AISHE is an autonomous AI assistant that runs locally — delivering intelligent analysis, workflow automation, and enterprise-grade security controls in a single dashboard.",
    images: [
      {
        url: "https://app.aishe.pro/brand/og-image.png",
        width: 1200,
        height: 630,
        alt: "AISHE – Autonomous AI Assistant",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@aishe_ai",
    creator: "@aishe_ai",
    title: "AISHE | Autonomous AI Assistant",
    description:
      "Autonomous AI that runs locally. Analysis, automation, and security controls — all in one platform.",
    images: ["https://app.aishe.pro/brand/og-image.png"],
  },
  icons: {
    icon: "/brand/favicon.png",
    shortcut: "/brand/favicon.png",
    apple: "/brand/favicon.png",
  },
  metadataBase: new URL("https://app.aishe.pro"),
  alternates: {
    canonical: "/",
  },
  other: {
    "theme-color": "#0f172a",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://app.aishe.pro/#organization",
      name: "AISHE",
      url: "https://app.aishe.pro",
      logo: {
        "@type": "ImageObject",
        url: "https://app.aishe.pro/brand/favicon.png",
      },
      sameAs: [],
    },
    {
      "@type": "SoftwareApplication",
      "@id": "https://app.aishe.pro/#software",
      name: "AISHE",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      offers: {
        "@type": "Offer",
        url: "https://app.aishe.pro/#pricing",
      },
      description:
        "AISHE is an autonomous AI assistant that runs locally — delivering intelligent analysis, workflow automation, and enterprise-grade security controls in a single dashboard.",
      publisher: {
        "@id": "https://app.aishe.pro/#organization",
      },
    },
    {
      "@type": "WebSite",
      "@id": "https://app.aishe.pro/#website",
      url: "https://app.aishe.pro",
      name: "AISHE",
      publisher: {
        "@id": "https://app.aishe.pro/#organization",
      },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: "https://app.aishe.pro/?q={search_term_string}",
        },
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {/* Protect AISHE brand name from Google Translate */}
        <script dangerouslySetInnerHTML={{ __html: `
(function(){
  var BRAND='AISHE';
  var rx=/\\b(Ay[sş]e|A[iI][sş]e|Aische|Ayche|AYSCHE)\\b/g;
  var busy=false;

  // Fix page title
  function fixTitle(){
    var t=document.title;
    var f=t.replace(rx,BRAND);
    if(f!==t)document.title=f;
  }

  // Fix a single text node
  function fixNode(node){
    if(!node||!node.nodeValue)return;
    var f=node.nodeValue.replace(rx,BRAND);
    if(f!==node.nodeValue){busy=true;node.nodeValue=f;busy=false;}
  }

  // Walk all text nodes in an element
  function walkText(root){
    var w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,null);
    var n;while((n=w.nextNode()))fixNode(n);
  }

  // Title observer
  var titleEl=document.querySelector('title');
  if(titleEl)new MutationObserver(fixTitle).observe(titleEl,{childList:true,characterData:true,subtree:true});

  // Body observer — runs after page load
  window.addEventListener('load',function(){
    walkText(document.body);
    new MutationObserver(function(ms){
      if(busy)return;
      ms.forEach(function(m){
        if(m.type==='characterData')fixNode(m.target);
        else if(m.type==='childList')m.addedNodes.forEach(function(n){if(n.nodeType===3)fixNode(n);else if(n.nodeType===1)walkText(n);});
      });
    }).observe(document.body,{subtree:true,characterData:true,childList:true});
  });

  setInterval(fixTitle,2000);
})();
        `}} />
      </head>
      <body className={`${interSans.variable} ${interMono.variable} antialiased`}>
        <Providers>
          {children}
          <ChatWidget />
          <CookieConsent />
        </Providers>
        <div id="google_translate_element" className="hidden" />
        <Script id="google-translate-init" strategy="afterInteractive">
          {`function googleTranslateElementInit(){new window.google.translate.TranslateElement({pageLanguage:'en',includedLanguages:'af,sq,am,ar,hy,az,eu,be,bn,bs,bg,ca,ceb,zh-CN,zh-TW,co,hr,cs,da,nl,en,eo,et,fi,fr,fy,gl,ka,de,el,gu,ht,ha,haw,he,hi,hmn,hu,is,ig,id,ga,it,ja,jv,kn,kk,km,ko,ku,ky,lo,la,lv,lt,lb,mk,mg,ms,ml,mt,mi,mr,mn,my,ne,no,ny,ps,fa,pl,pt,pa,ro,ru,sm,gd,sr,st,sn,sd,si,sk,sl,so,es,su,sw,sv,tl,tg,ta,te,th,tr,uk,ur,uz,vi,cy,xh,yi,yo,zu',layout:window.google.translate.TranslateElement.InlineLayout.SIMPLE,autoDisplay:false},'google_translate_element');}`}
        </Script>
        <Script
          src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
