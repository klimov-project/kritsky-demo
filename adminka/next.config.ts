import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '/adminka',
  assetPrefix: process.env.NEXT_PUBLIC_BASE_PATH || '/adminka',
  trailingSlash: true,
  // Игнорировать автоматические редиректы
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
