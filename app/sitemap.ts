import { MetadataRoute } from "next";

/**
 * @file sitemap.ts
 * @description 사이트맵 생성
 *
 * 검색 엔진이 사이트의 모든 페이지를 찾을 수 있도록 사이트맵을 동적으로 생성합니다.
 * 동적 경로(프로필, 게시물 등)는 필요에 따라 추가할 수 있습니다.
 */

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://yourdomain.com";

  // 정적 페이지
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
  ];

  // 동적 페이지는 필요 시 추가
  // 예: 프로필 페이지, 게시물 페이지 등
  // 현재는 정적 페이지만 포함

  return staticPages;
}

