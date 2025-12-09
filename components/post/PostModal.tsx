"use client";

/**
 * @file PostModal.tsx
 * @description 게시물 상세 모달 컴포넌트
 *
 * Instagram 스타일의 게시물 상세 모달 UI
 * - Desktop: 모달 형식 (이미지 50% + 댓글 50%)
 * - Mobile: 전체 화면 모달
 * - 게시물 정보, 댓글 전체 목록 표시
 * - 이전/다음 게시물 네비게이션 (Desktop)
 */

import { useState, useEffect, useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import { ChevronLeft, ChevronRight, MoreHorizontal, MessageCircle, Bookmark } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import LikeButton from "./LikeButton";
import CommentList from "@/components/comment/CommentList";
import CommentForm from "@/components/comment/CommentForm";
import type { PostWithUserAndStats, CommentWithUser } from "@/lib/types";
import { getUserFriendlyMessage, extractErrorMessage, isNetworkError } from "@/lib/utils/error-handler";
import { formatNumber } from "@/lib/utils/format-number";

interface PostModalProps {
  postId: string;
  isOpen: boolean;
  onClose: () => void;
  posts?: PostWithUserAndStats[]; // 이전/다음 네비게이션용 (선택적)
  onPostIdChange?: (newPostId: string) => void; // 게시물 ID 변경 콜백
}

export default function PostModal({
  postId,
  isOpen,
  onClose,
  posts = [],
  onPostIdChange,
}: PostModalProps) {
  const { user: currentUser } = useUser();
  const [post, setPost] = useState<PostWithUserAndStats | null>(null);
  const [comments, setComments] = useState<CommentWithUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [likesCount, setLikesCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [commentsCount, setCommentsCount] = useState(0);

  // 이전/다음 게시물 ID 계산
  const { prevPostId, nextPostId } = useMemo(() => {
    if (!posts || posts.length === 0 || !postId) {
      return { prevPostId: null, nextPostId: null };
    }

    const currentIndex = posts.findIndex((p) => p.id === postId);
    if (currentIndex === -1) {
      return { prevPostId: null, nextPostId: null };
    }

    const prevPost = currentIndex > 0 ? posts[currentIndex - 1] : null;
    const nextPost = currentIndex < posts.length - 1 ? posts[currentIndex + 1] : null;

    return {
      prevPostId: prevPost?.id || null,
      nextPostId: nextPost?.id || null,
    };
  }, [posts, postId]);

  // 게시물 정보 로딩
  useEffect(() => {
    if (!isOpen || !postId) return;

    const fetchPost = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/posts/${postId}`);
        if (!response.ok) {
          const errorMessage = await extractErrorMessage(response);
          throw new Error(errorMessage);
        }

        const data = await response.json();
        const postData = data.data;
        setPost(postData);
        setLikesCount(postData.likes_count);
        setIsLiked(postData.isLiked || false);
        setCommentsCount(postData.comments_count);
      } catch (err) {
        console.error("Fetch post error:", err);
        const errorMessage = getUserFriendlyMessage(err);
        if (isNetworkError(err)) {
          setError("네트워크 연결을 확인해주세요. 잠시 후 다시 시도해주세요.");
        } else {
          setError(errorMessage);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [isOpen, postId]);

  // 댓글 목록 로딩
  useEffect(() => {
    if (!isOpen || !postId) return;

    const fetchComments = async () => {
      try {
        // 전체 댓글 조회 (limit을 크게 설정)
        const response = await fetch(`/api/comments?postId=${postId}&limit=1000`);
        if (!response.ok) {
          // 댓글 로딩 실패해도 게시물은 표시
          return;
        }

        const data = await response.json();
        setComments(data.data || []);
      } catch (err) {
        console.error("Fetch comments error:", err);
        // 댓글 로딩 실패해도 게시물은 표시
      }
    };

    fetchComments();
  }, [isOpen, postId]);

  // 모달이 닫힐 때 상태 초기화
  useEffect(() => {
    if (!isOpen) {
      setPost(null);
      setComments([]);
      setError(null);
    }
  }, [isOpen]);

  // 좋아요 상태 변경 핸들러
  const handleLikeChange = (liked: boolean, newCount: number) => {
    setIsLiked(liked);
    setLikesCount(newCount);
    // post 상태도 업데이트
    if (post) {
      setPost({ ...post, isLiked: liked, likes_count: newCount });
    }
  };

  // 댓글 추가 핸들러
  const handleCommentAdded = (comment: CommentWithUser) => {
    setComments((prev) => [comment, ...prev]);
    setCommentsCount((prev) => prev + 1);
    // post 상태도 업데이트
    if (post) {
      setPost({ ...post, comments_count: post.comments_count + 1 });
    }
  };

  // 댓글 삭제 핸들러
  const handleCommentDeleted = (commentId: string) => {
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    setCommentsCount((prev) => Math.max(0, prev - 1));
    // post 상태도 업데이트
    if (post) {
      setPost({ ...post, comments_count: Math.max(0, post.comments_count - 1) });
    }
  };

  // 프로필 링크
  const profileLink = useMemo(() => {
    if (!post) return "/";
    return `/profile/${post.user.id}`;
  }, [post]);

  // 본인 게시물 여부
  const isOwnPost = useMemo(() => {
    return currentUser?.id && post?.user.clerk_id === currentUser.id;
  }, [currentUser?.id, post?.user.clerk_id]);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-5xl max-w-full w-full h-[90vh] max-h-[90vh] p-0 gap-0 overflow-hidden">
        {/* 로딩 상태 */}
        {loading && (
          <div className="flex items-center justify-center h-full">
            <LoadingSpinner />
          </div>
        )}

        {/* 에러 상태 */}
        {error && !loading && (
          <div className="flex flex-col items-center justify-center h-full p-8">
            <p className="text-sm text-[#ed4956] mb-4">{error}</p>
            <Button onClick={onClose} variant="outline">
              닫기
            </Button>
          </div>
        )}

        {/* 게시물 내용 */}
        {post && !loading && (
          <div className="flex flex-col lg:flex-row h-full">
            {/* 이미지 영역 (좌측 50% 또는 전체 너비) */}
            <div className="relative w-full lg:w-1/2 h-1/2 lg:h-full bg-black flex items-center justify-center">
              <Image
                src={post.image_url}
                alt={post.caption || "게시물 이미지"}
                fill
                className="object-contain"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />

              {/* 이전/다음 네비게이션 버튼 (Desktop만) */}
              {prevPostId && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white lg:flex hidden"
                  onClick={() => {
                    if (prevPostId && onPostIdChange) {
                      onPostIdChange(prevPostId);
                    }
                  }}
                  aria-label="이전 게시물"
                >
                  <ChevronLeft className="w-6 h-6" />
                </Button>
              )}
              {nextPostId && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white lg:flex hidden"
                  onClick={() => {
                    if (nextPostId && onPostIdChange) {
                      onPostIdChange(nextPostId);
                    }
                  }}
                  aria-label="다음 게시물"
                >
                  <ChevronRight className="w-6 h-6" />
                </Button>
              )}
            </div>

            {/* 댓글 영역 (우측 50% 또는 전체 너비) */}
            <div className="w-full lg:w-1/2 h-1/2 lg:h-full flex flex-col bg-white">
              {/* 헤더: 사용자 정보 */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#dbdbdb]">
                <div className="flex items-center gap-3">
                  <Link href={profileLink}>
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                      {/* 프로필 이미지 (추후 추가 가능) */}
                      <span className="text-sm font-semibold text-[#262626]">
                        {post.user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </Link>
                  <div>
                    <Link href={profileLink}>
                      <span className="text-sm font-semibold text-[#262626] hover:opacity-50 transition-opacity">
                        {post.user.name}
                      </span>
                    </Link>
                  </div>
                </div>
                {isOwnPost && (
                  <button
                    className="p-2 hover:bg-gray-50 rounded-full transition-colors"
                    aria-label="메뉴"
                  >
                    <MoreHorizontal className="w-5 h-5 text-[#262626]" />
                  </button>
                )}
              </div>

              {/* 댓글 목록 영역 (스크롤 가능) */}
              <div className="flex-1 overflow-y-auto">
                {/* 액션 버튼 및 좋아요 수 */}
                <div className="px-4 py-2 border-b border-[#dbdbdb]">
                  <div className="flex items-center gap-4 mb-2">
                    <LikeButton
                      postId={post.id}
                      initialLiked={isLiked}
                      initialLikesCount={likesCount}
                      onLikeChange={handleLikeChange}
                    />
                    <button
                      className="min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center hover:opacity-70 active:opacity-50 transition-opacity touch-manipulation"
                      aria-label="댓글"
                    >
                      <MessageCircle className="w-6 h-6 text-[#262626]" />
                    </button>
                    <button
                      className="min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center hover:opacity-70 active:opacity-50 transition-opacity touch-manipulation ml-auto"
                      aria-label="북마크"
                    >
                      <Bookmark className="w-6 h-6 text-[#262626]" />
                    </button>
                  </div>
                  <div className="text-sm font-semibold text-[#262626]">
                    좋아요 {formatNumber(likesCount)}개
                  </div>
                </div>

                {/* 캡션 */}
                {post.caption && (
                  <div className="px-4 py-2 border-b border-[#dbdbdb]">
                    <div className="text-sm text-[#262626]">
                      <Link href={profileLink}>
                        <span className="font-semibold hover:opacity-50 transition-opacity">
                          {post.user.name}
                        </span>
                      </Link>
                      {" "}
                      <span>{post.caption}</span>
                    </div>
                  </div>
                )}

                {/* 댓글 목록 */}
                {commentsCount > 0 && (
                  <div className="px-4 py-2">
                    <CommentList
                      comments={comments}
                      postId={post.id}
                      showAll={true}
                      onCommentDeleted={handleCommentDeleted}
                    />
                  </div>
                )}
              </div>

              {/* 댓글 작성 폼 */}
              <div className="px-4 py-3 border-t border-[#dbdbdb]">
                <CommentForm postId={post.id} onCommentAdded={handleCommentAdded} />
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

