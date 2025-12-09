import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { hostname: "img.clerk.com" },
      // Supabase Storage 도메인
      { hostname: "*.supabase.co" },
      { hostname: "*.supabase.in" },
    ],
  },
};

export default nextConfig;
