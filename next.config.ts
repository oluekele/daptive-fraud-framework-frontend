import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Reduce memory usage during build
  experimental: {
    workerThreads: false,
    cpus: 1,
  },
  // Disable source maps to reduce memory
  productionBrowserSourceMaps: false,
};

export default nextConfig;
