import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Output standalone for optimal Docker deployment
  output: 'standalone',
  // Base path for ALB path-based routing
  basePath: '/suv',
  // Ensure trailing slashes are handled consistently
  trailingSlash: false,
};

export default nextConfig;
