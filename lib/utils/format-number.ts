/**
 * @file format-number.ts
 * @description 숫자 포맷팅 유틸리티 함수
 *
 * 천 단위 콤마 추가 (예: 1234 → "1,234")
 */

/**
 * 숫자에 천 단위 콤마를 추가합니다.
 *
 * @param num - 포맷팅할 숫자
 * @returns 천 단위 콤마가 추가된 문자열
 *
 * @example
 * ```ts
 * formatNumber(1234) // "1,234"
 * formatNumber(1234567) // "1,234,567"
 * ```
 */
export function formatNumber(num: number): string {
  return num.toLocaleString("ko-KR");
}


