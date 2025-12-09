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
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Trash2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import type { PostWithUserAndStats, CommentWithUser } from "@/lib/types";
import { formatRelativeTime } from "@/lib/utils/format-time";
import { formatNumber } from "@/lib/utils/format-number";
import { useUser } from "@clerk/nextjs";
import LikeButton from "./LikeButton";
import CommentList from "@/components/comment/CommentList";
import CommentForm from "@/components/comment/CommentForm";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface PostCardProps {
  post: PostWithUserAndStats;
  comments?: CommentWithUser[];
  onPostDeleted?: (postId: string) => void;
  onDeleteError?: () => void; // 삭제 실패 시 피드 새로고침용
}

export default function PostCard({ post, comments = [], onPostDeleted, onDeleteError }: PostCardProps) {
  const { user: currentUser } = useUser();
  const [showFullCaption, setShowFullCaption] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [showDoubleTapHeart, setShowDoubleTapHeart] = useState(false);
  const doubleTapTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [localComments, setLocalComments] = useState<CommentWithUser[]>(comments);
  const [commentsCount, setCommentsCount] = useState(post.comments_count);
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  // 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [showMenu]);

  // 게시물 삭제 핸들러
  const handleDeletePost = async () => {
    setIsDeleting(true);
    
    try {
      // Optimistic UI: 먼저 피드에서 제거
      if (onPostDeleted) {
        onPostDeleted(post.id);
      }

      const response = await fetch(`/api/posts/${post.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "게시물 삭제에 실패했습니다");
      }

      // 성공 시 다이얼로그 닫기
      setShowDeleteDialog(false);
      setShowMenu(false);
    } catch (error) {
      console.error("Delete post error:", error);
      // 에러 발생 시 사용자에게 알림
      alert(error instanceof Error ? error.message : "게시물 삭제에 실패했습니다");
      // 삭제 실패 시 피드 새로고침 (롤백)
      if (onDeleteError) {
        onDeleteError();
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <article className="bg-white border-b border-[#dbdbdb] mb-4 md:mb-6">
      {/* 헤더 (60px 높이) */}
      <header className="flex items-center gap-3 px-3 py-2.5 md:px-4 md:py-3 h-[56px] md:h-[60px]">
        {/* 프로필 이미지 */}
        <Link href={profileLink} className="flex-shrink-0">
          <div className="w-8 h-8 md:w-8 md:h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
            {/* 추후 Clerk 프로필 이미지 또는 기본 아바타 */}
            <span className="text-xs md:text-sm font-semibold text-gray-600">
              {post.user.name.charAt(0).toUpperCase()}
            </span>
          </div>
        </Link>

        {/* 사용자명 및 시간 */}
        <div className="flex-1 min-w-0">
          <Link href={profileLink}>
            <span className="text-sm md:text-base font-semibold text-[#262626] hover:opacity-50 transition-opacity active:opacity-70">
              {post.user.name}
            </span>
          </Link>
          <div className="text-[10px] md:text-xs text-[#8e8e8e]">
            {formatRelativeTime(post.created_at)}
          </div>
        </div>

        {/* ⋯ 메뉴 */}
        <div className="relative" ref={menuRef}>
          <button
            className="p-2 md:p-2 min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center hover:opacity-50 active:opacity-70 transition-opacity touch-manipulation"
            aria-label="더보기"
            onClick={() => setShowMenu(!showMenu)}
          >
            <MoreHorizontal className="w-5 h-5 text-[#262626]" />
          </button>

          {/* 드롭다운 메뉴 */}
          {showMenu && isOwnPost && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-[#dbdbdb] z-50 animate-fade-in">
              <button
                className="w-full px-4 py-3 text-left text-[#262626] hover:bg-gray-50 active:bg-gray-100 flex items-center gap-2 text-sm font-medium min-h-[44px] touch-manipulation transition-colors"
                onClick={() => {
                  setShowMenu(false);
                  setShowDeleteDialog(true);
                }}
              >
                <Trash2 className="w-4 h-4 text-red-600" />
                <span className="text-red-600">삭제</span>
              </button>
            </div>
          )}
        </div>
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
      <div className="flex items-center justify-between px-3 py-2.5 md:px-4 md:py-3 h-[48px]">
        <div className="flex items-center gap-3 md:gap-4">
          {/* 좋아요 버튼 */}
          <LikeButton
            postId={post.id}
            initialLiked={isLiked}
            initialLikesCount={likesCount}
            onLikeChange={handleLikeChange}
          />

          {/* 댓글 버튼 */}
          <button
            className="min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center hover:opacity-50 active:opacity-70 transition-opacity touch-manipulation"
            aria-label="댓글"
          >
            <MessageCircle className="w-6 h-6 text-[#262626]" />
          </button>

          {/* 공유 버튼 (1차 MVP 제외이지만 UI 준비) */}
          <button
            className="min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center hover:opacity-50 active:opacity-70 transition-opacity touch-manipulation disabled:opacity-30"
            aria-label="공유"
            disabled
          >
            <Send className="w-6 h-6 text-[#262626]" />
          </button>
        </div>

        {/* 북마크 버튼 (1차 MVP 제외이지만 UI 준비) */}
        <button
          className="min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center hover:opacity-50 active:opacity-70 transition-opacity touch-manipulation disabled:opacity-30"
          aria-label="북마크"
          disabled
        >
          <Bookmark className="w-6 h-6 text-[#262626]" />
        </button>
      </div>

      {/* 좋아요 수 */}
      {likesCount > 0 && (
        <div className="px-3 md:px-4 pb-1.5 md:pb-2">
          <span className="text-sm md:text-base font-semibold text-[#262626]">
            좋아요 {formatNumber(likesCount)}개
          </span>
        </div>
      )}

      {/* 캡션 */}
      {post.caption && (
        <div className="px-3 md:px-4 pb-1.5 md:pb-2">
          <div className="text-sm md:text-base text-[#262626] leading-relaxed">
            <Link href={profileLink}>
              <span className="font-semibold hover:opacity-50 active:opacity-70 transition-opacity">
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
                  className="text-[#8e8e8e] hover:text-[#262626] active:text-[#262626] transition-colors ml-1 min-h-[44px] md:min-h-0 touch-manipulation"
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

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>게시물 삭제</DialogTitle>
            <DialogDescription>
              이 게시물을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeletePost}
              disabled={isDeleting}
              className="min-w-[100px]"
            >
              {isDeleting ? (
                <span className="flex items-center gap-2">
                  <LoadingSpinner size="sm" className="border-white/30 border-t-white" />
                  삭제 중...
                </span>
              ) : (
                "삭제"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </article>
  );
}

