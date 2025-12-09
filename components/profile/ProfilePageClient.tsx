"use client";

/**
 * @file ProfilePageClient.tsx
 * @description 프로필 페이지 클라이언트 컴포넌트
 *
 * PostGrid와 PostModal 상태 관리를 위한 클라이언트 컴포넌트
 * Server Component에서 데이터를 받아서 클라이언트 컴포넌트로 전달
 */

import { useState, useCallback } from "react";
import PostGrid from "./PostGrid";
import PostModal from "@/components/post/PostModal";
import type { PostWithUserAndStats } from "@/lib/types";

interface ProfilePageClientProps {
  posts: PostWithUserAndStats[];
}

export default function ProfilePageClient({ posts }: ProfilePageClientProps) {
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 게시물 클릭 핸들러
  const handlePostClick = useCallback((postId: string) => {
    setSelectedPostId(postId);
    setIsModalOpen(true);
  }, []);

  // 모달 닫기 핸들러
  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    setSelectedPostId(null);
  }, []);

  // 게시물 ID 변경 핸들러 (이전/다음 네비게이션)
  const handlePostIdChange = useCallback((newPostId: string) => {
    setSelectedPostId(newPostId);
  }, []);

  return (
    <>
      <PostGrid posts={posts} onPostClick={handlePostClick} />

      {/* PostModal */}
      {selectedPostId && (
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

