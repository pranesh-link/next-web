/** @type {import('next').NextConfig} */
import packageJson from "./package.json" assert { type: "json" };
const nextConfig = {
  redirects: async () => [
    // {
    //   source: "/bmi:slug*",
    //   destination: "/tools/bmi-calculator",
    //   permanent: true,
    // },
  ],
  compiler: {
    styledComponents: true,
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

export default nextConfig;
