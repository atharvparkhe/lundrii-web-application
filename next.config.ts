import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Ticket photos currently render with a plain <img>. Keep Cloudinary
    // allowed so next/image can load res.cloudinary.com later without a config change.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
  },
  async headers() {
    return [
      {
        // The worker must never be served from cache, or a released fix can
        // sit behind a stale copy for as long as the browser decides to.
        source: "/sw.js",
        headers: [
          {
            key: "Content-Type",
            value: "application/javascript; charset=utf-8",
          },
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; script-src 'self'",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
