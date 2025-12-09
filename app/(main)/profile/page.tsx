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

  if (userError || !userData) {
    // 사용자가 없으면 홈으로 리다이렉트 (또는 에러 페이지)
    redirect("/");
  }

  // 본인 프로필로 리다이렉트
  redirect(`/profile/${userData.id}`);
}

