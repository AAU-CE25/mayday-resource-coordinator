import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Output standalone for optimal Docker deployment
  output: 'standalone',
  // Base path for ALB path-based routing
  basePath: '/suv',
  // Ensure trailing slashes are handled consistently
  trailingSlash: false,
  // Remove console logs in production builds
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'], // Keep error and warn logs
    } : false,
  },
};

export default nextConfig;
