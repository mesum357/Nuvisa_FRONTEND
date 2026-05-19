/** @type {import('next').NextConfig} */
const isProduction = process.env.NODE_ENV === "production";

const nextConfig = {
  reactStrictMode: true,
  compress: true,
  poweredByHeader: false,
  env: {
    NEXT_PUBLIC_ADMIN_API_URL: process.env.NEXT_PUBLIC_ADMIN_API_URL,
  },
  images: {
    deviceSizes: [320, 420, 640, 768, 1024, 1200, 1440, 1920],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "www.nuvisa.co.uk",
      },
    ],
  },
  async headers() {
    const longCache = "public, max-age=31536000, immutable";
    const headers = [
      {
        source: "/video/:path*",
        headers: [{ key: "Cache-Control", value: longCache }],
      },
      {
        source: "/image/:path*",
        headers: [{ key: "Cache-Control", value: longCache }],
      },
      {
        source: "/icons/:path*",
        headers: [{ key: "Cache-Control", value: longCache }],
      },
      {
        source: "/favicon.ico",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
    ];

    if (isProduction) {
      headers.push({
        source: "/_next/static/:path*",
        headers: [{ key: "Cache-Control", value: longCache }],
      });
    }

    return headers;
  },

  

};

export default nextConfig;
