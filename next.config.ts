import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { hostname: "img.clerk.com" },
      // Supabase Storage 도메인
      { hostname: "*.supabase.co" },
      { hostname: "*.supabase.in" },
    ],
    // 이미지 최적화 설정
    formats: ["image/webp", "image/avif"],
    // 이미지 품질 (기본값: 75)
    minimumCacheTTL: 60,
    // 디바이스 사이즈별 최적화
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  // 테스트 페이지를 빌드에서 제외
  async generateBuildId() {
    return process.env.BUILD_ID || "build";
  },
};

export default nextConfig;
