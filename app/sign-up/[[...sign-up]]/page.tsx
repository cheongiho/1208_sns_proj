/**
 * @file page.tsx
 * @description 회원가입 페이지
 *
 * Clerk의 SignUp 컴포넌트를 사용한 회원가입 페이지
 * - Instagram 스타일 디자인
 * - 한국어 로컬라이제이션
 * - 회원가입 후 홈으로 리다이렉트
 */

import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fafafa] px-4">
      <SignUp
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "shadow-none border border-[#dbdbdb] rounded-lg",
            headerTitle: "text-2xl font-semibold text-[#262626]",
            headerSubtitle: "text-sm text-[#8e8e8e]",
            formButtonPrimary:
              "bg-[#0095f6] hover:bg-[#0095f6]/90 text-white font-semibold",
            formFieldInput:
              "border border-[#dbdbdb] rounded-md focus:border-[#0095f6] focus:ring-1 focus:ring-[#0095f6]",
            footerActionLink: "text-[#0095f6] hover:text-[#0095f6]/80",
            socialButtonsBlockButton:
              "border border-[#dbdbdb] hover:bg-gray-50",
          },
        }}
        routing="path"
        path="/sign-up"
        redirectUrl="/"
        signInUrl="/sign-in"
      />
    </div>
  );
}

