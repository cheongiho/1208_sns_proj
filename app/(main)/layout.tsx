/**
 * @file layout.tsx
 * @description 메인 레이아웃 (Instagram 스타일)
 *
 * 반응형 레이아웃 구조:
 * - Desktop (1024px+): Sidebar (244px) + Main Content (최대 630px 중앙 정렬)
 * - Tablet (768px ~ 1023px): Icon-only Sidebar (72px) + Main Content
 * - Mobile (< 768px): Header (60px) + Main Content + BottomNav (50px)
 *
 * 배경색: #FAFAFA (Instagram 배경색)
 */

import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Sidebar: Desktop/Tablet에서만 표시 */}
      <Sidebar />

      {/* Header: Mobile에서만 표시 */}
      <Header />

      {/* Main Content */}
      <main
        className="
          md:ml-[72px] 
          lg:ml-[244px] 
          pt-[60px] 
          md:pt-0 
          pb-[50px] 
          md:pb-0
          min-h-screen
        "
      >
        <div className="max-w-[630px] mx-auto px-4 py-4 md:py-8">
          {children}
        </div>
      </main>

      {/* BottomNav: Mobile에서만 표시 */}
      <BottomNav />
    </div>
  );
}


