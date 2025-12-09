- [ ] `.cursor/` 디렉토리
  - [ ] `rules/` 커서룰
  - [ ] `mcp.json` MCP 서버 설정
  - [ ] `dir.md` 프로젝트 디렉토리 구조
- [ ] `.github/` 디렉토리
- [ ] `.husky/` 디렉토리
- [ ] `app/` 디렉토리
  - [ ] `favicon.ico` 파일
  - [x] `not-found.tsx` 파일
  - [x] `robots.ts` 파일
  - [x] `sitemap.ts` 파일
  - [x] `manifest.ts` 파일
- [ ] `supabase/` 디렉토리
- [ ] `public/` 디렉토리
  - [ ] `icons/` 디렉토리
  - [ ] `logo.png` 파일
  - [ ] `og-image.png` 파일
- [x] `tsconfig.json` 파일
- [x] `.cursorignore` 파일
- [x] `.gitignore` 파일
- [x] `.prettierignore` 파일
- [x] `.prettierrc` 파일
- [x] `eslint.config.mjs` 파일
- [x] `AGENTS.md` 파일


# 📋 Mini Instagram - 개발 TODO 리스트

## 1. 기본 세팅

- [x] Tailwind CSS 설정 (인스타 컬러 스키마)
  - [x] `app/globals.css`에 Instagram 컬러 변수 추가
  - [x] 타이포그래피 설정
- [x] Supabase 데이터베이스 마이그레이션
  - [x] `db.sql` 파일을 Supabase에 적용
  - [x] 테이블 생성 확인 (users, posts, likes, comments, follows)
  - [x] Views 및 Triggers 확인
- [x] Supabase Storage 버킷 생성
  - [x] `posts` 버킷 생성 (공개 읽기)
  - [x] 업로드 정책 설정
- [x] TypeScript 타입 정의
  - [x] `lib/types.ts` 파일 생성
  - [x] User, Post, Like, Comment, Follow 타입 정의

## 2. 레이아웃 구조

- [x] `app/(main)/layout.tsx` 생성
  - [x] Sidebar 통합
  - [x] 반응형 레이아웃 (Desktop/Tablet/Mobile)
- [x] `components/layout/Sidebar.tsx`
  - [x] Desktop: 244px 너비, 아이콘 + 텍스트
  - [x] Tablet: 72px 너비, 아이콘만
  - [x] Mobile: 숨김
  - [x] 메뉴 항목: 홈, 검색, 만들기, 프로필
  - [x] Hover 효과 및 Active 상태 스타일
- [x] `components/layout/Header.tsx`
  - [x] Mobile 전용 (60px 높이)
  - [x] 로고 + 알림/DM/프로필 아이콘
- [x] `components/layout/BottomNav.tsx`
  - [x] Mobile 전용 (50px 높이)
  - [x] 5개 아이콘: 홈, 검색, 만들기, 좋아요, 프로필

## 3. 홈 피드 페이지

- [x] `app/(main)/page.tsx` 생성
  - [x] PostFeed 컴포넌트 통합
  - [x] 배경색 #FAFAFA 설정
- [x] `components/post/PostCard.tsx`
  - [x] 헤더 (프로필 이미지 32px, 사용자명, 시간, ⋯ 메뉴)
  - [x] 이미지 영역 (1:1 정사각형)
  - [x] 액션 버튼 (좋아요, 댓글, 공유, 북마크)
  - [x] 좋아요 수 표시
  - [x] 캡션 (사용자명 Bold + 내용, 2줄 초과 시 "... 더 보기")
  - [x] 댓글 미리보기 (최신 2개)
- [x] `components/post/PostCardSkeleton.tsx`
  - [x] 로딩 UI (Skeleton + Shimmer 효과)
- [x] `components/post/PostFeed.tsx`
  - [x] 게시물 목록 렌더링
  - [x] 무한 스크롤 (Intersection Observer)
  - [x] 페이지네이션 (10개씩)
- [x] `app/api/posts/route.ts`
  - [x] GET: 게시물 목록 조회 (시간 역순 정렬)
  - [x] 페이지네이션 지원 (limit, offset)
  - [x] userId 파라미터 지원 (프로필 페이지용)
  - [x] 인증된 사용자의 좋아요 상태 (isLiked) 포함

## 4. 좋아요 기능

- [x] `app/api/likes/route.ts`
  - [x] POST: 좋아요 추가
  - [x] DELETE: 좋아요 제거
  - [x] 인증 검증 (Clerk)
- [x] `components/post/LikeButton.tsx`
  - [x] 빈 하트 ↔ 빨간 하트 상태 관리
  - [x] 클릭 애니메이션 (scale 1.3 → 1)
  - [x] Optimistic UI 업데이트
  - [x] 에러 처리 및 롤백
- [x] PostCard에 LikeButton 통합
  - [x] 좋아요 상태 표시
  - [x] 좋아요 수 실시간 업데이트
  - [x] 더블탭 좋아요 기능 (큰 하트 fade in/out 애니메이션)

## 5. 게시물 작성

- [x] `components/post/CreatePostModal.tsx`
  - [x] Dialog 컴포넌트 사용
  - [x] 이미지 미리보기 UI
  - [x] 텍스트 입력 필드 (최대 2,200자)
  - [x] 파일 선택 버튼
  - [x] 업로드 버튼
- [x] `app/api/posts/route.ts`
  - [x] POST: 게시물 생성
  - [x] 이미지 파일 검증 (최대 5MB)
  - [x] Supabase Storage 업로드
  - [x] posts 테이블에 데이터 저장
  - [x] 인증 검증 (Clerk)
- [x] Sidebar "만들기" 버튼 연결
  - [x] CreatePostModal 열기

## 6. 댓글 기능

