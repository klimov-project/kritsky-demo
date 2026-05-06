import type { NextConfig } from 'next';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '/adminka';

const nextConfig: NextConfig = {
  basePath: '/adminka',
  // assetPrefix: '/adminka',
  trailingSlash: true,
};

export default nextConfig;
