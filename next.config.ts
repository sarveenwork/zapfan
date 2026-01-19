import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure proper error handling in production
  reactStrictMode: true,
  // Optimize for production
  swcMinify: true,
};

export default nextConfig;
