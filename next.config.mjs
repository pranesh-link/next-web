/** @type {import('next').NextConfig} */
import withPWA from "next-pwa";
import runtimeCaching from "next-pwa/cache.js";
import packageJson from "./package.json" assert { type: "json" };

const withPWAConfig = withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  reloadOnOnline: true,
  runtimeCaching,
  scope: "/",

  disable: process.env.NODE_ENV === "development",
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

export default withPWAConfig(nextConfig);
