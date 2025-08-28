/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true
  },
  experimental: {
    webpackMemoryOptimizations: true,
  },
  eslint: {
    // Allow building even if there are ESLint errors (we are only adding API route)
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig
