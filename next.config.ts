import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push(
        // @ts-ignore
        'puppeteer-core',
        '@sparticuz/chromium',
      );
    }
    return config;
  },
};

export default nextConfig;
