"use client";

/**
 * @file BottomNav.tsx
 * @description Mobile 전용 하단 네비게이션 컴포넌트
 *
 * 특징:
 * - Mobile (< 768px)에서만 표시
 * - 높이: 50px
 * - 5개 아이콘: 홈, 검색, 만들기, 좋아요, 프로필
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Plus, Heart, User } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useState } from "react";

export default function BottomNav() {
  const pathname = usePathname();
  const { user } = useUser();
  const [showCreateModal, setShowCreateModal] = useState(false);

  // 프로필 경로 확인
  const isProfileActive = pathname?.startsWith("/profile");

  // Active 상태 확인 함수
  const isActive = (path: string) => {
    if (path === "/profile") {
      return isProfileActive;
    }
    return pathname === path;
  };

  // 프로필 링크 생성
  const getProfileLink = () => {
    // user가 로드되지 않았거나 id가 없으면 기본 경로
    if (!user?.id) {
      return "/profile";
    }
    return `/profile/${user.id}`;
  };

  // 메뉴 항목 정의
  const menuItems = [
    {
      icon: Home,
      label: "홈",
      href: "/",
      active: isActive("/"),
    },
    {
      icon: Search,
      label: "검색",
      href: "/search",
      active: isActive("/search"),
    },
    {
      icon: Plus,
      label: "만들기",
      href: "#",
      onClick: () => {
        // 추후 CreatePostModal 열기
        setShowCreateModal(true);
      },
    },
    {
      icon: Heart,
      label: "좋아요",
      href: "/activity",
      active: isActive("/activity"),
    },
    {
      icon: User,
      label: "프로필",
      href: getProfileLink(),
      active: isProfileActive,
    },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-[50px] bg-white border-t border-[#dbdbdb] z-50 flex items-center justify-around">
      {menuItems.map((item) => {
        const Icon = item.icon;
        const isItemActive = item.active;

        if (item.href === "#") {
          return (
            <button
              key={item.label}
              onClick={item.onClick}
              className="flex items-center justify-center w-full h-full min-h-[44px] hover:bg-gray-50 active:bg-gray-100 transition-colors duration-150 touch-manipulation focus:outline-none focus:ring-2 focus:ring-[#0095f6] focus:ring-offset-2 rounded"
              aria-label={item.label}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  item.onClick?.();
                }
              }}
            >
              <Icon
                className={`w-6 h-6 transition-transform duration-150 ${
                  isItemActive
                    ? "text-[#262626] scale-110"
                    : "text-[#8e8e8e]"
                }`}
              />
            </button>
          );
        }

        return (
          <Link
            key={item.label}
            href={item.href}
            className="flex items-center justify-center w-full h-full min-h-[44px] hover:bg-gray-50 active:bg-gray-100 transition-colors duration-150 touch-manipulation focus:outline-none focus:ring-2 focus:ring-[#0095f6] focus:ring-offset-2 rounded"
            aria-label={item.label}
            aria-current={isItemActive ? "page" : undefined}
          >
            <Icon
              className={`w-6 h-6 transition-transform duration-150 ${
                isItemActive ? "text-[#262626] scale-110" : "text-[#8e8e8e]"
              }`}
            />
          </Link>
        );
      })}
    </nav>
  );
}

