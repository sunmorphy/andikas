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
import { fetchUser } from "@/lib/api";

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

interface Props {
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const lang = resolvedParams.lang as Locale;

  let shareImage = "https://andikas.andpuji27.workers.dev/andikas/users/img_20251129_164332-cropped_20260410.webp";

  try {
    const user = await fetchUser(undefined, lang);
    if (user?.profilePhoto) {
      shareImage = user.profilePhoto;
    }
  } catch (error) {
    console.error("Failed to fetch dynamic share image from database:", error);
  }

  const isSquare = shareImage.toLowerCase().includes("cropped") || shareImage.split("?")[0].toLowerCase().endsWith(".gif");

  return {
    title: {
      default: "Andika Sultanrafli - Portfolio",
      template: "%s - Andika Sultanrafli",
    },
    description: "Independent product designer and full-stack engineer building digital experiences.",
    keywords: ["Andika Sultanrafli", "Product Designer", "Full-Stack Engineer", "Software Engineer", "React Developer", "Next.js", "Design Engineer", "Portfolio"],
    authors: [{ name: "Andika Sultanrafli" }],
    creator: "Andika Sultanrafli",
    metadataBase: new URL("https://andikas.dev"),
    alternates: {
      canonical: "/",
      languages: {
        "en-US": "/en",
        "id-ID": "/id",
        "de-DE": "/de",
      },
    },
    openGraph: {
      title: "Andika Sultanrafli - Portfolio",
      description: "Independent product designer and full-stack engineer building digital experiences.",
      url: "https://andikas.dev",
      siteName: "Andika Sultanrafli Portfolio",
      locale: "en_US",
      type: "website",
      images: [
        {
          url: shareImage,
          width: isSquare ? 600 : 1200,
          height: isSquare ? 600 : 630,
          alt: "Andika Sultanrafli - Portfolio",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Andika Sultanrafli - Portfolio",
      description: "Independent product designer and full-stack engineer building digital experiences.",
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
