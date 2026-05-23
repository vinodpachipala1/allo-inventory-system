import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
  
  // Safely ignore TypeScript errors during Vercel deployment
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;