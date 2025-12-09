/**
 * @file PostCardSkeleton.tsx
 * @description 게시물 카드 로딩 UI (Skeleton)
 *
 * Shimmer 효과가 포함된 Skeleton UI
 */

import { Skeleton } from "@/components/ui/skeleton";

export default function PostCardSkeleton() {
  return (
    <div className="bg-white border-b border-[#dbdbdb]">
      {/* 헤더 Skeleton */}
      <div className="flex items-center gap-3 px-4 py-3 h-[60px]">
        <Skeleton className="w-8 h-8 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="w-6 h-6" />
      </div>

      {/* 이미지 Skeleton (정사각형) */}
      <div className="w-full aspect-square">
        <Skeleton className="w-full h-full" />
      </div>

      {/* 액션 버튼 Skeleton */}
      <div className="flex items-center justify-between px-4 py-3 h-[48px]">
        <div className="flex items-center gap-4">
          <Skeleton className="w-6 h-6" />
          <Skeleton className="w-6 h-6" />
          <Skeleton className="w-6 h-6" />
        </div>
        <Skeleton className="w-6 h-6" />
      </div>

      {/* 좋아요 수 및 텍스트 Skeleton */}
      <div className="px-4 pb-2 space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>

      {/* 댓글 미리보기 Skeleton */}
      <div className="px-4 pb-4 space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </div>
  );
}


