import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import type { PostWithUserAndStats, PaginatedResponse } from "@/lib/types";

/**
 * @file route.ts
 * @description 게시물 목록 조회 API
 *
 * GET /api/posts
 * - 쿼리 파라미터: limit, offset, userId
 * - 시간 역순 정렬
 * - post_stats 뷰 사용하여 좋아요/댓글 수 포함
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
      console.error("Supabase error:", postsError);
      return NextResponse.json(
        { error: "Failed to fetch posts", details: postsError.message },
        { status: 500 }
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
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

