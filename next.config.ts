import type { NextConfig } from 'next'
import { securityHeaders } from './lib/security'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async headers() {
    return [{ source: '/(.*)', headers: Object.entries(securityHeaders()).map(([key, value]) => ({ key, value })) }]
  },
}
export default nextConfig
