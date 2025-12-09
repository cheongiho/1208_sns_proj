import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import { handleApiError } from "@/lib/utils/error-handler";
import type { UserWithStats } from "@/lib/types";

/**
 * @file route.ts
 * @description 사용자 정보 조회 API
 *
 * GET /api/users/[userId]
 * - 개별 사용자 정보 조회
 * - user_stats 뷰에서 통계 정보 조회
 * - 인증된 사용자의 팔로우 상태 확인 (isFollowing)
 * - UserWithStats 형식으로 응답 반환
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    // URL 파라미터에서 userId 추출
    const { userId } = await params;

    if (!userId) {
      const apiError = handleApiError(new Error("userId is required"), 400);
      return NextResponse.json(
        {
          error: apiError.message,
          ...(apiError.code && { code: apiError.code }),
        },
        { status: apiError.status }
      );
    }

    const supabase = createClerkSupabaseClient();

    // user_stats 뷰에서 사용자 통계 조회
    const { data: statsData, error: statsError } = await supabase
      .from("user_stats")
      .select("user_id, clerk_id, name, posts_count, followers_count, following_count")
      .eq("user_id", userId)
      .single();

    if (statsError || !statsData) {
      const apiError = handleApiError(statsError || new Error("User not found"), 404);
      console.error("User stats error:", statsError);
      return NextResponse.json(
        {
          error: apiError.message,
          ...(apiError.details && { details: apiError.details }),
          ...(apiError.code && { code: apiError.code }),
        },
        { status: apiError.status }
      );
    }

    // users 테이블에서 사용자 기본 정보 조회 (created_at 등)
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, clerk_id, name, created_at")
      .eq("id", userId)
      .single();

    if (userError || !userData) {
      const apiError = handleApiError(userError || new Error("User not found"), 404);
      console.error("User fetch error:", userError);
      return NextResponse.json(
        {
          error: apiError.message,
          ...(apiError.details && { details: apiError.details }),
          ...(apiError.code && { code: apiError.code }),
        },
        { status: apiError.status }
      );
    }

    // 인증된 사용자의 팔로우 상태 확인
    const { userId: clerkUserId } = await auth();
    let isFollowing = false;

    if (clerkUserId) {
      // Clerk user ID를 Supabase user_id로 변환
      const { data: currentUserData } = await supabase
        .from("users")
        .select("id")
        .eq("clerk_id", clerkUserId)
        .single();

      if (currentUserData && currentUserData.id !== userId) {
        // 자기 자신이 아닌 경우에만 팔로우 상태 확인
        const { data: followData } = await supabase
          .from("follows")
          .select("id")
          .eq("follower_id", currentUserData.id)
          .eq("following_id", userId)
          .single();

        if (followData) {
          isFollowing = true;
        }
      }
    }

    // UserWithStats 형식으로 응답 반환
    const user: UserWithStats & { isFollowing?: boolean } = {
      id: userData.id,
      clerk_id: userData.clerk_id,
      name: userData.name,
      created_at: userData.created_at,
      posts_count: statsData.posts_count || 0,
      followers_count: statsData.followers_count || 0,
      following_count: statsData.following_count || 0,
      ...(clerkUserId && { isFollowing }),
    };

    return NextResponse.json({ data: user });
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

