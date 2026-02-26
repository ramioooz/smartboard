import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@smartboard/shared', '@smartboard/ui'],
  experimental: {
    typedRoutes: true,
  },
};

export default nextConfig;
