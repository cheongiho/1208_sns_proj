import { MetadataRoute } from "next";

/**
 * @file robots.ts
 * @description 검색 엔진 크롤링 규칙 설정
 *
 * robots.txt 파일을 동적으로 생성합니다.
 * 검색 엔진이 사이트를 크롤링할 때 따라야 할 규칙을 정의합니다.
 */

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/", // API 라우트는 크롤링 제외
        "/auth-test/", // 테스트 페이지 제외
        "/storage-test/", // 테스트 페이지 제외
      ],
    },
    sitemap: process.env.NEXT_PUBLIC_SITE_URL
      ? `${process.env.NEXT_PUBLIC_SITE_URL}/sitemap.xml`
      : undefined,
  };
}

