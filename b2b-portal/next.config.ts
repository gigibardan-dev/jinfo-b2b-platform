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
       {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
};



export default nextConfig;