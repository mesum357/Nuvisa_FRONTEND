/** @type {import('next').NextConfig} */
const isProduction = process.env.NODE_ENV === "production";

const nextConfig = {
  reactStrictMode: true,
  compress: true,
  poweredByHeader: false,
  compiler: isProduction
    ? {
        removeConsole: {
          exclude: ["error", "warn"],
        },
      }
    : undefined,
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "react-icons",
      "react-icons/fa",
      "react-feather",
      "@stripe/react-stripe-js",
      "@stripe/stripe-js",
    ],
  },
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
      {
        protocol: "https",
        hostname: "nuvisa-admin.vercel.app",
      },
      ...(process.env.NEXT_PUBLIC_ADMIN_API_URL?.includes("localhost")
        ? [
            {
              protocol: "http",
              hostname: "localhost",
              port: "3001",
              pathname: "/**",
            },
          ]
        : []),
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
