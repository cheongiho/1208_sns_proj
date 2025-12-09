"use client";

/**
 * @file PostCard.tsx
 * @description 게시물 카드 컴포넌트
 *
 * Instagram 스타일의 게시물 카드 UI
 * - 헤더: 프로필 이미지, 사용자명, 시간, 메뉴
 * - 이미지: 1:1 정사각형
 * - 액션 버튼: 좋아요, 댓글, 공유, 북마크
 * - 좋아요 수, 캡션, 댓글 미리보기
 */

import Link from "next/link";
import Image from "next/image";
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from "lucide-react";
import { useState, useRef } from "react";
import type { PostWithUserAndStats, CommentWithUser } from "@/lib/types";
import { formatRelativeTime } from "@/lib/utils/format-time";
import { formatNumber } from "@/lib/utils/format-number";
import { useUser } from "@clerk/nextjs";
import LikeButton from "./LikeButton";
import CommentList from "@/components/comment/CommentList";
import CommentForm from "@/components/comment/CommentForm";

interface PostCardProps {
  post: PostWithUserAndStats;
  comments?: CommentWithUser[];
}

export default function PostCard({ post, comments = [] }: PostCardProps) {
  const { user: currentUser } = useUser();
  const [showFullCaption, setShowFullCaption] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [showDoubleTapHeart, setShowDoubleTapHeart] = useState(false);
  const doubleTapTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [localComments, setLocalComments] = useState<CommentWithUser[]>(comments);
  const [commentsCount, setCommentsCount] = useState(post.comments_count);

  // 캡션 2줄 초과 여부 확인
  const captionLines = post.caption?.split("\n") || [];
  const shouldTruncate = captionLines.length > 2 || (post.caption && post.caption.length > 100);

  // 본인 게시물 여부 확인
  const isOwnPost = currentUser?.id && post.user.clerk_id === currentUser.id;

  // 프로필 링크
  const profileLink = `/profile/${post.user.id}`;

  // 더블탭 좋아요 핸들러
  const handleDoubleClick = () => {
    // 이미 좋아요가 눌려있으면 무시
    if (isLiked) return;

    // 큰 하트 표시
    setShowDoubleTapHeart(true);

    // 1초 후 사라짐
    if (doubleTapTimeoutRef.current) {
      clearTimeout(doubleTapTimeoutRef.current);
    }
    doubleTapTimeoutRef.current = setTimeout(() => {
      setShowDoubleTapHeart(false);
    }, 1000);

    // Optimistic UI 업데이트
    setIsLiked(true);
    setLikesCount((prev) => prev + 1);

    // 좋아요 추가 API 호출
    fetch("/api/likes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ postId: post.id }),
    })
      .then((res) => {
        if (!res.ok) {
          // 에러 발생 시 롤백
          setIsLiked(false);
          setLikesCount((prev) => prev - 1);
        }
      })
      .catch((err) => {
        console.error("Double tap like error:", err);
        // 에러 발생 시 롤백
        setIsLiked(false);
        setLikesCount((prev) => prev - 1);
      });
  };

  // 좋아요 변경 콜백
  const handleLikeChange = (liked: boolean, newCount: number) => {
    setIsLiked(liked);
    setLikesCount(newCount);
  };

  // 댓글 추가 핸들러
  const handleCommentAdded = (newComment: CommentWithUser) => {
    // Optimistic UI: 댓글 목록에 즉시 추가 (최신순이므로 맨 앞에 추가)
    setLocalComments((prev) => [newComment, ...prev]);
    setCommentsCount((prev) => prev + 1);
  };

  // 댓글 삭제 핸들러
  const handleCommentDeleted = (commentId: string) => {
    // Optimistic UI: 댓글 목록에서 제거
    setLocalComments((prev) => prev.filter((c) => c.id !== commentId));
    setCommentsCount((prev) => Math.max(0, prev - 1));
  };

  return (
    <article className="bg-white border-b border-[#dbdbdb] mb-4">
      {/* 헤더 (60px 높이) */}
      <header className="flex items-center gap-3 px-4 py-3 h-[60px]">
        {/* 프로필 이미지 */}
        <Link href={profileLink} className="flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
            {/* 추후 Clerk 프로필 이미지 또는 기본 아바타 */}
            <span className="text-sm font-semibold text-gray-600">
              {post.user.name.charAt(0).toUpperCase()}
            </span>
          </div>
        </Link>

        {/* 사용자명 및 시간 */}
        <div className="flex-1 min-w-0">
          <Link href={profileLink}>
            <span className="font-semibold text-[#262626] hover:opacity-50 transition-opacity">
              {post.user.name}
            </span>
          </Link>
          <div className="text-xs text-[#8e8e8e]">
            {formatRelativeTime(post.created_at)}
          </div>
        </div>

        {/* ⋯ 메뉴 */}
        <button
          className="p-2 hover:opacity-50 transition-opacity"
          aria-label="더보기"
        >
          <MoreHorizontal className="w-5 h-5 text-[#262626]" />
        </button>
      </header>

      {/* 이미지 영역 (1:1 정사각형) */}
      <div
        className="relative w-full aspect-square bg-gray-100 cursor-pointer"
        onDoubleClick={handleDoubleClick}
      >
        <Image
          src={post.image_url}
          alt={post.caption || "게시물 이미지"}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 630px"
          priority={false}
        />
        {/* 더블탭 하트 애니메이션 */}
        {showDoubleTapHeart && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Heart
              className="w-20 h-20 fill-[#ed4956] text-[#ed4956] animate-pulse"
              style={{
                animation: "fadeInOut 1s ease-in-out",
              }}
            />
          </div>
        )}
      </div>

      {/* 액션 버튼 영역 (48px 높이) */}
      <div className="flex items-center justify-between px-4 py-3 h-[48px]">
        <div className="flex items-center gap-4">
          {/* 좋아요 버튼 */}
          <LikeButton
            postId={post.id}
            initialLiked={isLiked}
            initialLikesCount={likesCount}
            onLikeChange={handleLikeChange}
          />

          {/* 댓글 버튼 */}
          <button
            className="hover:opacity-50 transition-opacity"
            aria-label="댓글"
          >
            <MessageCircle className="w-6 h-6 text-[#262626]" />
          </button>

          {/* 공유 버튼 (1차 MVP 제외이지만 UI 준비) */}
          <button
            className="hover:opacity-50 transition-opacity"
            aria-label="공유"
            disabled
          >
            <Send className="w-6 h-6 text-[#262626]" />
          </button>
        </div>

        {/* 북마크 버튼 (1차 MVP 제외이지만 UI 준비) */}
        <button
          className="hover:opacity-50 transition-opacity"
          aria-label="북마크"
          disabled
        >
          <Bookmark className="w-6 h-6 text-[#262626]" />
        </button>
      </div>

      {/* 좋아요 수 */}
      {likesCount > 0 && (
        <div className="px-4 pb-2">
          <span className="font-semibold text-[#262626]">
            좋아요 {formatNumber(likesCount)}개
          </span>
        </div>
      )}

      {/* 캡션 */}
      {post.caption && (
        <div className="px-4 pb-2">
          <div className="text-[#262626]">
            <Link href={profileLink}>
              <span className="font-semibold hover:opacity-50 transition-opacity">
                {post.user.name}
              </span>
            </Link>
            {" "}
            {shouldTruncate && !showFullCaption ? (
              <>
                <span>
                  {post.caption.slice(0, 100)}
                  {post.caption.length > 100 && "..."}
                </span>
                <button
                  onClick={() => setShowFullCaption(true)}
                  className="text-[#8e8e8e] hover:text-[#262626] transition-colors ml-1"
                >
                  더 보기
                </button>
              </>
            ) : (
              <span>{post.caption}</span>
            )}
          </div>
        </div>
      )}

      {/* 댓글 목록 */}
      {commentsCount > 0 && (
        <CommentList
          comments={localComments}
          postId={post.id}
          showAll={false}
          onCommentDeleted={handleCommentDeleted}
          onShowAllClick={() => {
            // 향후 상세 모달 열기 기능 구현
            console.log("Show all comments for post:", post.id);
          }}
        />
      )}

      {/* 댓글 작성 폼 */}
      <CommentForm postId={post.id} onCommentAdded={handleCommentAdded} />
    </article>
  );
}

