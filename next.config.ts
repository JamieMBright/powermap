import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone', // Required for Docker deployment
  images: {
    unoptimized: true // For static export compatibility
  }
};

export default nextConfig;
