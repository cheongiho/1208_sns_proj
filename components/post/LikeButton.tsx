"use client";

/**
 * @file LikeButton.tsx
 * @description 좋아요 버튼 컴포넌트
 *
 * Instagram 스타일의 좋아요 버튼
 * - 빈 하트 ↔ 빨간 하트 상태 관리
 * - 클릭 애니메이션: scale(1.3) → scale(1) (0.15초)
 * - Optimistic UI 업데이트
 * - API 호출: POST /api/likes 또는 DELETE /api/likes
 */

import { useState } from "react";
import { Heart } from "lucide-react";

interface LikeButtonProps {
  postId: string;
  initialLiked: boolean;
  initialLikesCount: number;
  onLikeChange?: (liked: boolean, newCount: number) => void;
}

export default function LikeButton({
  postId,
  initialLiked,
  initialLikesCount,
  onLikeChange,
}: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(initialLiked);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    // 애니메이션 중이거나 로딩 중이면 무시
    if (isAnimating || isLoading) return;

    // Optimistic UI 업데이트
    const newLiked = !isLiked;
    const newCount = newLiked ? likesCount + 1 : likesCount - 1;

    setIsLiked(newLiked);
    setLikesCount(newCount);
    setIsAnimating(true);
    setIsLoading(true);

    // 애니메이션 효과 (0.15초)
    setTimeout(() => {
      setIsAnimating(false);
    }, 150);

    try {
      // API 호출
      const response = await fetch("/api/likes", {
        method: newLiked ? "POST" : "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ postId }),
      });

      if (!response.ok) {
        // 에러 발생 시 롤백
        setIsLiked(!newLiked);
        setLikesCount(likesCount);
        throw new Error(`Failed to ${newLiked ? "add" : "remove"} like`);
      }

      // 성공 시 콜백 호출
      if (onLikeChange) {
        onLikeChange(newLiked, newCount);
      }
    } catch (error) {
      console.error("Like error:", error);
      // 에러는 이미 롤백됨
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`
        min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0
        flex items-center justify-center
        hover:opacity-70 active:opacity-50 active:scale-95
        transition-all duration-150 ease-out
        touch-manipulation
        ${isAnimating ? "scale-125" : "scale-100"}
        ${isLoading ? "opacity-50 cursor-wait" : "cursor-pointer"}
      `}
      aria-label={isLiked ? "좋아요 취소" : "좋아요"}
      disabled={isLoading}
    >
      <Heart
        className={`w-6 h-6 transition-all duration-150 ${
          isLiked
            ? "fill-[#ed4956] text-[#ed4956]"
            : "text-[#262626]"
        }`}
      />
    </button>
  );
}


