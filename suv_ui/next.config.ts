import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Set base path for serving under /suv route
  basePath: '/suv',
  // Enable asset prefix to load static files correctly
  assetPrefix: '/suv',
  // Output standalone for optimal Docker deployment
  output: 'standalone',
};

export default nextConfig;
