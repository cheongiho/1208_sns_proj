import { MetadataRoute } from "next";

/**
 * @file manifest.ts
 * @description PWA 매니페스트
 *
 * Progressive Web App (PWA) 매니페스트를 생성합니다.
 * 모바일에서 홈 화면에 추가할 수 있도록 설정합니다.
 */

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mini Instagram",
    short_name: "Mini IG",
    description: "Instagram 스타일의 소셜 네트워크 서비스",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0095f6",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
      // 추가 아이콘은 public/icons/ 디렉토리에 추가 후 여기에 포함
    ],
  };
}

