"use client";

/**
 * @file CommentForm.tsx
 * @description 댓글 작성 폼 컴포넌트
 *
 * Instagram 스타일의 댓글 작성 UI
 * - 입력 필드: "댓글 달기..." placeholder
 * - Enter 키 또는 "게시" 버튼으로 제출
 * - Optimistic UI 업데이트
 * - 로딩 상태 및 에러 처리
 */

import { useState, FormEvent, KeyboardEvent } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { getUserFriendlyMessage, extractErrorMessage, isNetworkError } from "@/lib/utils/error-handler";
import type { CommentWithUser } from "@/lib/types";

interface CommentFormProps {
  postId: string;
  onCommentAdded?: (comment: CommentWithUser) => void;
}

export default function CommentForm({
  postId,
  onCommentAdded,
}: CommentFormProps) {
  const { user: currentUser, isSignedIn } = useUser();
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e?: FormEvent) => {
    e?.preventDefault();

    // 인증 확인
    if (!isSignedIn || !currentUser) {
      setError("로그인이 필요합니다");
      return;
    }

    // 빈 댓글 체크
    const trimmedContent = content.trim();
    if (trimmedContent.length === 0) {
      return;
    }

    // 최대 길이 체크
    if (trimmedContent.length > 1000) {
      setError("댓글은 1000자 이하여야 합니다");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          postId,
          content: trimmedContent,
        }),
      });

      if (!response.ok) {
        const errorMessage = await extractErrorMessage(response);
        throw new Error(errorMessage);
      }

      const data = await response.json();
      const newComment: CommentWithUser = data.data;

      // 입력 필드 초기화
      setContent("");

      // 콜백 호출 (Optimistic UI 업데이트)
      if (onCommentAdded) {
        onCommentAdded(newComment);
      }
    } catch (err) {
      console.error("Comment error:", err);
      const errorMessage = getUserFriendlyMessage(err);
      // 네트워크 에러인 경우 특별한 메시지 표시
      if (isNetworkError(err)) {
        setError("네트워크 연결을 확인해주세요. 잠시 후 다시 시도해주세요.");
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // Enter 키로 제출 (Shift+Enter는 줄바꿈 허용하지 않음)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // 인증되지 않은 사용자
  if (!isSignedIn) {
    return (
      <div className="px-4 py-3 border-t border-[#dbdbdb]">
        <p className="text-sm text-[#8e8e8e] text-center">
          댓글을 작성하려면{" "}
          <Link
            href="/sign-in"
            className="text-[#0095f6] hover:underline"
          >
            로그인
          </Link>
          이 필요합니다
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="px-4 py-3 border-t border-[#dbdbdb]"
    >
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            setError(null);
          }}
          onKeyDown={handleKeyDown}
          placeholder="댓글 달기..."
          className="flex-1 text-sm text-[#262626] placeholder:text-[#8e8e8e] focus:outline-none focus:ring-2 focus:ring-[#0095f6] focus:ring-offset-2 rounded bg-transparent"
          disabled={isLoading}
          maxLength={1000}
          aria-label="댓글 입력"
          aria-describedby={error ? "comment-error" : undefined}
          aria-invalid={error ? "true" : "false"}
        />
        <button
          type="submit"
          disabled={isLoading || content.trim().length === 0}
          className={`text-sm font-semibold transition-opacity min-w-[60px] min-h-[44px] flex items-center justify-center gap-1.5 touch-manipulation focus:outline-none focus:ring-2 focus:ring-[#0095f6] focus:ring-offset-2 rounded ${
            isLoading || content.trim().length === 0
              ? "text-[#8e8e8e] cursor-not-allowed"
              : "text-[#0095f6] hover:opacity-50 active:opacity-70"
          }`}
          aria-label="댓글 게시"
          aria-busy={isLoading}
        >
          {isLoading ? (
            <>
              <div className="w-3 h-3 border-2 border-[#0095f6]/30 border-t-[#0095f6] rounded-full animate-spin" />
              <span>게시 중...</span>
            </>
          ) : (
            "게시"
          )}
        </button>
      </div>
      {error && (
        <p id="comment-error" className="mt-2 text-xs text-[#ed4956]" role="alert" aria-live="polite">
          {error}
        </p>
      )}
    </form>
  );
}

