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
  fallbacks: {
    document: "/offline",
  },
});
const nextConfig = {
  compiler: {
    styledComponents: true,
    removeConsole: process.env.NODE_ENV === "production",
  },
  env: {
    version: packageJson.version,
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "7373",
        pathname: "/images/**",
      },
    ],
  },
};

export default withPWA(nextConfig);
