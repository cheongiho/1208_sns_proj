"use client";

/**
 * @file Sidebar.tsx
 * @description Instagram 스타일 사이드바 컴포넌트
 *
 * 반응형 동작:
 * - Desktop (1024px+): 244px 너비, 아이콘 + 텍스트
 * - Tablet (768px ~ 1023px): 72px 너비, 아이콘만
 * - Mobile (< 768px): 숨김
 *
 * 메뉴 항목:
 * - 홈, 검색, 만들기, 프로필
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Plus, User } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useState } from "react";
import CreatePostModal from "@/components/post/CreatePostModal";
import type { PostWithUserAndStats } from "@/lib/types";

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useUser();
  const [showCreateModal, setShowCreateModal] = useState(false);

  // 프로필 경로 확인 (본인 프로필 또는 다른 사용자 프로필)
  const isProfileActive = pathname?.startsWith("/profile");

  // Active 상태 확인 함수
  const isActive = (path: string) => {
    if (path === "/profile") {
      return isProfileActive;
    }
    return pathname === path;
  };

  // 프로필 링크 생성 (본인 프로필로 이동)
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
      icon: User,
      label: "프로필",
      href: getProfileLink(),
      active: isProfileActive,
    },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen bg-white border-r border-[#dbdbdb] z-40 hidden md:block transition-all duration-300">
      {/* Desktop: 244px 너비, 아이콘 + 텍스트 */}
      <div className="w-[244px] lg:block hidden h-full">
        <div className="flex flex-col p-4 gap-1">
          {/* 로고 영역 (추후 추가 가능) */}
          <div className="h-16 flex items-center mb-4">
            <h1 className="text-2xl font-bold text-[#262626]">Instagram</h1>
          </div>

          {/* 메뉴 항목 */}
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isItemActive = item.active;

            if (item.href === "#") {
              return (
                <button
                  key={item.label}
                  onClick={item.onClick}
                  className="flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors text-left w-full focus:outline-none focus:ring-2 focus:ring-[#0095f6] focus:ring-offset-2 rounded-lg"
                  aria-label={item.label}
                >
                  <Icon
                    className={`w-6 h-6 ${
                      isItemActive
                        ? "text-[#262626]"
                        : "text-[#262626]"
                    }`}
                  />
                  <span
                    className={`text-base ${
                      isItemActive
                        ? "font-bold text-[#262626]"
                        : "font-normal text-[#262626]"
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              );
            }

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[#0095f6] focus:ring-offset-2 rounded-lg ${
                  isItemActive ? "bg-gray-50" : ""
                }`}
                aria-label={item.label}
                aria-current={isItemActive ? "page" : undefined}
              >
                <Icon
                  className={`w-6 h-6 ${
                    isItemActive
                      ? "text-[#262626]"
                      : "text-[#262626]"
                  }`}
                />
                <span
                  className={`text-base ${
                    isItemActive
                      ? "font-bold text-[#262626]"
                      : "font-normal text-[#262626]"
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Tablet: 72px 너비, 아이콘만 */}
      <div className="w-[72px] md:block lg:hidden h-full">
        <div className="flex flex-col items-center p-2 gap-1">
          {/* 메뉴 항목 (아이콘만) */}
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isItemActive = item.active;

            if (item.href === "#") {
              return (
                <button
                  key={item.label}
                  onClick={item.onClick}
                  className="flex items-center justify-center w-12 h-12 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-[#0095f6] focus:ring-offset-2 rounded-lg"
                  title={item.label}
                  aria-label={item.label}
                >
                  <Icon
                    className={`w-6 h-6 ${
                      isItemActive
                        ? "text-[#262626]"
                        : "text-[#262626]"
                    }`}
                  />
                </button>
              );
            }

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center justify-center w-12 h-12 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors duration-150 touch-manipulation focus:outline-none focus:ring-2 focus:ring-[#0095f6] focus:ring-offset-2 rounded-lg ${
                  isItemActive ? "bg-gray-50" : ""
                }`}
                title={item.label}
                aria-label={item.label}
                aria-current={isItemActive ? "page" : undefined}
              >
                <Icon
                  className={`w-6 h-6 ${
                    isItemActive
                      ? "text-[#262626]"
                      : "text-[#262626]"
                  }`}
                />
              </Link>
            );
          })}
        </div>
      </div>

      {/* CreatePostModal */}
      <CreatePostModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onPostCreated={(post) => {
          // 게시물 생성 성공 시 모달 닫기
          setShowCreateModal(false);
          // 페이지 새로고침하여 새 게시물 표시 (선택적)
          // window.location.reload();
        }}
      />
    </aside>
  );
}

