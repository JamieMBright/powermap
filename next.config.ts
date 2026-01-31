import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone', // Required for Docker deployment
  images: {
    unoptimized: true // For static export compatibility
  },
  // Security headers - allow MapLibre GL JS to work
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // Allow MapLibre GL JS (needs unsafe-eval for WebGL shaders)
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              // Allow styles from self and inline (for MapLibre)
              "style-src 'self' 'unsafe-inline'",
              // Allow images and data from map tile providers
              "img-src 'self' data: blob: https://*.cartocdn.com https://*.openstreetmap.org https://*.openfreemap.org https://tiles.stadiamaps.com",
              // Allow WebGL workers
              "worker-src 'self' blob:",
              // Allow connections to tile servers and APIs
              "connect-src 'self' https://*.cartocdn.com https://*.openstreetmap.org https://*.openfreemap.org https://tiles.stadiamaps.com https://api.os.uk https://opendataportal.ukpowernetworks.co.uk https://openinframap.org",
              // Allow fonts
              "font-src 'self' data:",
              // Allow child/frame sources
              "child-src 'self' blob:",
            ].join('; ')
          }
        ]
      }
    ];
  }
};

export default nextConfig;
