import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import { handleApiError } from "@/lib/utils/error-handler";

/**
 * @file route.ts
 * @description 팔로우 추가/제거 API
 *
 * POST /api/follows: 팔로우 추가
 * DELETE /api/follows: 팔로우 제거
 * - Clerk 인증 검증
 * - Clerk user ID를 Supabase user_id로 변환
 * - 자기 자신 팔로우 방지
 * - 중복 팔로우 방지 (UNIQUE 제약조건)
 * - follows 테이블에 레코드 추가/삭제
 */

export async function POST(request: NextRequest) {
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

    // 요청 본문 파싱
    const body = await request.json();
    const { followingId } = body;

    if (!followingId) {
      const apiError = handleApiError(new Error("followingId is required"), 400);
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

    const followerId = userData.id;

    // 자기 자신 팔로우 방지 검증
    if (followerId === followingId) {
      const apiError = handleApiError(
        new Error("You cannot follow yourself"),
        400
      );
      return NextResponse.json(
        {
          error: apiError.message,
          ...(apiError.code && { code: apiError.code }),
        },
        { status: apiError.status }
      );
    }

    // 팔로우 추가 (UNIQUE 제약조건으로 중복 방지)
    const { data, error } = await supabase
      .from("follows")
      .insert({
        follower_id: followerId,
        following_id: followingId,
      })
      .select()
      .single();

    if (error) {
      // 중복 팔로우 에러 (UNIQUE 제약조건 위반)
      if (error.code === "23505") {
        const apiError = handleApiError(new Error("Already following this user"), 409);
        return NextResponse.json(
          {
            error: apiError.message,
            ...(apiError.code && { code: apiError.code }),
          },
          { status: apiError.status }
        );
      }

      const apiError = handleApiError(error, 500);
      console.error("Supabase error:", error);
      return NextResponse.json(
        {
          error: apiError.message,
          ...(apiError.details && { details: apiError.details }),
          ...(apiError.code && { code: apiError.code }),
        },
        { status: apiError.status }
      );
    }

    return NextResponse.json({ success: true, data });
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

export async function DELETE(request: NextRequest) {
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

    // 요청 본문 파싱
    const body = await request.json();
    const { followingId } = body;

    if (!followingId) {
      const apiError = handleApiError(new Error("followingId is required"), 400);
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

    const followerId = userData.id;

    // 팔로우 제거
    const { error } = await supabase
      .from("follows")
      .delete()
      .eq("follower_id", followerId)
      .eq("following_id", followingId);

    if (error) {
      const apiError = handleApiError(error, 500);
      console.error("Supabase error:", error);
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

