import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";

/**
 * @file route.ts
 * @description 게시물 삭제 API
 *
 * DELETE /api/posts/[postId]
 * - 개별 게시물 삭제
 * - 본인만 삭제 가능 (소유자 확인)
 * - Clerk 인증 검증
 * - Supabase Storage에서 이미지 파일 삭제
 * - 데이터베이스에서 게시물 레코드 삭제 (CASCADE로 관련 likes, comments 자동 삭제)
 */

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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // URL 파라미터에서 postId 추출
    const { postId } = await params;

    if (!postId) {
      return NextResponse.json(
        { error: "postId is required" },
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

    // 게시물 조회 및 소유자 확인
    const { data: postData, error: postFetchError } = await supabase
      .from("posts")
      .select("id, user_id, image_url")
      .eq("id", postId)
      .single();

    if (postFetchError || !postData) {
      console.error("Post fetch error:", postFetchError);
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      );
    }

    // 소유자 확인 (본인만 삭제 가능)
    if (postData.user_id !== userId) {
      return NextResponse.json(
        { error: "Forbidden: You can only delete your own posts" },
        { status: 403 }
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
      console.error("Supabase delete error:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete post", details: deleteError.message },
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

