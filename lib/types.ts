/**
 * @file types.ts
 * @description 데이터베이스 스키마 기반 TypeScript 타입 정의
 *
 * 이 파일은 Supabase 데이터베이스의 테이블과 뷰를 기반으로 한
 * TypeScript 타입 정의를 포함합니다.
 *
 * 주요 타입:
 * - User: 사용자 정보
 * - Post: 게시물 정보
 * - Like: 좋아요 정보
 * - Comment: 댓글 정보
 * - Follow: 팔로우 정보
 * - PostStats: 게시물 통계 (뷰)
 * - UserStats: 사용자 통계 (뷰)
 * - 확장 타입: 관계를 포함한 복합 타입
 *
 * @see {@link /supabase/migrations/20250108120000_initial_schema.sql} - 데이터베이스 스키마
 */

// ============================================
// 기본 타입 정의
// ============================================

/**
 * 사용자 정보
 */
export interface User {
  id: string; // UUID
  clerk_id: string;
  name: string;
  created_at: string;
}

/**
 * 게시물 정보
 */
export interface Post {
  id: string; // UUID
  user_id: string; // UUID
  image_url: string;
  caption: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * 좋아요 정보
 */
export interface Like {
  id: string; // UUID
  post_id: string; // UUID
  user_id: string; // UUID
  created_at: string;
}

/**
 * 댓글 정보
 */
export interface Comment {
  id: string; // UUID
  post_id: string; // UUID
  user_id: string; // UUID
  content: string;
  created_at: string;
  updated_at: string;
}

/**
 * 팔로우 정보
 */
export interface Follow {
  id: string; // UUID
  follower_id: string; // UUID
  following_id: string; // UUID
  created_at: string;
}

// ============================================
// 통계 뷰 타입 정의
// ============================================

/**
 * 게시물 통계 (post_stats 뷰)
 */
export interface PostStats {
  post_id: string;
  user_id: string;
  image_url: string;
  caption: string | null;
  created_at: string;
  likes_count: number;
  comments_count: number;
}

/**
 * 사용자 통계 (user_stats 뷰)
 */
export interface UserStats {
  user_id: string;
  clerk_id: string;
  name: string;
  posts_count: number;
  followers_count: number;
  following_count: number;
}

// ============================================
// 확장 타입 (관계 포함)
// ============================================

/**
 * 게시물 + 사용자 정보
 */
export interface PostWithUser extends Post {
  user: User;
}

/**
 * 게시물 + 통계 정보
 */
export interface PostWithStats extends Post {
  likes_count: number;
  comments_count: number;
}

/**
 * 게시물 + 사용자 + 통계 정보
 */
export interface PostWithUserAndStats extends Post {
  user: User;
  likes_count: number;
  comments_count: number;
  isLiked?: boolean; // 현재 사용자가 좋아요를 눌렀는지 여부
}

/**
 * 댓글 + 사용자 정보
 */
export interface CommentWithUser extends Comment {
  user: User;
}

/**
 * 사용자 + 통계 정보
 */
export interface UserWithStats extends User {
  posts_count: number;
  followers_count: number;
  following_count: number;
}

// ============================================
// 유틸리티 타입
// ============================================

/**
 * 페이지네이션 파라미터
 */
export interface PaginationParams {
  limit?: number;
  offset?: number;
}

/**
 * 페이지네이션 응답
 */
export interface PaginatedResponse<T> {
  data: T[];
  total?: number;
  hasMore: boolean;
}

