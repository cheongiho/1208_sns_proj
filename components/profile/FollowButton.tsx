"use client";

/**
 * @file FollowButton.tsx
 * @description 팔로우 버튼 컴포넌트
 *
 * Instagram 스타일의 팔로우 버튼
 * - "팔로우" 버튼 (파란색, 미팔로우 상태)
 * - "팔로잉" 버튼 (회색, 팔로우 중 상태)
 * - Hover 시 "언팔로우" (빨간 테두리)
 * - Optimistic UI 업데이트
 * - API 호출: POST /api/follows 또는 DELETE /api/follows
 */

import React, { useState } from "react";
import { getUserFriendlyMessage, extractErrorMessage, isNetworkError } from "@/lib/utils/error-handler";

interface FollowButtonProps {
  userId: string; // 팔로우할 사용자의 Supabase user_id
  initialFollowing: boolean;
  onFollowChange?: (following: boolean, countDelta: number) => void;
}

function FollowButton({
  userId,
  initialFollowing,
  onFollowChange,
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialFollowing);
  const [isLoading, setIsLoading] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  const handleClick = async () => {
    // 로딩 중이면 무시
    if (isLoading) return;

    // Optimistic UI 업데이트
    const newFollowing = !isFollowing;
    setIsFollowing(newFollowing);
    setIsLoading(true);

    try {
      // API 호출
      const response = await fetch("/api/follows", {
        method: newFollowing ? "POST" : "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ followingId: userId }),
      });

      if (!response.ok) {
        // 에러 발생 시 롤백
        setIsFollowing(!newFollowing);
        const errorMessage = await extractErrorMessage(response);
        throw new Error(errorMessage);
      }

      // 성공 시 콜백 호출 (통계 업데이트)
      if (onFollowChange) {
        // 팔로우 추가 시 +1, 제거 시 -1
        onFollowChange(newFollowing, newFollowing ? 1 : -1);
      }
    } catch (error) {
      console.error("Follow error:", error);
      // 네트워크 에러인 경우 콘솔에만 로그 (사용자에게는 Optimistic UI가 이미 롤백됨)
      if (isNetworkError(error)) {
        console.warn("Network error during follow operation:", getUserFriendlyMessage(error));
      }
      // 에러는 이미 롤백됨
    } finally {
      setIsLoading(false);
    }
  };

  // 팔로우 중 상태에서 Hover 시 "언팔로우" 표시
  const buttonText = isFollowing
    ? isHovering
      ? "언팔로우"
      : "팔로잉"
    : "팔로우";

  // 버튼 스타일
  const buttonClassName = isFollowing
    ? `px-4 py-1.5 text-sm font-semibold rounded-lg transition-all ${
        isHovering
          ? "bg-white text-[#ed4956] border border-[#ed4956]"
          : "bg-[#efefef] text-[#262626] border border-[#dbdbdb]"
      } hover:bg-[#dbdbdb]`
    : "px-4 py-1.5 text-sm font-semibold rounded-lg bg-[#0095f6] text-white hover:bg-[#0095f6]/90 transition-colors";

  return (
    <button
      onClick={handleClick}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      className={`
        ${buttonClassName}
        min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0
        flex items-center justify-center
        active:scale-95
        transition-all duration-150 ease-out
        touch-manipulation
        focus:outline-none focus:ring-2 focus:ring-[#0095f6] focus:ring-offset-2 rounded-lg
        ${isLoading ? "opacity-50 cursor-wait" : "cursor-pointer"}
      `}
      aria-label={isFollowing ? "언팔로우" : "팔로우"}
      aria-pressed={isFollowing}
      aria-busy={isLoading}
      disabled={isLoading}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {isLoading ? "처리 중..." : buttonText}
    </button>
  );
}

// React.memo로 감싸서 props가 변경되지 않으면 리렌더링 방지
export default React.memo(FollowButton, (prevProps, nextProps) => {
  return (
    prevProps.userId === nextProps.userId &&
    prevProps.initialFollowing === nextProps.initialFollowing
  );
});

