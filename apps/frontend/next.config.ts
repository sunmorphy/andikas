import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // logging: {
  //   fetches: {
  //     fullUrl: true, // Logs the full URL of fetch requests
  //   },
  // },

  images: {
    remotePatterns: [
      {
        // Backend image host
        protocol: "https",
        hostname: "andikas-be.vercel.app",
      },
      {
        // Allow any remaining CDN / object-storage URLs
        protocol: "https",
        hostname: "**",
      },
    ],
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Prevent site from being embedded in iframes (clickjacking)
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          // Prevent MIME-type sniffing
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Control referrer information
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Basic permissions policy — disable unused APIs
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          // Force HTTPS for 1 year (enable once fully on HTTPS)
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
          // Content Security Policy — allow resources only from known origins
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Next.js requires unsafe-inline/eval in dev; lock down in prod if possible
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https:",           // Allow all HTTPS images (covers remote skill/project icons)
              "connect-src 'self' https://andikas-be.vercel.app",
              "frame-ancestors 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
