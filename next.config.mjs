import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const isDevelopment = process.env.NODE_ENV === 'development'

const cspValue = isDevelopment
  ? "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; connect-src 'self' https:; font-src 'self' data:;"
  : "default-src 'self'; script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; connect-src 'self' https: https://breakout.wenwen-ai.com; font-src 'self' data:;"

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // 禁用 source map 生成
  productionBrowserSourceMaps: false,
  devIndicators: {
    autoPrune: true,
  },
  turbopack: {
    root: __dirname,
  },
  // 配置 webpack 以忽略 source map 错误（如果使用 webpack 构建）
  webpack: (config) => {
    // 禁用 webpack source map 生成
    config.devtool = false;
    config.ignoreWarnings = [
      {
        message: /Invalid source map/,
      },
      {
        message: /sourceMapURL could not be parsed/,
      },
    ];
    return config;
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: cspValue,
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ]
  },
}

export default nextConfig
