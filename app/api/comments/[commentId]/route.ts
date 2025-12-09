import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import { handleApiError } from "@/lib/utils/error-handler";

/**
 * @file route.ts
 * @description 댓글 삭제 API
 *
 * DELETE /api/comments/[commentId]
 * - 개별 댓글 삭제
 * - 본인만 삭제 가능 (소유자 확인)
 * - Clerk 인증 검증
 */

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ commentId: string }> }
) {
  try {
    // Clerk 인증 확인
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      const apiError = handleApiError(new Error("Unauthorized"), 401);
      return NextResponse.json(
        {
          error: apiError.message,
          ...(apiError.code && { code: apiError.code }),
        },
        { status: apiError.status }
      );
    }

    // URL 파라미터에서 commentId 추출
    const { commentId } = await params;

    if (!commentId) {
      const apiError = handleApiError(new Error("commentId is required"), 400);
      return NextResponse.json(
        {
          error: apiError.message,
          ...(apiError.code && { code: apiError.code }),
        },
        { status: apiError.status }
      );
    }

    const supabase = createClerkSupabaseClient();

    // Clerk user ID를 Supabase user_id로 변환
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", clerkUserId)
      .single();

    if (userError || !userData) {
      const apiError = handleApiError(userError || new Error("User not found"), 404);
      console.error("User lookup error:", userError);
      return NextResponse.json(
        {
          error: apiError.message,
          ...(apiError.details && { details: apiError.details }),
          ...(apiError.code && { code: apiError.code }),
        },
        { status: apiError.status }
      );
    }

    const userId = userData.id;

    // 댓글 조회 및 소유자 확인
    const { data: commentData, error: commentFetchError } = await supabase
      .from("comments")
      .select("id, user_id")
      .eq("id", commentId)
      .single();

    if (commentFetchError || !commentData) {
      const apiError = handleApiError(commentFetchError || new Error("Comment not found"), 404);
      console.error("Comment fetch error:", commentFetchError);
      return NextResponse.json(
        {
          error: apiError.message,
          ...(apiError.details && { details: apiError.details }),
          ...(apiError.code && { code: apiError.code }),
        },
        { status: apiError.status }
      );
    }

    // 소유자 확인 (본인만 삭제 가능)
    if (commentData.user_id !== userId) {
      const apiError = handleApiError(new Error("Forbidden: You can only delete your own comments"), 403);
      return NextResponse.json(
        {
          error: apiError.message,
          ...(apiError.code && { code: apiError.code }),
        },
        { status: apiError.status }
      );
    }

    // 댓글 삭제
    const { error: deleteError } = await supabase
      .from("comments")
      .delete()
      .eq("id", commentId)
      .eq("user_id", userId); // 추가 안전장치

    if (deleteError) {
      const apiError = handleApiError(deleteError, 500);
      console.error("Supabase delete error:", deleteError);
      return NextResponse.json(
        {
          error: apiError.message,
          ...(apiError.details && { details: apiError.details }),
          ...(apiError.code && { code: apiError.code }),
        },
        { status: apiError.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const apiError = handleApiError(error, 500);
    console.error("API error:", error);
    return NextResponse.json(
      {
        error: apiError.message,
        ...(apiError.details && { details: apiError.details }),
        ...(apiError.code && { code: apiError.code }),
      },
      { status: apiError.status }
    );
  }
}

