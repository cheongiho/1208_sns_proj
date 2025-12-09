/**
 * @file page.tsx
 * @description 프로필 페이지
 *
 * Instagram 스타일의 프로필 페이지
 * - 사용자 정보 및 통계 표시
 * - 게시물 그리드 표시
 * - PostModal 통합
 */

import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import ProfileHeader from "@/components/profile/ProfileHeader";
import PostGrid from "@/components/profile/PostGrid";
import ProfilePageClient from "@/components/profile/ProfilePageClient";
import type { UserWithStats, PostWithUserAndStats } from "@/lib/types";

interface ProfilePageProps {
  params: Promise<{ userId: string }>;
}

async function fetchUserData(userId: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const response = await fetch(`${baseUrl}/api/users/${userId}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null; // 사용자 없음
      }
      throw new Error("Failed to fetch user data");
    }

    const data = await response.json();
    return data.data as UserWithStats & { isFollowing?: boolean };
  } catch (error) {
    console.error("Fetch user error:", error);
    throw error;
  }
}

async function fetchUserPosts(userId: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const response = await fetch(`${baseUrl}/api/posts?userId=${userId}&limit=1000`, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch posts");
    }

    const data = await response.json();
    return data.data as PostWithUserAndStats[];
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

