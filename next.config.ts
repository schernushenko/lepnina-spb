import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    proxy: './app/proxy.ts'
  }
};

export default nextConfig;
