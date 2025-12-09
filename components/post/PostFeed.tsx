"use client";

/**
 * @file PostFeed.tsx
 * @description 게시물 피드 컴포넌트
 *
 * 특징:
 * - 게시물 목록 렌더링
 * - 무한 스크롤 (Intersection Observer)
 * - 페이지네이션 (10개씩)
 * - 로딩/에러/빈 상태 처리
 */

import { useEffect, useState, useRef, useCallback } from "react";
import PostCard from "./PostCard";
import PostCardSkeleton from "./PostCardSkeleton";
import PostModal from "./PostModal";
import { getUserFriendlyMessage, extractErrorMessage, isNetworkError } from "@/lib/utils/error-handler";
import type { PostWithUserAndStats, CommentWithUser, PaginatedResponse } from "@/lib/types";

interface PostFeedProps {
  userId?: string; // 프로필 페이지용
  onPostDeleted?: (postId: string) => void; // 외부에서 삭제 이벤트를 처리할 수 있도록
}

export default function PostFeed({ userId, onPostDeleted: externalOnPostDeleted }: PostFeedProps) {
  const [posts, setPosts] = useState<PostWithUserAndStats[]>([]);
  const [commentsMap, setCommentsMap] = useState<Map<string, CommentWithUser[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const LIMIT = 10;

  // 게시물 목록 조회
  const fetchPosts = useCallback(
    async (currentOffset: number, append: boolean = false) => {
      try {
        if (currentOffset === 0) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }
        setError(null);

        const params = new URLSearchParams({
          limit: LIMIT.toString(),
          offset: currentOffset.toString(),
        });

        if (userId) {
          params.append("userId", userId);
        }

        const response = await fetch(`/api/posts?${params.toString()}`);
        if (!response.ok) {
          const errorMessage = await extractErrorMessage(response);
          throw new Error(errorMessage);
        }

        const data: PaginatedResponse<PostWithUserAndStats> = await response.json();

        if (append) {
          setPosts((prev) => [...prev, ...data.data]);
        } else {
          setPosts(data.data);
        }

        setHasMore(data.hasMore);
        setOffset(currentOffset + data.data.length);

        // 각 게시물의 최신 댓글 2개 조회
        const commentsPromises = data.data.map(async (post) => {
          try {
            const commentsResponse = await fetch(
              `/api/comments?postId=${post.id}&limit=2`
            );
            if (commentsResponse.ok) {
              const commentsData = await commentsResponse.json();
              return { postId: post.id, comments: commentsData.data || [] };
            }
          } catch (err) {
            console.error(`Failed to fetch comments for post ${post.id}:`, err);
          }
          return { postId: post.id, comments: [] };
        });

        const commentsResults = await Promise.all(commentsPromises);
        setCommentsMap((prevMap) => {
          const newCommentsMap = new Map(prevMap);
          commentsResults.forEach(({ postId, comments }) => {
            newCommentsMap.set(postId, comments);
          });
          return newCommentsMap;
        });
      } catch (err) {
        console.error("Error fetching posts:", err);
        const errorMessage = getUserFriendlyMessage(err);
        // 네트워크 에러인 경우 특별한 메시지 표시
        if (isNetworkError(err)) {
          setError("네트워크 연결을 확인해주세요. 잠시 후 다시 시도해주세요.");
        } else {
          setError(errorMessage);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [userId]
  );

  // 초기 로드
  useEffect(() => {
    fetchPosts(0, false);
  }, [userId]); // userId가 변경되면 다시 로드

  // Intersection Observer 설정
  useEffect(() => {
    if (!hasMore || loading || loadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          fetchPosts(offset, true);
        }
      },
      {
        threshold: 0.1,
      }
    );

    const sentinel = sentinelRef.current;
    if (sentinel) {
      observer.observe(sentinel);
    }

    return () => {
      if (sentinel) {
        observer.unobserve(sentinel);
      }
    };
  }, [hasMore, loading, loadingMore, offset, fetchPosts]);

  // 게시물 삭제 핸들러
  const handlePostDeleted = useCallback((postId: string) => {
    setPosts((prev) => prev.filter((post) => post.id !== postId));
    // 댓글 맵에서도 제거
    setCommentsMap((prevMap) => {
      const newMap = new Map(prevMap);
      newMap.delete(postId);
      return newMap;
    });
    // 모달이 열려있고 삭제된 게시물이면 모달 닫기
    if (selectedPostId === postId) {
      setIsModalOpen(false);
      setSelectedPostId(null);
    }
    // 외부 콜백 호출 (필요한 경우)
    if (externalOnPostDeleted) {
      externalOnPostDeleted(postId);
    }
  }, [externalOnPostDeleted, selectedPostId]);

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

  // 로딩 상태
  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <PostCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <p className="text-[#8e8e8e] mb-4">{error}</p>
        <button
          onClick={() => fetchPosts(0, false)}
          className="px-4 py-2 bg-[#0095f6] text-white rounded-lg hover:bg-[#0095f6]/90 transition-colors"
        >
          다시 시도
        </button>
      </div>
    );
  }

  // 빈 상태
  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <p className="text-[#8e8e8e] text-center mb-4">
          {userId ? "게시물이 없습니다" : "아직 게시물이 없습니다"}
        </p>
        {!userId && (
          <p className="text-sm text-[#8e8e8e] text-center">
            첫 게시물을 작성해보세요!
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post, index) => (
        <div
          key={post.id}
          className="animate-fade-in"
          style={{
            animationDelay: `${Math.min(index * 50, 300)}ms`,
          }}
        >
          <PostCard
            post={post}
            comments={commentsMap.get(post.id) || []}
            onPostDeleted={handlePostDeleted}
            onDeleteError={() => fetchPosts(0, false)}
            onPostClick={handlePostClick}
          />
        </div>
      ))}

      {/* 무한 스크롤 감지 요소 */}
      {hasMore && (
        <div ref={sentinelRef} className="py-4">
          {loadingMore && (
            <div className="space-y-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <PostCardSkeleton key={i} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* 더 이상 게시물이 없을 때 */}
      {!hasMore && posts.length > 0 && (
        <div className="text-center py-8 text-[#8e8e8e] text-sm">
          모든 게시물을 불러왔습니다
        </div>
      )}

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
    </div>
  );
}

