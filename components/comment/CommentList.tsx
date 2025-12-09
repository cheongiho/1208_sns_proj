"use client";

/**
 * @file CommentList.tsx
 * @description 댓글 목록 컴포넌트
 *
 * Instagram 스타일의 댓글 목록 UI
 * - 댓글 목록 렌더링
 * - 사용자명 (Bold), 댓글 내용 표시
 * - 본인 댓글에만 삭제 버튼 표시
 * - showAll 옵션으로 전체/미리보기 모드 지원
 * - Optimistic UI 업데이트
 */

import { useState } from "react";
import Link from "next/link";
import { MoreHorizontal } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import type { CommentWithUser } from "@/lib/types";
import { formatNumber } from "@/lib/utils/format-number";

interface CommentListProps {
  comments: CommentWithUser[];
  postId: string;
  showAll?: boolean; // true: 전체 댓글, false: 최신 2개만
  onCommentDeleted?: (commentId: string) => void;
  onShowAllClick?: () => void; // "댓글 N개 모두 보기" 클릭 시
}

export default function CommentList({
  comments,
  postId,
  showAll = false,
  onCommentDeleted,
  onShowAllClick,
}: CommentListProps) {
  const { user: currentUser } = useUser();
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(
    null
  );
  const [localComments, setLocalComments] = useState(comments);

  // showAll이 false일 때 최신 2개만 표시
  const displayComments = showAll
    ? localComments
    : localComments.slice(0, 2);

  // 댓글 삭제 핸들러
  const handleDelete = async (commentId: string) => {
    if (deletingCommentId) return; // 이미 삭제 중

    setDeletingCommentId(commentId);

    // Optimistic UI: 댓글 목록에서 즉시 제거
    setLocalComments((prev) => prev.filter((c) => c.id !== commentId));

    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        // 에러 발생 시 롤백
        setLocalComments(comments);
        const data = await response.json();
        throw new Error(data.error || "댓글 삭제에 실패했습니다");
      }

      // 성공 시 콜백 호출
      if (onCommentDeleted) {
        onCommentDeleted(commentId);
      }
    } catch (error) {
      console.error("Delete comment error:", error);
      // 에러는 이미 롤백됨
      alert(
        error instanceof Error
          ? error.message
          : "댓글 삭제에 실패했습니다"
      );
    } finally {
      setDeletingCommentId(null);
    }
  };

  // 댓글이 없을 때
  if (localComments.length === 0) {
    return null; // 빈 상태는 표시하지 않음 (PostCard에서 처리)
  }

  // 본인 댓글 여부 확인 (clerk_id로 비교)
  const isOwnComment = (comment: CommentWithUser) => {
    if (!currentUser || !comment.user.clerk_id) return false;
    return comment.user.clerk_id === currentUser.id;
  };

  return (
    <div className="px-4 pb-4 space-y-1">
      {/* "댓글 N개 모두 보기" 버튼 (showAll이 false이고 댓글이 2개 이상일 때) */}
      {!showAll && localComments.length > 2 && (
        <button
          onClick={onShowAllClick}
          className="text-sm text-[#8e8e8e] hover:text-[#262626] transition-colors mb-1"
        >
          댓글 {formatNumber(localComments.length)}개 모두 보기
        </button>
      )}

      {/* 댓글 목록 */}
      {displayComments.map((comment) => (
        <div
          key={comment.id}
          className="text-sm text-[#262626] flex items-start gap-2 group"
        >
          <div className="flex-1 min-w-0">
            <Link
              href={`/profile/${comment.user.id}`}
              className="font-semibold hover:opacity-50 transition-opacity"
            >
              {comment.user.name}
            </Link>
            {" "}
            <span className="break-words">{comment.content}</span>
          </div>

          {/* 삭제 버튼 (본인 댓글만 표시) */}
          {isOwnComment(comment) && (
            <button
              onClick={() => handleDelete(comment.id)}
              disabled={deletingCommentId === comment.id}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:opacity-50 disabled:opacity-50"
              aria-label="댓글 삭제"
            >
              <MoreHorizontal className="w-4 h-4 text-[#8e8e8e]" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

