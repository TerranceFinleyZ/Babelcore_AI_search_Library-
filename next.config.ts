import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: "out",
  serverExternalPackages: ["oracledb", "ffmpeg-static", "fluent-ffmpeg"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.clerk.com",
      },
      {
        protocol: "https",
        hostname: "images.clerk.dev",
      },
    ],
  },
};

export default nextConfig;
