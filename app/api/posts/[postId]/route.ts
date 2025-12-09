import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { handleApiError } from "@/lib/utils/error-handler";
import type { PostWithUserAndStats } from "@/lib/types";

/**
 * @file route.ts
 * @description 게시물 단일 조회 및 삭제 API
 *
 * GET /api/posts/[postId]
 * - 개별 게시물 조회
 * - 게시물 정보, 사용자 정보, 통계 정보 포함
 * - 인증된 사용자의 좋아요 상태 확인 (isLiked)
 *
 * DELETE /api/posts/[postId]
 * - 개별 게시물 삭제
 * - 본인만 삭제 가능 (소유자 확인)
 * - Clerk 인증 검증
 * - Supabase Storage에서 이미지 파일 삭제
 * - 데이터베이스에서 게시물 레코드 삭제 (CASCADE로 관련 likes, comments 자동 삭제)
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    // URL 파라미터에서 postId 추출
    const { postId } = await params;

    if (!postId) {
      const apiError = handleApiError(new Error("postId is required"), 400);
      return NextResponse.json(
        {
          error: apiError.message,
          ...(apiError.code && { code: apiError.code }),
        },
        { status: apiError.status }
      );
    }

    const supabase = createClerkSupabaseClient();

    // 게시물 정보 조회
    const { data: postData, error: postError } = await supabase
      .from("posts")
      .select("id, user_id, image_url, caption, created_at, updated_at")
      .eq("id", postId)
      .single();

    if (postError || !postData) {
      const apiError = handleApiError(postError || new Error("Post not found"), 404);
      console.error("Post fetch error:", postError);
      return NextResponse.json(
        {
          error: apiError.message,
          ...(apiError.details && { details: apiError.details }),
          ...(apiError.code && { code: apiError.code }),
        },
        { status: apiError.status }
      );
    }

    // post_stats 뷰에서 통계 정보 조회
    const { data: statsData, error: statsError } = await supabase
      .from("post_stats")
      .select("post_id, likes_count, comments_count")
      .eq("post_id", postId)
      .single();

    if (statsError) {
      console.error("Stats error:", statsError);
      // 통계 조회 실패해도 게시물은 반환
    }

    const stats = statsData || { likes_count: 0, comments_count: 0 };

    // 사용자 정보 조회
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, clerk_id, name, created_at")
      .eq("id", postData.user_id)
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

    // 인증된 사용자의 좋아요 상태 확인
    const { userId: clerkUserId } = await auth();
    let isLiked = false;

    if (clerkUserId) {
      // Clerk user ID를 Supabase user_id로 변환
      const { data: currentUserData } = await supabase
        .from("users")
        .select("id")
        .eq("clerk_id", clerkUserId)
        .single();

      if (currentUserData) {
        // 현재 사용자가 좋아요를 눌렀는지 확인
        const { data: likeData } = await supabase
          .from("likes")
          .select("id")
          .eq("post_id", postId)
          .eq("user_id", currentUserData.id)
          .single();

        if (likeData) {
          isLiked = true;
        }
      }
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
      likes_count: stats.likes_count || 0,
      comments_count: stats.comments_count || 0,
      isLiked,
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

/**
 * Storage URL에서 파일 경로 추출
 * URL 형식: https://{supabase_url}/storage/v1/object/public/posts/{clerk_id}/{filename}
 * 추출할 경로: {clerk_id}/{filename}
 */
function extractFilePathFromUrl(imageUrl: string): string | null {
  try {
    const url = new URL(imageUrl);
    // /storage/v1/object/public/posts/ 이후 부분 추출
    const pathMatch = url.pathname.match(/\/storage\/v1\/object\/public\/posts\/(.+)/);
    if (pathMatch && pathMatch[1]) {
      return pathMatch[1];
    }
    return null;
  } catch (error) {
    console.error("Error extracting file path from URL:", error);
    return null;
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
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

    // URL 파라미터에서 postId 추출
    const { postId } = await params;

    if (!postId) {
      const apiError = handleApiError(new Error("postId is required"), 400);
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

    // 게시물 조회 및 소유자 확인
    const { data: postData, error: postFetchError } = await supabase
      .from("posts")
      .select("id, user_id, image_url")
      .eq("id", postId)
      .single();

    if (postFetchError || !postData) {
      const apiError = handleApiError(postFetchError || new Error("Post not found"), 404);
      console.error("Post fetch error:", postFetchError);
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
    if (postData.user_id !== userId) {
      const apiError = handleApiError(new Error("Forbidden: You can only delete your own posts"), 403);
      return NextResponse.json(
        {
          error: apiError.message,
          ...(apiError.code && { code: apiError.code }),
        },
        { status: apiError.status }
      );
    }

    // Storage에서 이미지 파일 삭제
    const filePath = extractFilePathFromUrl(postData.image_url);
    if (filePath) {
      const serviceRoleClient = getServiceRoleClient();
      const { error: storageError } = await serviceRoleClient.storage
        .from("posts")
        .remove([filePath]);

      if (storageError) {
        console.error("Storage delete error:", storageError);
        // Storage 삭제 실패해도 DB 삭제는 진행 (이미지가 이미 삭제되었을 수 있음)
        // 하지만 로그는 남김
      } else {
        console.log(`Successfully deleted image from storage: ${filePath}`);
      }
    } else {
      console.warn(`Could not extract file path from image URL: ${postData.image_url}`);
    }

    // 데이터베이스에서 게시물 삭제
    // ON DELETE CASCADE로 관련 likes, comments 자동 삭제됨
    const { error: deleteError } = await supabase
      .from("posts")
      .delete()
      .eq("id", postId)
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

