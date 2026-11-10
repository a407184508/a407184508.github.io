import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
  transpilePackages: ['@blog/core', '@blog/config', '@blog/markdown', '@blog/publish', '@blog/ui'],
  eslint: { ignoreDuringBuilds: true },
}

export default nextConfig
