import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  basePath: '/admin',
  trailingSlash: true,
  // Игнорировать автоматические редиректы
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
