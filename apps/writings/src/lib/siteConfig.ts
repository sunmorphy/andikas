/**
 * Centralized site configuration for writings.andikas.dev
 * Decouples hardcoded domain names across metadataBase, OpenGraph, sitemap, robots, and JSON-LD schemas.
 */
function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "https://writings.andikas.dev";
}

export const siteConfig = {
  get url() {
    return getBaseUrl();
  },
  get domain() {
    try {
      return new URL(getBaseUrl()).hostname;
    } catch {
      return "writings.andikas.dev";
    }
  },
  mainSiteUrl: process.env.NEXT_PUBLIC_MAIN_SITE_URL || "https://andikas.dev",
  get mainSiteDomain() {
    try {
      return new URL(this.mainSiteUrl).hostname;
    } catch {
      return "andikas.dev";
    }
  },
  title: "Writings — Andika Sultanrafli",
  description: "My research, blogs, or just sharing my thoughts.",
  author: "Andika Sultanrafli",
};
