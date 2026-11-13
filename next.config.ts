import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      {
        // Header keamanan dasar untuk semua halaman dan API (finalist-release).
        source: "/(.*)",
        headers: [
          // Talkly tidak boleh ditanam di bingkai situs lain (clickjacking).
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Mikrofon (rekam) dan kamera (kartu foto benda) hanya untuk Talkly sendiri; fitur lain dimatikan.
          {
            key: "Permissions-Policy",
            value: "microphone=(self), camera=(self), geolocation=(), payment=(), usb=(), browsing-topics=()",
          },
        ],
      },
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
};

export default nextConfig;
