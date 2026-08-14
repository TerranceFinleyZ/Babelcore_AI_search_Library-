import type { NextConfig } from "next";
import { execSync } from "child_process";

// Pin the build ID to the current git commit so action IDs are stable across
// server restarts of the same deployment.
function getBuildId(): string {
  try {
    return execSync("git rev-parse --short HEAD").toString().trim();
  } catch {
    return Date.now().toString(36);
  }
}

const nextConfig: NextConfig = {
  generateBuildId: getBuildId,
  serverExternalPackages: ["oracledb", "ffmpeg-static", "fluent-ffmpeg", "pdf-parse"],
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
