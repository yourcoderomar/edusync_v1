import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'aqgqiipiposiuiulnjcl.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  // Increase body size limit for file uploads (5MB)
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb',
    },
  },
};

export default nextConfig;
