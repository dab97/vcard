import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  serverExternalPackages: ["@sparticuz/chromium", "puppeteer-core"],
  output: 'standalone', // Добавляем для оптимизации развертывания на Vercel
};

export default nextConfig;
