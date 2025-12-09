/**
 * @file page.tsx
 * @description 검색 페이지
 *
 * Instagram 스타일의 검색 페이지
 * - 현재는 준비 중 상태 (1차 MVP 제외 기능)
 * - 향후 사용자 검색, 해시태그 검색 기능 추가 예정
 */

export default function SearchPage() {
  return (
    <div className="w-full max-w-[630px] mx-auto px-4 py-8">
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h1 className="text-2xl md:text-3xl font-semibold text-[#262626] mb-4">
          검색
        </h1>
        <p className="text-[#8e8e8e] text-center mb-8">
          검색 기능은 현재 준비 중입니다.
        </p>
        <p className="text-sm text-[#8e8e8e] text-center">
          향후 사용자 검색 및 해시태그 검색 기능이 추가될 예정입니다.
        </p>
      </div>
    </div>
  );
}

