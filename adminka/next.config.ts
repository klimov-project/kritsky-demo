import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '/adminka',
  assetPrefix: process.env.NEXT_PUBLIC_BASE_PATH || '/adminka',
  trailingSlash: true,

  // Важно для Next.js 16
  output: 'standalone', // если используете Docker

  // Настройки для статических файлов
  distDir: '.next',

  // Экспериментальные настройки (если нужно)
  experimental: {
    // optimizeCss: true, // если используете CSS оптимизацию
  },
};

export default nextConfig;
