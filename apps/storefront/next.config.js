const checkEnvVariables = require("./check-env-variables")

checkEnvVariables()

/**
 * Medusa Cloud-related environment variables
 */
const S3_HOSTNAME = process.env.MEDUSA_CLOUD_S3_HOSTNAME
const S3_PATHNAME = process.env.MEDUSA_CLOUD_S3_PATHNAME

/**
 * Supabase Storage (S3-compatible) hostname, used by admin-uploaded page
 * content images (Hero/GiftBanner/Instagram). E.g. "xyzcompany.supabase.co".
 */
const SUPABASE_S3_HOSTNAME = process.env.NEXT_PUBLIC_SUPABASE_S3_HOSTNAME

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  reactStrictMode: true,
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "https",
        hostname: "*.s3.*.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "*.s3.amazonaws.com",
      },
      ...(S3_HOSTNAME && S3_PATHNAME
        ? [
            {
              protocol: "https",
              hostname: S3_HOSTNAME,
              pathname: S3_PATHNAME,
            },
          ]
        : []),
      ...(SUPABASE_S3_HOSTNAME
        ? [
            {
              protocol: "https",
              hostname: SUPABASE_S3_HOSTNAME,
            },
          ]
        : []),
    ],
  },
}

module.exports = nextConfig