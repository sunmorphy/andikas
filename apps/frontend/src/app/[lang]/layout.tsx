import type { Metadata } from "next";
import { Suspense } from "react";
import localFont from "next/font/local";
import "../globals.css";
import { cn } from "@/lib/utils";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Locale } from "@/i18n-config";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import HashScroller from "@/components/HashScroller";
import ThemeProvider from "@/components/ThemeProvider";

import { i18n } from "@/i18n-config";

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
      weight: "700",
      style: "normal",
    },
    {
      path: "../fonts/HaasGrotText-76BoldItalic.woff2",
      weight: "700",
      style: "italic",
    },
  ],
  variable: "--font-haas",
});

export const metadata: Metadata = {
  title: "Andika Sultanrafli - Portfolio",
  description: "Independent product designer and full-stack engineer building digital experiences.",
};

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
  } catch (e) {
    preconnectUrl = backendUrl;
  }

  return (
    <html lang={lang} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href={preconnectUrl} crossOrigin="anonymous" />
      </head>
      <body
        suppressHydrationWarning
        className={`${haasGrotesk.variable} min-h-screen bg-surface text-ink font-sans selection:bg-brand-900 selection:text-neutral-50`}
      >
        <ThemeProvider>
          <Header lang={lang} />
          <main className="min-h-[calc(100vh-160px)]">{children}</main>
          <Footer lang={lang} />
          <Analytics />
          <SpeedInsights />
          <Suspense fallback={null}>
            <HashScroller />
          </Suspense>
        </ThemeProvider>
      </body>
    </html>
  );
}
