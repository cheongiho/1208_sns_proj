/**
 * @file error-handler.ts
 * @description 에러 처리 유틸리티 함수
 *
 * API 및 클라이언트에서 사용할 수 있는 통일된 에러 처리 함수들
 * - 에러 타입 정의
 * - 사용자 친화적 메시지 변환
 * - 에러 분류 및 처리
 */

// ============================================
// 에러 타입 정의
// ============================================

export interface ApiErrorResponse {
  message: string; // 사용자 친화적 메시지
  status: number; // HTTP 상태 코드
  details?: string; // 개발용 상세 정보 (프로덕션에서는 제외)
  code?: string; // 에러 코드
}

export interface SupabaseError {
  code?: string;
  message: string;
  details?: string;
  hint?: string;
}

// ============================================
// 에러 분류 함수
// ============================================

/**
 * 네트워크 에러인지 확인
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError) {
    return (
      error.message.includes("fetch") ||
      error.message.includes("network") ||
      error.message.includes("Failed to fetch")
    );
  }
  return false;
}

/**
 * Supabase 에러인지 확인
 */
export function isSupabaseError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    "message" in error
  );
}

/**
 * Clerk 에러인지 확인
 */
export function isClerkError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    ("clerkError" in error || "status" in error)
  );
}

// ============================================
// Supabase 에러 코드별 메시지 매핑
// ============================================

const SUPABASE_ERROR_MESSAGES: Record<string, string> = {
  "23505": "이미 존재하는 항목입니다",
  "23503": "관련된 데이터가 존재하지 않습니다",
  "23502": "필수 항목이 누락되었습니다",
  "42P01": "테이블을 찾을 수 없습니다",
  "PGRST116": "요청한 리소스를 찾을 수 없습니다",
};

// ============================================
// HTTP 상태 코드별 메시지 매핑
// ============================================

const HTTP_ERROR_MESSAGES: Record<number, string> = {
  400: "잘못된 요청입니다",
  401: "로그인이 필요합니다",
  403: "권한이 없습니다",
  404: "요청한 리소스를 찾을 수 없습니다",
  409: "이미 존재하는 항목입니다",
  413: "파일 크기가 너무 큽니다",
  422: "처리할 수 없는 요청입니다",
  429: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요",
  500: "서버 오류가 발생했습니다",
  502: "서버에 연결할 수 없습니다",
  503: "서비스가 일시적으로 사용할 수 없습니다",
};

// ============================================
// 에러 처리 함수
// ============================================

/**
 * API 라우트에서 사용할 에러 처리 함수
 * @param error - 처리할 에러 객체
 * @param defaultStatus - 기본 HTTP 상태 코드 (기본값: 500)
 * @returns ApiErrorResponse 객체
 */
export function handleApiError(
  error: unknown,
  defaultStatus: number = 500
): ApiErrorResponse {
  // 네트워크 에러
  if (isNetworkError(error)) {
    return {
      message: "네트워크 연결을 확인해주세요",
      status: 503,
      details: error instanceof Error ? error.message : String(error),
      code: "NETWORK_ERROR",
    };
  }

  // Supabase 에러
  if (isSupabaseError(error)) {
    const supabaseError = error as SupabaseError;
    const errorCode = supabaseError.code || "";
    const userMessage =
      SUPABASE_ERROR_MESSAGES[errorCode] ||
      "데이터베이스 오류가 발생했습니다";

    return {
      message: userMessage,
      status: defaultStatus,
      details:
        process.env.NODE_ENV === "development"
          ? supabaseError.message
          : undefined,
      code: errorCode || "SUPABASE_ERROR",
    };
  }

  // HTTP 에러 (Response 객체)
  if (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    typeof (error as { status: number }).status === "number"
  ) {
    const httpError = error as { status: number; message?: string };
    const status = httpError.status;
    return {
      message:
        HTTP_ERROR_MESSAGES[status] ||
        httpError.message ||
        "요청 처리 중 오류가 발생했습니다",
      status,
      code: `HTTP_${status}`,
    };
  }

  // 일반 에러
  if (error instanceof Error) {
    // 에러 메시지에서 HTTP 상태 코드 추출 시도
    const statusMatch = error.message.match(/status[:\s]+(\d+)/i);
    if (statusMatch) {
      const status = parseInt(statusMatch[1], 10);
      return {
        message:
          HTTP_ERROR_MESSAGES[status] ||
          "요청 처리 중 오류가 발생했습니다",
        status,
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      };
    }

    return {
      message: "요청 처리 중 오류가 발생했습니다",
      status: defaultStatus,
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    };
  }

  // 알 수 없는 에러
  return {
    message: "알 수 없는 오류가 발생했습니다",
    status: defaultStatus,
    details:
      process.env.NODE_ENV === "development" ? String(error) : undefined,
  };
}

/**
 * 클라이언트에서 사용할 사용자 친화적 에러 메시지 추출
 * @param error - 처리할 에러 객체
 * @returns 사용자 친화적 메시지 문자열
 */
export function getUserFriendlyMessage(error: unknown): string {
  // 네트워크 에러
  if (isNetworkError(error)) {
    return "네트워크 연결을 확인해주세요";
  }

  // Supabase 에러
  if (isSupabaseError(error)) {
    const supabaseError = error as SupabaseError;
    const errorCode = supabaseError.code || "";
    return (
      SUPABASE_ERROR_MESSAGES[errorCode] ||
      "데이터베이스 오류가 발생했습니다"
    );
  }

  // HTTP 에러
  if (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    typeof (error as { status: number }).status === "number"
  ) {
    const httpError = error as { status: number; message?: string };
    const status = httpError.status;
    return (
      HTTP_ERROR_MESSAGES[status] ||
      httpError.message ||
      "요청 처리 중 오류가 발생했습니다"
    );
  }

  // Error 객체
  if (error instanceof Error) {
    // API 응답에서 온 에러 메시지인지 확인
    try {
      const errorObj = JSON.parse(error.message);
      if (errorObj && typeof errorObj.error === "string") {
        return errorObj.error;
      }
    } catch {
      // JSON 파싱 실패 시 원본 메시지 사용
    }

    // 일반 에러 메시지
    return error.message || "요청 처리 중 오류가 발생했습니다";
  }

  // 문자열 에러
  if (typeof error === "string") {
    return error;
  }

  // 알 수 없는 에러
  return "알 수 없는 오류가 발생했습니다";
}

/**
 * API 응답에서 에러 메시지 추출
 * @param response - fetch Response 객체
 * @returns Promise<string> - 에러 메시지
 */
export async function extractErrorMessage(
  response: Response
): Promise<string> {
  try {
    const data = await response.json();
    if (data && typeof data.error === "string") {
      return data.error;
    }
  } catch {
    // JSON 파싱 실패 시 HTTP 상태 메시지 사용
  }

  // HTTP 상태 코드 기반 메시지
  return (
    HTTP_ERROR_MESSAGES[response.status] ||
    `요청이 실패했습니다 (${response.status})`
  );
}

