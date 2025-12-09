/**
 * @file page.tsx
 * @description 본인 프로필 리다이렉트 페이지
 *
 * /profile 접근 시 본인 프로필로 리다이렉트
 * - Clerk user ID를 Supabase user_id로 변환
 * - /profile/[userId]로 리다이렉트
 */

import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";

export default async function ProfileRedirectPage() {
  const { userId: clerkUserId } = await auth();

  // 인증되지 않은 사용자는 로그인 페이지로 리다이렉트
  if (!clerkUserId) {
    redirect("/sign-in");
  }

  // Clerk user ID를 Supabase user_id로 변환
  const supabase = createClerkSupabaseClient();
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("id")
    .eq("clerk_id", clerkUserId)
    .single();

  // 사용자가 없으면 동기화 시도
  if (userError || !userData) {
    try {
      // /api/sync-user를 호출하여 사용자 동기화
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
      const syncResponse = await fetch(`${baseUrl}/api/sync-user`, {
        method: "POST",
        cache: "no-store",
      });

      if (syncResponse.ok) {
        // 동기화 성공 후 다시 조회
        const syncResult = await syncResponse.json();
        if (syncResult.user) {
          userData = { id: syncResult.user.id };
        } else {
          // 동기화는 성공했지만 데이터가 없으면 다시 조회
          const retryResult = await supabase
            .from("users")
            .select("id")
            .eq("clerk_id", clerkUserId)
            .single();
          
          if (retryResult.data) {
            userData = retryResult.data;
          }
        }
      }
    } catch (syncError) {
      console.error("Sync user error:", syncError);
    }

    // 여전히 사용자가 없으면 홈으로 리다이렉트
    if (!userData) {
      redirect("/");
    }
  }

  // 본인 프로필로 리다이렉트
  redirect(`/profile/${userData.id}`);
}