- [x] `components/comment/CommentList.tsx`
  - [x] 댓글 목록 렌더링
  - [x] PostCard: 최신 2개만 표시
  - [x] 상세 모달: 전체 댓글 + 스크롤 (PostModal 구현 후)
  - [x] 삭제 버튼 (본인만 표시)
- [x] `components/comment/CommentForm.tsx`
  - [x] 댓글 입력 필드 ("댓글 달기...")
  - [x] Enter 키 또는 "게시" 버튼으로 제출
- [x] `app/api/comments/route.ts` 
  - [x] POST: 댓글 작성
  - [x] GET: 댓글 조회
  - [x] 인증 검증 (Clerk)
- [x] `app/api/comments/[commentId]/route.ts`
  - [x] DELETE: 댓글 삭제 (본인만)
  - [x] 인증 검증 (Clerk)
- [x] PostCard에 댓글 기능 통합
  - [x] CommentList 통합
  - [x] CommentForm 통합

## 7. 게시물 상세 모달

- [x] `components/post/PostModal.tsx`
  - [x] Desktop: 모달 형식 (이미지 50% + 댓글 50%)
  - [x] Mobile: 전체 페이지로 전환
  - [x] 닫기 버튼 (✕)
  - [x] 이전/다음 게시물 네비게이션 (Desktop)
- [x] PostCard 클릭 시 PostModal 열기
  - [x] 게시물 상세 정보 로드
  - [x] 댓글 전체 목록 표시

## 8. 프로필 페이지

- [x] `app/(main)/profile/[userId]/page.tsx`
  - [x] 동적 라우트 생성
  - [x] ProfileHeader 통합
  - [x] PostGrid 통합
- [x] `components/profile/ProfileHeader.tsx`
  - [x] 프로필 이미지 (150px Desktop / 90px Mobile)
  - [x] 사용자명
  - [x] 통계 (게시물 수, 팔로워 수, 팔로잉 수)
  - [x] "팔로우" / "팔로잉" 버튼 (다른 사람 프로필)
  - [x] "프로필 편집" 버튼 (본인 프로필, 1차 제외)
- [x] `components/profile/PostGrid.tsx`
  - [x] 3열 그리드 레이아웃 (반응형)
  - [x] 1:1 정사각형 썸네일
  - [x] Hover 시 좋아요/댓글 수 표시
  - [x] 클릭 시 게시물 상세 모달 열기
- [x] `app/api/users/[userId]/route.ts`
  - [x] GET: 사용자 정보 조회
  - [x] user_stats 뷰 활용
- [x] Sidebar "프로필" 버튼 연결
  - [x] `/profile`로 리다이렉트 (본인 프로필)

## 9. 팔로우 기능

- [x] `app/api/follows/route.ts`
  - [x] POST: 팔로우 추가
  - [x] DELETE: 팔로우 제거
  - [x] 인증 검증 (Clerk)
  - [x] 자기 자신 팔로우 방지
- [x] `components/profile/FollowButton.tsx`
  - [x] "팔로우" 버튼 (파란색, 미팔로우 상태)
  - [x] "팔로잉" 버튼 (회색, 팔로우 중 상태)
  - [x] Hover 시 "언팔로우" (빨간 테두리)
  - [x] 클릭 시 즉시 API 호출 및 UI 업데이트
- [x] ProfileHeader에 FollowButton 통합
  - [x] 팔로우 상태 관리
  - [x] 통계 실시간 업데이트

## 10. 게시물 삭제

- [x] `app/api/posts/[postId]/route.ts`
  - [x] DELETE: 게시물 삭제
  - [x] 본인만 삭제 가능 (인증 검증)
  - [x] Supabase Storage에서 이미지 삭제
- [x] PostCard ⋯ 메뉴
  - [x] 본인 게시물만 삭제 옵션 표시
  - [x] 삭제 확인 다이얼로그
  - [x] 삭제 후 피드에서 제거

## 11. 반응형 및 애니메이션

- [x] 반응형 브레이크포인트 적용
  - [x] Mobile (< 768px): BottomNav, Header 표시
  - [x] Tablet (768px ~ 1023px): Icon-only Sidebar
  - [x] Desktop (1024px+): Full Sidebar
- [x] 좋아요 애니메이션
  - [x] 클릭 시 scale(1.3) → scale(1) (0.15초)
  - [x] 더블탭 시 큰 하트 fade in/out (1초)
- [x] 로딩 상태
  - [x] Skeleton UI (PostCardSkeleton)
  - [x] Shimmer 효과

## 12. 에러 핸들링 및 최적화

- [x] 에러 핸들링
  - [x] API 에러 처리
  - [x] 사용자 친화적 에러 메시지
  - [x] 네트워크 에러 처리
- [x] 이미지 최적화
  - [x] Next.js Image 컴포넌트 사용
  - [x] Lazy loading
- [x] 성능 최적화
  - [x] React.memo 적용 (필요한 컴포넌트)
  - [x] useMemo, useCallback 활용

## 13. 최종 마무리

- [x] 모바일/태블릿 반응형 테스트
  - [x] 다양한 화면 크기에서 테스트 (테스트 체크리스트 작성 완료)
  - [x] 터치 인터랙션 테스트 (테스트 체크리스트 작성 완료)
- [x] 접근성 검토
  - [x] 키보드 네비게이션
  - [x] ARIA 레이블
- [x] 코드 정리
  - [x] 불필요한 주석 제거
  - [x] 코드 포맷팅
- [x] 배포 준비
  - [x] 환경 변수 설정 (README에 문서화)
  - [x] Vercel 배포 설정 (README에 가이드 추가)
  - [x] 프로덕션 빌드 테스트 (타입 에러 수정 완료, 빌드 성공)
