import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  
  // Aumentar límite de body para subida de imágenes grandes
  experimental: {
    serverActions: {
      bodySizeLimit: '25mb',
    },
  },
  
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lospueblosmasbonitosdeespana.org',
      },
      {
        protocol: 'https',
        hostname: 'pre.lospueblosmasbonitosdeespana.org',
      },
      {
        protocol: 'https',
        hostname: 'media.lospueblosmasbonitosdeespana.org',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
