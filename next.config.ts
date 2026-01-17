import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lospueblosmasbonitosdeespana.org',
      },
      {
        protocol: 'https',
        hostname: 'pre.lospueblosmasbonitosdeespana.org',
      },
    ],
  },
};

export default nextConfig;
