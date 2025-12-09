/**
 * @file page.tsx
 * @description 홈 피드 페이지
 *
 * Instagram 스타일의 게시물 피드
 * - PostFeed 컴포넌트 통합
 * - 배경색: #FAFAFA (레이아웃에서 이미 설정됨)
 */

import PostFeed from "@/components/post/PostFeed";

export default function HomePage() {
  return (
    <div className="w-full">
      <PostFeed />
    </div>
  );
}


