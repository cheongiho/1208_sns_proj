/**
 * @file format-time.ts
 * @description 시간 포맷팅 유틸리티 함수
 *
 * 상대 시간 표시 (예: "3시간 전", "2일 전")
 */

/**
 * 상대 시간을 포맷팅합니다.
 *
 * @param dateString - ISO 8601 형식의 날짜 문자열
 * @returns 상대 시간 문자열 (예: "3시간 전", "2일 전", "1주 전")
 *
 * @example
 * ```ts
 * formatRelativeTime("2025-01-08T10:00:00Z") // "3시간 전"
 * ```
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  // 1분 미만
  if (diffInSeconds < 60) {
    return "방금 전";
  }

  // 1시간 미만
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}분 전`;
  }

  // 24시간 미만
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}시간 전`;
  }

  // 7일 미만
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}일 전`;
  }

  // 4주 미만
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks}주 전`;
  }

  // 12개월 미만
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths}개월 전`;
  }

  // 1년 이상
  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears}년 전`;
}


