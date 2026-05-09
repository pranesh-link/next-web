/** @type {import('next').NextConfig} */
import withPWAInit from "@ducanh2912/next-pwa";
// import runtimeCaching from "@ducanh2912/next-pwa/cache.js";
import packageJson from "./package.json" assert { type: "json" };

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  skipWaiting: true,
  reloadOnOnline: true,
  // runtimeCaching,
  scope: "/",
  disable: process.env.NEXT_PUBLIC_DISABLE_PWA === "true",
  // Do not cache page navigations from the SW — Next.js handles routing/data freshness.
  // This prevents stale page chrome (and therefore stale client JS) from being served
  // after a deploy, which has caused data-loss bugs (old client → silently dropped fields).
  cacheOnFrontEndNav: false,
  aggressiveFrontEndNavCaching: false,
  workboxOptions: {
    // Don't precache HTML documents; only static assets.
    exclude: [
      /\.map$/,
      /^manifest.*\.js$/,
      /\/couple\/finance\//,
    ],
  },
  fallbacks: {
    document: "/offline",
  },
});
const nextConfig = {
  allowedDevOrigins: ["dev.data.lilly.com", "192.168.1.9"],
  compiler: {
    styledComponents: true,
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error", "warn"] } : false,
  },
  env: {
    version: packageJson.version,
  },
  // Performance optimizations
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  
  // Image optimization
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000, // 1 year
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "3737",
        pathname: "/api/**",
      },
      {
        protocol: "https",
        hostname: "pranesh.link",
        pathname: "/api/**",
      },
    ],
  },
  
  // Production optimizations
  productionBrowserSourceMaps: false,
  experimental: {
    optimizePackageImports: ['react-icons', 'lodash', '@reduxjs/toolkit'],
  },
  
  // Turbopack configuration (stable in Next.js 15+)
  turbopack: {},
  
  // Headers for caching
  async headers() {
    return [
      {
        source: '/couple/finance/budget-planner/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
      {
        source: '/:all*(svg|jpg|jpeg|png|gif|webp|avif|ico|css|js)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default withPWA(nextConfig);
