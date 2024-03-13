/** @type {import('next').NextConfig} */
import withImages from "next-images";
const nextConfig = {
  output: "export",
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
