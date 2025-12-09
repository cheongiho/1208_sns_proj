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
import type { PostWithUserAndStats, CommentWithUser, PaginatedResponse } from "@/lib/types";

interface PostFeedProps {
  userId?: string; // 프로필 페이지용
}

export default function PostFeed({ userId }: PostFeedProps) {
  const [posts, setPosts] = useState<PostWithUserAndStats[]>([]);
  const [commentsMap, setCommentsMap] = useState<Map<string, CommentWithUser[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const sentinelRef = useRef<HTMLDivElement>(null);

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
          throw new Error("게시물을 불러오는데 실패했습니다");
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
        setError(
          err instanceof Error ? err.message : "게시물을 불러오는데 실패했습니다"
        );
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
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          comments={commentsMap.get(post.id) || []}
        />
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
    </div>
  );
}

