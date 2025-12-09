"use client";

/**
 * @file PostGrid.tsx
 * @description 프로필 페이지 게시물 그리드 컴포넌트
 *
 * Instagram 스타일의 게시물 그리드 UI
 * - 3열 그리드 레이아웃 (반응형)
 * - 1:1 정사각형 썸네일
 * - Hover 시 좋아요/댓글 수 표시
 * - 클릭 시 게시물 상세 모달 열기
 */

import { useState } from "react";
import { Heart, MessageCircle } from "lucide-react";
import Image from "next/image";
import type { PostWithUserAndStats } from "@/lib/types";
import { formatNumber } from "@/lib/utils/format-number";
import PostModal from "@/components/post/PostModal";

interface PostGridProps {
  posts: PostWithUserAndStats[];
  onPostClick?: (postId: string) => void; // 선택적 (PostModal을 내부에서 관리하는 경우)
}

export default function PostGrid({ posts, onPostClick }: PostGridProps) {
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 게시물 클릭 핸들러
  const handlePostClick = (postId: string) => {
    if (onPostClick) {
      // 외부에서 PostModal을 관리하는 경우
      onPostClick(postId);
    } else {
      // 내부에서 PostModal을 관리하는 경우
      setSelectedPostId(postId);
      setIsModalOpen(true);
    }
  };

  // 모달 닫기 핸들러
  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedPostId(null);
  };

  // 게시물 ID 변경 핸들러 (이전/다음 네비게이션)
  const handlePostIdChange = (newPostId: string) => {
    setSelectedPostId(newPostId);
  };

  // 빈 상태
  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-16 h-16 rounded-full border-2 border-[#dbdbdb] flex items-center justify-center mb-4">
          <svg
            className="w-8 h-8 text-[#8e8e8e]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <p className="text-xl font-semibold text-[#262626] mb-2">게시물이 없습니다</p>
        <p className="text-sm text-[#8e8e8e]">첫 게시물을 공유해보세요!</p>
      </div>
    );
  }

  return (
    <>
      {/* 탭 메뉴 (1차는 게시물만) */}
      <div className="flex items-center justify-center border-t border-[#dbdbdb]">
        <button className="flex items-center gap-1 px-8 py-4 border-t-2 border-[#262626] text-sm font-semibold text-[#262626]">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span>게시물</span>
        </button>
      </div>

      {/* 게시물 그리드 */}
      <div className="grid grid-cols-3 gap-[2px]">
        {posts.map((post) => (
          <div
            key={post.id}
            className="relative aspect-square bg-gray-100 cursor-pointer group"
            onClick={() => handlePostClick(post.id)}
          >
            <Image
              src={post.image_url}
              alt={post.caption || "게시물 이미지"}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 33vw, 33vw"
              loading="lazy"
            />

            {/* Hover 오버레이 */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-6">
              <div className="flex items-center gap-1 text-white font-semibold">
                <Heart className="w-5 h-5 fill-white" />
                <span>{formatNumber(post.likes_count)}</span>
              </div>
              <div className="flex items-center gap-1 text-white font-semibold">
                <MessageCircle className="w-5 h-5 fill-white" />
                <span>{formatNumber(post.comments_count)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* PostModal (내부에서 관리하는 경우) */}
      {!onPostClick && selectedPostId && (
        <PostModal
          postId={selectedPostId}
          isOpen={isModalOpen}
          onClose={handleModalClose}
          posts={posts}
          onPostIdChange={handlePostIdChange}
        />
      )}
    </>
  );
}

