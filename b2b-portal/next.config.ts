import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'ibe.jinfotours.ro',
        pathname: '/resources/**',
      },
      {
        protocol: 'https',
        hostname: 'ibe.jinfotours.ro',
        pathname: '/resources/**',
      },
      {
        protocol: 'https',
        hostname: 'ibe2.jinfotours.ro',
      },
    ],
  },
};

export default nextConfig;