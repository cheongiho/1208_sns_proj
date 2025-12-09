"use client";

import Link from "next/link";

/**
 * @file not-found.tsx
 * @description 404 페이지
 *
 * 존재하지 않는 페이지에 접근했을 때 표시되는 페이지입니다.
 * 사용자 친화적인 메시지와 홈으로 돌아가기 링크를 제공합니다.
 */

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 bg-[#fafafa]">
      <div className="text-center max-w-md">
        <h1 className="text-6xl md:text-8xl font-bold text-[#262626] mb-4">
          404
        </h1>
        <h2 className="text-2xl md:text-3xl font-semibold text-[#262626] mb-4">
          페이지를 찾을 수 없습니다
        </h2>
        <p className="text-[#8e8e8e] mb-8 text-base md:text-lg">
          요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="px-6 py-3 bg-[#0095f6] text-white rounded-lg hover:bg-[#0095f6]/90 transition-colors font-semibold min-h-[44px] flex items-center justify-center touch-manipulation"
          >
            홈으로 돌아가기
          </Link>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-3 bg-gray-200 text-[#262626] rounded-lg hover:bg-gray-300 transition-colors font-semibold min-h-[44px] flex items-center justify-center touch-manipulation"
          >
            이전 페이지
          </button>
        </div>
      </div>
    </div>
  );
}

