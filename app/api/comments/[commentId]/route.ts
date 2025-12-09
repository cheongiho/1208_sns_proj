import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";

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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // URL 파라미터에서 commentId 추출
    const { commentId } = await params;

    if (!commentId) {
      return NextResponse.json(
        { error: "commentId is required" },
        { status: 400 }
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
      console.error("User lookup error:", userError);
      return NextResponse.json(
        { error: "User not found in database" },
        { status: 404 }
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
      console.error("Comment fetch error:", commentFetchError);
      return NextResponse.json(
        { error: "Comment not found" },
        { status: 404 }
      );
    }

    // 소유자 확인 (본인만 삭제 가능)
    if (commentData.user_id !== userId) {
      return NextResponse.json(
        { error: "Forbidden: You can only delete your own comments" },
        { status: 403 }
      );
    }

    // 댓글 삭제
    const { error: deleteError } = await supabase
      .from("comments")
      .delete()
      .eq("id", commentId)
      .eq("user_id", userId); // 추가 안전장치

    if (deleteError) {
      console.error("Supabase delete error:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete comment", details: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

