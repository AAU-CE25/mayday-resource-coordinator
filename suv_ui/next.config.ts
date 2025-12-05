import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Output standalone for optimal Docker deployment
  output: 'standalone',
};

export default nextConfig;
