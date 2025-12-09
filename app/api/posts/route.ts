import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import { handleApiError } from "@/lib/utils/error-handler";
import type { PostWithUserAndStats, PaginatedResponse } from "@/lib/types";

/**
 * @file route.ts
 * @description 게시물 목록 조회 및 생성 API
 *
 * GET /api/posts
 * - 쿼리 파라미터: limit, offset, userId
 * - 시간 역순 정렬
 * - post_stats 뷰 사용하여 좋아요/댓글 수 포함
 *
 * POST /api/posts
 * - 게시물 생성
 * - Clerk 인증 검증
 * - imageUrl 및 caption 검증
 * - posts 테이블에 데이터 저장
 */

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const userId = searchParams.get("userId");

    const supabase = createClerkSupabaseClient();

    // posts 테이블 조회
    let query = supabase
      .from("posts")
      .select("id, user_id, image_url, caption, created_at, updated_at", {
        count: "exact",
      })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // userId가 제공된 경우 필터링
    if (userId) {
      query = query.eq("user_id", userId);
    }

    const { data: postsData, error: postsError, count } = await query;

    if (postsError) {
      const apiError = handleApiError(postsError, 500);
      console.error("Supabase error:", postsError);
      return NextResponse.json(
        {
          error: apiError.message,
          ...(apiError.details && { details: apiError.details }),
          ...(apiError.code && { code: apiError.code }),
        },
        { status: apiError.status }
      );
    }

    if (!postsData || postsData.length === 0) {
      return NextResponse.json({
        data: [],
        hasMore: false,
        total: count || 0,
      });
    }

    // post_ids 추출
    const postIds = postsData.map((post) => post.id);

    // post_stats 뷰에서 통계 정보 조회
    const { data: statsData, error: statsError } = await supabase
      .from("post_stats")
      .select("post_id, likes_count, comments_count")
      .in("post_id", postIds);

    if (statsError) {
      console.error("Stats error:", statsError);
      // 통계 조회 실패해도 게시물은 반환
    }

    // 통계 데이터를 맵으로 변환
    const statsMap = new Map(
      (statsData || []).map((stat) => [
        stat.post_id,
        {
          likes_count: stat.likes_count || 0,
          comments_count: stat.comments_count || 0,
        },
      ])
    );

    // user_ids 추출
    const userIds = [...new Set(postsData.map((post) => post.user_id))];

    // users 테이블에서 사용자 정보 조회
    const { data: usersData, error: usersError } = await supabase
      .from("users")
      .select("id, clerk_id, name, created_at")
      .in("id", userIds);

    if (usersError) {
      console.error("Users error:", usersError);
      // 사용자 조회 실패해도 게시물은 반환
    }

    // 사용자 데이터를 맵으로 변환
    const usersMap = new Map(
      (usersData || []).map((user) => [user.id, user])
    );

    // 인증된 사용자의 좋아요 상태 확인
    const { userId: clerkUserId } = await auth();
    let likedPostIds: Set<string> = new Set();

    if (clerkUserId) {
      // Clerk user ID를 Supabase user_id로 변환
      const { data: currentUserData } = await supabase
        .from("users")
        .select("id")
        .eq("clerk_id", clerkUserId)
        .single();

      if (currentUserData) {
        // 현재 사용자가 좋아요를 눌렀는지 확인
        const { data: likesData } = await supabase
          .from("likes")
          .select("post_id")
          .eq("user_id", currentUserData.id)
          .in("post_id", postIds);

        if (likesData) {
          likedPostIds = new Set(likesData.map((like) => like.post_id));
        }
      }
    }

    // 데이터 변환: PostWithUserAndStats 형식으로
    const posts: PostWithUserAndStats[] = postsData.map((item) => {
      const user = usersMap.get(item.user_id);
      const stats = statsMap.get(item.id) || { likes_count: 0, comments_count: 0 };

      return {
        id: item.id,
        user_id: item.user_id,
        image_url: item.image_url,
        caption: item.caption,
        created_at: item.created_at,
        updated_at: item.updated_at,
        user: {
          id: user?.id || item.user_id,
          clerk_id: user?.clerk_id || "",
          name: user?.name || "Unknown",
          created_at: user?.created_at || item.created_at,
        },
        likes_count: stats.likes_count,
        comments_count: stats.comments_count,
        isLiked: likedPostIds.has(item.id),
      };
    });

    // 더 많은 게시물이 있는지 확인
    const hasMore = count ? offset + limit < count : false;

    const response: PaginatedResponse<PostWithUserAndStats> = {
      data: posts,
      hasMore,
      total: count || undefined,
    };

    return NextResponse.json(response);
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
    const { imageUrl, caption } = body;

    // 필수 필드 검증
    if (!imageUrl || typeof imageUrl !== "string") {
      const apiError = handleApiError(new Error("imageUrl is required and must be a string"), 400);
      return NextResponse.json(
        {
          error: apiError.message,
          ...(apiError.code && { code: apiError.code }),
        },
        { status: apiError.status }
      );
    }

    // imageUrl 유효성 검증 (URL 형식 확인)
    try {
      new URL(imageUrl);
    } catch {
      const apiError = handleApiError(new Error("imageUrl must be a valid URL"), 400);
      return NextResponse.json(
        {
          error: apiError.message,
          ...(apiError.code && { code: apiError.code }),
        },
        { status: apiError.status }
      );
    }

    // caption 유효성 검증 (선택적이지만 제공된 경우 검증)
    let finalCaption: string | null = null;
    if (caption !== undefined && caption !== null) {
      if (typeof caption !== "string") {
        const apiError = handleApiError(new Error("caption must be a string"), 400);
        return NextResponse.json(
          {
            error: apiError.message,
            ...(apiError.code && { code: apiError.code }),
          },
          { status: apiError.status }
        );
      }

      const trimmedCaption = caption.trim();
      // 최대 길이 검증 (Instagram은 2,200자)
      const MAX_CAPTION_LENGTH = 2200;
      if (trimmedCaption.length > MAX_CAPTION_LENGTH) {
        const apiError = handleApiError(
          new Error(`캡션은 ${MAX_CAPTION_LENGTH}자 이하여야 합니다`),
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

      // 빈 문자열이면 null로 저장
      finalCaption = trimmedCaption.length > 0 ? trimmedCaption : null;
    }

    const supabase = createClerkSupabaseClient();

    // Clerk user ID를 Supabase user_id로 변환
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, clerk_id, name, created_at")
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

    // 게시물 삽입
    const { data: postData, error: postError } = await supabase
      .from("posts")
      .insert({
        user_id: userData.id,
        image_url: imageUrl,
        caption: finalCaption,
      })
      .select()
      .single();

    if (postError) {
      const apiError = handleApiError(postError, 500);
      console.error("Supabase error:", postError);
      return NextResponse.json(
        {
          error: apiError.message,
          ...(apiError.details && { details: apiError.details }),
          ...(apiError.code && { code: apiError.code }),
        },
        { status: apiError.status }
      );
    }

    // PostWithUserAndStats 형식으로 응답 반환
    const post: PostWithUserAndStats = {
      id: postData.id,
      user_id: postData.user_id,
      image_url: postData.image_url,
      caption: postData.caption,
      created_at: postData.created_at,
      updated_at: postData.updated_at,
      user: {
        id: userData.id,
        clerk_id: userData.clerk_id,
        name: userData.name,
        created_at: userData.created_at,
      },
      likes_count: 0,
      comments_count: 0,
      isLiked: false,
    };

    return NextResponse.json({ success: true, data: post });
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

