import type { NextConfig } from 'next';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '/adminka';

const nextConfig: NextConfig = {
  basePath: basePath,
  assetPrefix: basePath,
  trailingSlash: true,
  output: 'standalone',
};

export default nextConfig;
