"use client";

/**
 * @file ProfileHeader.tsx
 * @description 프로필 페이지 헤더 컴포넌트
 *
 * Instagram 스타일의 프로필 헤더 UI
 * - 프로필 이미지 (150px Desktop / 90px Mobile)
 * - 사용자명
 * - 통계 (게시물 수, 팔로워 수, 팔로잉 수)
 * - "팔로우" / "팔로잉" 버튼 (다른 사람 프로필)
 * - 반응형 레이아웃
 */

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import type { UserWithStats } from "@/lib/types";
import { formatNumber } from "@/lib/utils/format-number";
import FollowButton from "./FollowButton";

interface ProfileHeaderProps {
  user: UserWithStats & { isFollowing?: boolean };
  isOwnProfile: boolean;
}

export default function ProfileHeader({ user, isOwnProfile }: ProfileHeaderProps) {
  const { user: currentUser } = useUser();
  
  // 팔로우 상태 관리
  const [isFollowing, setIsFollowing] = useState(user.isFollowing || false);
  // 팔로워 수 상태 관리
  const [followersCount, setFollowersCount] = useState(user.followers_count);

  // 통계 클릭 핸들러 (향후 모달 열기)
  const handleStatsClick = (type: "posts" | "followers" | "following") => {
    // TODO: 향후 팔로워/팔로잉 목록 모달 열기
    console.log(`Show ${type} list`);
  };

  // 팔로우 상태 변경 핸들러
  const handleFollowChange = (following: boolean, countDelta: number) => {
    setIsFollowing(following);
    setFollowersCount((prev) => {
      const newCount = prev + countDelta;
      return newCount >= 0 ? newCount : 0; // 음수 방지
    });
  };

  return (
    <div className="px-4 py-6 md:px-8 md:py-8">
      {/* Desktop: 가로 배치 */}
      <div className="hidden md:flex items-start gap-8">
        {/* 프로필 이미지 */}
        <div className="flex-shrink-0">
          <div className="w-[150px] h-[150px] rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
            {/* 추후 Clerk 프로필 이미지 또는 기본 아바타 */}
            <span className="text-4xl font-semibold text-gray-600">
              {user.name.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>

        {/* 사용자 정보 */}
        <div className="flex-1 min-w-0">
          {/* 사용자명 및 액션 버튼 */}
          <div className="flex items-center gap-4 mb-4">
            <h1 className="text-2xl font-light text-[#262626]">{user.name}</h1>
            {isOwnProfile ? (
              <button className="px-4 py-1.5 text-sm font-semibold text-[#262626] border border-[#dbdbdb] rounded-lg hover:bg-gray-50 transition-colors">
                프로필 편집
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <FollowButton
                  userId={user.id}
                  initialFollowing={isFollowing}
                  onFollowChange={handleFollowChange}
                />
                <button className="px-4 py-1.5 text-sm font-semibold text-[#262626] border border-[#dbdbdb] rounded-lg hover:bg-gray-50 transition-colors">
                  메시지
                </button>
              </div>
            )}
          </div>

          {/* 통계 */}
          <div className="flex items-center gap-8 mb-4">
            <button
              onClick={() => handleStatsClick("posts")}
              className="text-[#262626] hover:opacity-50 transition-opacity"
            >
              <span className="font-semibold">{formatNumber(user.posts_count)}</span>
              <span className="ml-1">게시물</span>
            </button>
            <button
              onClick={() => handleStatsClick("followers")}
              className="text-[#262626] hover:opacity-50 transition-opacity"
            >
              <span className="font-semibold">{formatNumber(followersCount)}</span>
              <span className="ml-1">팔로워</span>
            </button>
            <button
              onClick={() => handleStatsClick("following")}
              className="text-[#262626] hover:opacity-50 transition-opacity"
            >
              <span className="font-semibold">{formatNumber(user.following_count)}</span>
              <span className="ml-1">팔로잉</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile: 세로 배치 */}
      <div className="md:hidden">
        {/* 프로필 이미지 및 사용자명 */}
        <div className="flex flex-col items-center mb-4">
          <div className="w-[90px] h-[90px] rounded-full bg-gray-200 flex items-center justify-center overflow-hidden mb-4">
            <span className="text-2xl font-semibold text-gray-600">
              {user.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <h1 className="text-lg font-light text-[#262626] mb-4">{user.name}</h1>

          {/* 액션 버튼 */}
          {isOwnProfile ? (
            <button className="w-full px-4 py-1.5 text-sm font-semibold text-[#262626] border border-[#dbdbdb] rounded-lg hover:bg-gray-50 transition-colors mb-4">
              프로필 편집
            </button>
          ) : (
            <div className="flex items-center gap-2 w-full mb-4">
              <div className="flex-1">
                <FollowButton
                  userId={user.id}
                  initialFollowing={isFollowing}
                  onFollowChange={handleFollowChange}
                />
              </div>
              <button className="flex-1 px-4 py-1.5 text-sm font-semibold text-[#262626] border border-[#dbdbdb] rounded-lg hover:bg-gray-50 transition-colors">
                메시지
              </button>
            </div>
          )}
        </div>

        {/* 통계 */}
        <div className="flex items-center justify-around border-t border-[#dbdbdb] pt-4">
          <button
            onClick={() => handleStatsClick("posts")}
            className="flex flex-col items-center hover:opacity-50 transition-opacity"
          >
            <span className="text-lg font-semibold text-[#262626]">
              {formatNumber(user.posts_count)}
            </span>
            <span className="text-xs text-[#8e8e8e]">게시물</span>
          </button>
          <button
            onClick={() => handleStatsClick("followers")}
            className="flex flex-col items-center hover:opacity-50 transition-opacity"
          >
            <span className="text-lg font-semibold text-[#262626]">
              {formatNumber(followersCount)}
            </span>
            <span className="text-xs text-[#8e8e8e]">팔로워</span>
          </button>
          <button
            onClick={() => handleStatsClick("following")}
            className="flex flex-col items-center hover:opacity-50 transition-opacity"
          >
            <span className="text-lg font-semibold text-[#262626]">
              {formatNumber(user.following_count)}
            </span>
            <span className="text-xs text-[#8e8e8e]">팔로잉</span>
          </button>
        </div>
      </div>
    </div>
  );
}

