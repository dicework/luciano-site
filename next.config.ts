import type { NextConfig } from 'next';
const nextConfig: NextConfig = {
  experimental: { globalNotFound: true },
  trailingSlash: true,
  images: { unoptimized: true },
  devIndicators: false,
};
export default nextConfig;
