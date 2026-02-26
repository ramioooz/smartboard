// @ts-check

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  transpilePackages: ['@smartboard/shared', '@smartboard/ui'],
  experimental: {
    typedRoutes: true,
  },
};

export default nextConfig;
