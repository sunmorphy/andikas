import type { Metadata } from "next";
import { Suspense } from "react";
import localFont from "next/font/local";
import "../globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Locale } from "@/i18n-config";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import HashScroller from "@/components/HashScroller";
import ThemeProvider from "@/components/ThemeProvider";
import { getDictionary } from "@/get-dictionary";

import { i18n } from "@/i18n-config";
import { siteConfig } from "@/lib/siteConfig";

const haasGrotesk = localFont({
  src: [
    {
      path: "../fonts/HaasGrotText-55Roman.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../fonts/HaasGrotText-56Italic.woff2",
      weight: "400",
      style: "italic",
    },
    {
      path: "../fonts/HaasGrotText-65Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../fonts/HaasGrotText-66MediumItalic.woff2",
      weight: "500",
      style: "italic",
    },
    {
      path: "../fonts/HaasGrotText-75Bold.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../fonts/HaasGrotText-75Bold.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "../fonts/HaasGrotText-75Bold.woff2",
      weight: "800",
      style: "normal",
    },
    {
      path: "../fonts/HaasGrotText-75Bold.woff2",
      weight: "900",
      style: "normal",
    },
    {
      path: "../fonts/HaasGrotText-76BoldItalic.woff2",
      weight: "600",
      style: "italic",
    },
    {
      path: "../fonts/HaasGrotText-76BoldItalic.woff2",
      weight: "700",
      style: "italic",
    },
    {
      path: "../fonts/HaasGrotText-76BoldItalic.woff2",
      weight: "800",
      style: "italic",
    },
    {
      path: "../fonts/HaasGrotText-76BoldItalic.woff2",
      weight: "900",
      style: "italic",
    },
  ],
  variable: "--font-haas",
  display: "block",
  preload: true,
});

interface Props {
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const lang = resolvedParams.lang as Locale;

  const shareImage = `${siteConfig.url}/og.png`;

  return {
    title: {
      default: "Andika Sultanrafli - Portfolio",
      template: "%s - Andika Sultanrafli",
    },
    description: "Independent product designer and full-stack engineer building digital experiences.",
    metadataBase: new URL(siteConfig.url),
    alternates: {
      canonical: `/${lang}`,
      languages: {
        en: "/en",
        id: "/id",
        de: "/de",
        ja: "/ja",
        nl: "/nl",
        "x-default": "/en",
      },
    },
    openGraph: {
      title: "Andika Sultanrafli",
      description: "Experienced software engineer.",
      url: `${siteConfig.url}/${lang}`,
      siteName: "Andika Sultanrafli",
      locale: lang === "id" ? "id_ID" : lang === "de" ? "de_DE" : lang === "ja" ? "ja_JP" : lang === "nl" ? "nl_NL" : "en_US",
      type: "website",
      images: [
        {
          url: shareImage,
          width: 1200,
          height: 630,
          alt: "Andika Sultanrafli",
        },
      ],
    },
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
  };
}

export async function generateStaticParams() {
  return i18n.locales.map((locale) => ({ lang: locale }));
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}>) {
  const resolvedParams = await params;
  const lang = resolvedParams.lang as Locale;

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
  let preconnectUrl = "http://localhost:3000";
  try {
    preconnectUrl = new URL(backendUrl).origin;
  } catch {
    preconnectUrl = backendUrl;
  }

  const [dict] = await Promise.all([
    getDictionary(lang),
  ]);

  return (
    <html lang={lang} suppressHydrationWarning className={haasGrotesk.variable}>
      <head>
        <link rel="preconnect" href={preconnectUrl} crossOrigin="anonymous" />
      </head>
      <body
        suppressHydrationWarning
        className={`${haasGrotesk.className} ${haasGrotesk.variable} min-h-screen bg-surface text-ink font-sans selection:bg-brand-900 selection:text-neutral-50`}
      >
        <ThemeProvider>
          <Header lang={lang} dict={dict?.nav} />
          <main className="min-h-[calc(100vh-160px)]">{children}</main>
          <Footer lang={lang} dict={dict?.footer} />
          {process.env.NODE_ENV === "production" && (
            <>
              <Analytics />
              <SpeedInsights />
            </>
          )}
          <Suspense fallback={null}>
            <HashScroller />
          </Suspense>
        </ThemeProvider>
      </body>
    </html>
  );
}
