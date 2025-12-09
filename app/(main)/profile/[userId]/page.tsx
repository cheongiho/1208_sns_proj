/**
 * @file page.tsx
 * @description 프로필 페이지
 *
 * Instagram 스타일의 프로필 페이지
 * - 사용자 정보 및 통계 표시
 * - 게시물 그리드 표시
 * - PostModal 통합
 */

import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import ProfileHeader from "@/components/profile/ProfileHeader";
import ProfilePageClient from "@/components/profile/ProfilePageClient";
import type { UserWithStats, PostWithUserAndStats } from "@/lib/types";

interface ProfilePageProps {
  params: Promise<{ userId: string }>;
}

async function fetchUserData(userId: string) {
  try {
    const supabase = createClerkSupabaseClient();

    // user_stats 뷰에서 사용자 통계 조회
    const { data: statsData, error: statsError } = await supabase
      .from("user_stats")
      .select("user_id, clerk_id, name, posts_count, followers_count, following_count")
      .eq("user_id", userId)
      .single();

    if (statsError || !statsData) {
      return null; // 사용자 없음
    }

    // users 테이블에서 사용자 기본 정보 조회
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, clerk_id, name, created_at")
      .eq("id", userId)
      .single();

    if (userError || !userData) {
      return null; // 사용자 없음
    }

    // 인증된 사용자의 팔로우 상태 확인
    const { userId: clerkUserId } = await auth();
    let isFollowing = false;

    if (clerkUserId) {
      const { data: currentUserData } = await supabase
        .from("users")
        .select("id")
        .eq("clerk_id", clerkUserId)
        .single();

      if (currentUserData && currentUserData.id !== userId) {
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

    // UserWithStats 형식으로 반환
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

    return user;
  } catch (error) {
    console.error("Fetch user error:", error);
    return null;
  }
}

async function fetchUserPosts(userId: string) {
  try {
    const supabase = createClerkSupabaseClient();

    // posts 테이블 조회
    const { data: postsData, error: postsError } = await supabase
      .from("posts")
      .select("id, user_id, image_url, caption, created_at, updated_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1000);

    if (postsError) {
      console.error("Posts fetch error:", postsError);
      return [];
    }

    if (!postsData || postsData.length === 0) {
      return [];
    }

    // post_ids 추출
    const postIds = postsData.map((post) => post.id);

    // post_stats 뷰에서 통계 정보 조회
    const { data: statsData } = await supabase
      .from("post_stats")
      .select("post_id, likes_count, comments_count")
      .in("post_id", postIds);

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

    // user_ids 추출 (이미 userId로 필터링했으므로 하나만)
    const { data: userData } = await supabase
      .from("users")
      .select("id, clerk_id, name, created_at")
      .eq("id", userId)
      .single();

    // 인증된 사용자의 좋아요 상태 확인
    const { userId: clerkUserId } = await auth();
    let likedPostIds: Set<string> = new Set();

    if (clerkUserId && userData) {
      const { data: currentUserData } = await supabase
        .from("users")
        .select("id")
        .eq("clerk_id", clerkUserId)
        .single();

      if (currentUserData) {
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
      const stats = statsMap.get(item.id) || { likes_count: 0, comments_count: 0 };

      return {
        id: item.id,
        user_id: item.user_id,
        image_url: item.image_url,
        caption: item.caption,
        created_at: item.created_at,
        updated_at: item.updated_at,
        user: {
          id: userData?.id || item.user_id,
          clerk_id: userData?.clerk_id || "",
          name: userData?.name || "Unknown",
          created_at: userData?.created_at || item.created_at,
        },
        likes_count: stats.likes_count,
        comments_count: stats.comments_count,
        isLiked: likedPostIds.has(item.id),
      };
    });

    return posts;
  } catch (error) {
    console.error("Fetch posts error:", error);
    return [];
  }
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { userId } = await params;
  const { userId: clerkUserId } = await auth();

  // 사용자 정보 및 게시물 목록 병렬 로딩
  const [userData, posts] = await Promise.all([
    fetchUserData(userId),
    fetchUserPosts(userId),
  ]);

  // 사용자가 없으면 404 또는 에러 처리
  if (!userData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <h1 className="text-2xl font-semibold text-[#262626] mb-2">
          사용자를 찾을 수 없습니다
        </h1>
        <p className="text-sm text-[#8e8e8e]">
          요청하신 사용자가 존재하지 않거나 삭제되었습니다.
        </p>
      </div>
    );
  }

  // 본인 프로필 여부 확인
  let isOwnProfile = false;
  if (clerkUserId) {
    // Clerk user ID를 Supabase user_id로 변환하여 확인
    // 또는 userData.clerk_id와 직접 비교
    isOwnProfile = userData.clerk_id === clerkUserId;
  }

  return (
    <div className="w-full bg-white">
      <ProfileHeader user={userData} isOwnProfile={isOwnProfile} />
      <ProfilePageClient posts={posts} />
    </div>
  );
}

