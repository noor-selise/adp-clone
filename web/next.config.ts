import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  allowedDevOrigins: [process.env.NEXT_PUBLIC_BLOCKS_DEV_HOST ?? 'dpkhbr.slsblx.com'],
}

export default nextConfig
