import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Set base path for serving under /dashboard route
  basePath: '/dashboard',
  // Enable asset prefix to load static files correctly
  assetPrefix: '/dashboard',
};

export default nextConfig;