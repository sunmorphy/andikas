import type { Metadata } from "next";
import localFont from "next/font/local";
import { headers, cookies } from "next/headers";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ThemeProvider from "@/components/ThemeProvider";
import { Locale, i18n } from "@/i18n-config";
import { getDictionary } from "@/get-dictionary";
import { siteConfig } from "@/lib/siteConfig";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

const haasGrotesk = localFont({
  src: [
    {
      path: "./fonts/HaasGrotText-55Roman.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/HaasGrotText-56Italic.woff2",
      weight: "400",
      style: "italic",
    },
    {
      path: "./fonts/HaasGrotText-65Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "./fonts/HaasGrotText-66MediumItalic.woff2",
      weight: "500",
      style: "italic",
    },
    {
      path: "./fonts/HaasGrotText-75Bold.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "./fonts/HaasGrotText-75Bold.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "./fonts/HaasGrotText-75Bold.woff2",
      weight: "800",
      style: "normal",
    },
    {
      path: "./fonts/HaasGrotText-75Bold.woff2",
      weight: "900",
      style: "normal",
    },
    {
      path: "./fonts/HaasGrotText-76BoldItalic.woff2",
      weight: "600",
      style: "italic",
    },
    {
      path: "./fonts/HaasGrotText-76BoldItalic.woff2",
      weight: "700",
      style: "italic",
    },
    {
      path: "./fonts/HaasGrotText-76BoldItalic.woff2",
      weight: "800",
      style: "italic",
    },
    {
      path: "./fonts/HaasGrotText-76BoldItalic.woff2",
      weight: "900",
      style: "italic",
    },
  ],
  variable: "--font-haas",
  display: "block",
  preload: true,
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: "Writings — Andika Sultanrafli",
    template: "%s — Andika Sultanrafli",
  },
  description: "My research, blogs, or just sharing my thoughts.",
  alternates: {
    canonical: "/",
    languages: {
      en: "/",
      id: "/?lang=id",
      de: "/?lang=de",
      ja: "/?lang=ja",
      nl: "/?lang=nl",
    },
  },
  openGraph: {
    title: "Writings — Andika Sultanrafli",
    description: "My research, blogs, or just sharing my thoughts.",
    url: siteConfig.url,
    siteName: "Andika Sultanrafli Writings",
    type: "website",
    images: [
      {
        url: `${siteConfig.url}/og.png`,
        width: 1200,
        height: 630,
        alt: "Writings — Andika Sultanrafli",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Writings — Andika Sultanrafli",
    description: "My research, blogs, or just sharing my thoughts.",
    images: [`${siteConfig.url}/og.png`],
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let lang = i18n.defaultLocale as Locale;
  try {
    const headerList = await headers();
    const headerLang = headerList.get("x-locale");
    if (headerLang && (i18n.locales as readonly string[]).includes(headerLang)) {
      lang = headerLang as Locale;
    } else {
      const cookieStore = await cookies();
      const cookieLang = cookieStore.get("NEXT_LOCALE")?.value;
      if (cookieLang && (i18n.locales as readonly string[]).includes(cookieLang)) {
        lang = cookieLang as Locale;
      }
    }
  } catch {
    // Fallback if rendered statically
  }

  const dict = await getDictionary(lang);

  return (
    <html lang={lang} suppressHydrationWarning className={haasGrotesk.variable}>
      <body
        suppressHydrationWarning
        className={`${haasGrotesk.className} ${haasGrotesk.variable} min-h-screen bg-surface text-ink font-sans selection:bg-brand-900 selection:text-neutral-50`}
      >
        <ThemeProvider>
          <Header lang={lang} dict={dict?.nav} />
          <main className="min-h-[calc(100vh-220px)]">{children}</main>
          <Footer lang={lang} dict={dict?.footer} />
          {process.env.NODE_ENV === "production" && (
            <>
              <Analytics />
              <SpeedInsights />
            </>
          )}
        </ThemeProvider>
      </body>
    </html>
  );
}
