import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import type { CommentWithUser } from "@/lib/types";

/**
 * @file route.ts
 * @description 댓글 조회 및 작성 API
 *
 * GET /api/comments?postId={postId}&limit={limit}
 * - 특정 게시물의 댓글 조회
 * - 최신 댓글 우선 정렬
 * - 사용자 정보 포함
 *
 * POST /api/comments
 * - 댓글 작성
 * - Clerk 인증 검증
 * - content 유효성 검증
 * - 사용자 정보 포함 응답
 */

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const postId = searchParams.get("postId");
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    if (!postId) {
      return NextResponse.json(
        { error: "postId is required" },
        { status: 400 }
      );
    }

    const supabase = createClerkSupabaseClient();

    // comments 테이블 조회
    const { data: commentsData, error: commentsError } = await supabase
      .from("comments")
      .select("id, post_id, user_id, content, created_at, updated_at")
      .eq("post_id", postId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (commentsError) {
      console.error("Supabase error:", commentsError);
      return NextResponse.json(
        { error: "Failed to fetch comments", details: commentsError.message },
        { status: 500 }
      );
    }

    if (!commentsData || commentsData.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // user_ids 추출
    const userIds = [...new Set(commentsData.map((comment) => comment.user_id))];

    // users 테이블에서 사용자 정보 조회
    const { data: usersData, error: usersError } = await supabase
      .from("users")
      .select("id, clerk_id, name, created_at")
      .in("id", userIds);

    if (usersError) {
      console.error("Users error:", usersError);
      // 사용자 조회 실패해도 댓글은 반환
    }

    // 사용자 데이터를 맵으로 변환
    const usersMap = new Map(
      (usersData || []).map((user) => [user.id, user])
    );

    // 데이터 변환: CommentWithUser 형식으로
    const comments: CommentWithUser[] = commentsData.map((item) => {
      const user = usersMap.get(item.user_id);
      return {
        id: item.id,
        post_id: item.post_id,
        user_id: item.user_id,
        content: item.content,
        created_at: item.created_at,
        updated_at: item.updated_at,
        user: {
          id: user?.id || item.user_id,
          clerk_id: user?.clerk_id || "",
          name: user?.name || "Unknown",
          created_at: user?.created_at || item.created_at,
        },
      };
    });

    return NextResponse.json({ data: comments });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Clerk 인증 확인
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 요청 본문 파싱
    const body = await request.json();
    const { postId, content } = body;

    // 필수 필드 검증
    if (!postId) {
      return NextResponse.json(
        { error: "postId is required" },
        { status: 400 }
      );
    }

    if (!content || typeof content !== "string") {
      return NextResponse.json(
        { error: "content is required and must be a string" },
        { status: 400 }
      );
    }

    // content 유효성 검증
    const trimmedContent = content.trim();
    if (trimmedContent.length === 0) {
      return NextResponse.json(
        { error: "content cannot be empty" },
        { status: 400 }
      );
    }

    // 최대 길이 검증 (Instagram은 2,200자이지만 댓글은 더 짧게 제한)
    const MAX_COMMENT_LENGTH = 1000;
    if (trimmedContent.length > MAX_COMMENT_LENGTH) {
      return NextResponse.json(
        { error: `content must be less than ${MAX_COMMENT_LENGTH} characters` },
        { status: 400 }
      );
    }

    const supabase = createClerkSupabaseClient();

    // Clerk user ID를 Supabase user_id로 변환
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, clerk_id, name, created_at")
      .eq("clerk_id", clerkUserId)
      .single();

    if (userError || !userData) {
      console.error("User lookup error:", userError);
      return NextResponse.json(
        { error: "User not found in database" },
        { status: 404 }
      );
    }

    // 댓글 삽입
    const { data: commentData, error: commentError } = await supabase
      .from("comments")
      .insert({
        post_id: postId,
        user_id: userData.id,
        content: trimmedContent,
      })
      .select()
      .single();

    if (commentError) {
      console.error("Supabase error:", commentError);
      return NextResponse.json(
        { error: "Failed to create comment", details: commentError.message },
        { status: 500 }
      );
    }

    // CommentWithUser 형식으로 응답 반환
    const commentWithUser: CommentWithUser = {
      id: commentData.id,
      post_id: commentData.post_id,
      user_id: commentData.user_id,
      content: commentData.content,
      created_at: commentData.created_at,
      updated_at: commentData.updated_at,
      user: {
        id: userData.id,
        clerk_id: userData.clerk_id,
        name: userData.name,
        created_at: userData.created_at,
      },
    };

    return NextResponse.json({ success: true, data: commentWithUser });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

