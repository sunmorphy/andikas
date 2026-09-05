export function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "https://andikas.dev";
}

export const siteConfig = {
  get url() {
    return getBaseUrl();
  },
  get domain() {
    try {
      return new URL(getBaseUrl()).hostname;
    } catch {
      return "andikas.dev";
    }
  },
};
