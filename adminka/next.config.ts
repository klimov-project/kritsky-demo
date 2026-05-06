import type { NextConfig } from 'next';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '/adminka';

const nextConfig: NextConfig = {
  basePath: basePath,
  assetPrefix: basePath,
  trailingSlash: true,
  skipTrailingSlashRedirect: true,

  // Важно для Next.js 16+
  output: 'standalone', // если используете Docker

  // Явно указать пути к статике
  distDir: '.next',

  // Для правильной работы с прокси
  allowedDevOrigins: ['62.113.99.250', 'localhost'],
};

export default nextConfig;
