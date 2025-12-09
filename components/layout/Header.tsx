"use client";

/**
 * @file Header.tsx
 * @description Mobile 전용 헤더 컴포넌트
 *
 * 특징:
 * - Mobile (< 768px)에서만 표시
 * - 높이: 60px
 * - 로고 + 알림/DM/프로필 아이콘
 */

import Link from "next/link";
import { Bell, MessageCircle, User } from "lucide-react";
import { UserButton } from "@clerk/nextjs";

export default function Header() {
  return (
    <header className="md:hidden fixed top-0 left-0 right-0 h-[60px] bg-white border-b border-[#dbdbdb] z-50 flex items-center justify-between px-4">
      {/* 좌측: 로고 */}
      <Link href="/" className="flex items-center">
        <h1 className="text-xl font-bold text-[#262626]">Instagram</h1>
      </Link>

      {/* 우측: 아이콘 버튼들 */}
      <div className="flex items-center gap-4">
        {/* 알림 (1차 MVP 제외이지만 UI 준비) */}
        <button
          className="p-2 min-w-[44px] min-h-[44px] hover:bg-gray-50 active:bg-gray-100 rounded-lg transition-colors duration-150 touch-manipulation"
          aria-label="알림"
        >
          <Bell className="w-6 h-6 text-[#262626]" />
        </button>

        {/* DM (1차 MVP 제외이지만 UI 준비) */}
        <button
          className="p-2 min-w-[44px] min-h-[44px] hover:bg-gray-50 active:bg-gray-100 rounded-lg transition-colors duration-150 touch-manipulation"
          aria-label="메시지"
        >
          <MessageCircle className="w-6 h-6 text-[#262626]" />
        </button>

        {/* 프로필 */}
        <UserButton
          appearance={{
            elements: {
              avatarBox: "w-6 h-6",
            },
          }}
        />
      </div>
    </header>
  );
}


