import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { koKR } from "@clerk/localizations";
import type { LocalizationResource } from "@clerk/types";
import { Geist, Geist_Mono } from "next/font/google";

import { SyncUserProvider } from "@/components/providers/sync-user-provider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/**
 * Clerk 한국어 로컬라이제이션 설정
 *
 * 기본 koKR 로컬라이제이션을 사용하되, 애플리케이션 특성에 맞게
 * 일부 텍스트를 커스터마이징합니다.
 *
 * 참고:
 * - 기본 koKR은 @clerk/localizations에서 제공하는 완전한 한국어 번역을 포함합니다
 * - 커스텀 로컬라이제이션은 기본 로컬라이제이션과 병합되어 적용됩니다
 * - 애플리케이션 이름은 {{applicationName}} 변수로 동적으로 삽입됩니다
 */
const customLocalization: Partial<LocalizationResource> = {
  // 로그인 관련 커스터마이징
  signIn: {
    start: {
      subtitle: "{{applicationName}}에 계속하려면 로그인하세요",
    },
    emailCode: {
      subtitle: "{{applicationName}}에 계속하려면 이메일 인증 코드를 입력하세요",
    },
    phoneCode: {
      subtitle: "{{applicationName}}에 계속하려면 SMS 인증 코드를 입력하세요",
    },
  },
  // 회원가입 관련 커스터마이징
  signUp: {
    start: {
      subtitle: "{{applicationName}}에 계속하려면 계정을 만드세요",
    },
    emailCode: {
      subtitle: "{{applicationName}}에 계속하려면 이메일 인증 코드를 입력하세요",
    },
    phoneCode: {
      subtitle: "{{applicationName}}에 계속하려면 SMS 인증 코드를 입력하세요",
    },
  },
  // 에러 메시지 커스터마이징 (더 자연스러운 한국어 표현)
  unstable__errors: {
    form_identifier_not_found: "입력하신 정보로 계정을 찾을 수 없습니다",
    form_password_pwned:
      "이 비밀번호는 데이터 유출로 인해 안전하지 않습니다. 다른 비밀번호를 사용해주세요",
    form_password_length_too_short:
      "비밀번호가 너무 짧습니다. 최소 {{min}}자 이상이어야 합니다",
    form_password_length_too_long:
      "비밀번호가 너무 깁니다. 최대 {{max}}자까지 가능합니다",
    form_password_not_strong_enough:
      "비밀번호가 충분히 강력하지 않습니다. 대소문자, 숫자, 특수문자를 포함해주세요",
    form_password_pwned__choose_a_different_password:
      "이 비밀번호는 데이터 유출로 인해 안전하지 않습니다. 다른 비밀번호를 선택해주세요",
    form_password_size_in_bytes:
      "비밀번호가 너무 깁니다. 최대 {{max}}바이트까지 가능합니다",
    form_username_max_length_exceeded:
      "사용자 이름이 너무 깁니다. 최대 {{max}}자까지 가능합니다",
    form_username_invalid_character:
      "사용자 이름에 사용할 수 없는 문자가 포함되어 있습니다",
    form_username_invalid_length:
      "사용자 이름은 {{min}}자 이상 {{max}}자 이하여야 합니다",
    form_param_format_invalid:
      "입력 형식이 올바르지 않습니다. 올바른 형식으로 입력해주세요",
    form_param_format_invalid_message:
      "{{field}} 형식이 올바르지 않습니다",
    form_param_max_length_exceeded:
      "입력값이 너무 깁니다. 최대 {{max}}자까지 가능합니다",
    form_param_max_length_exceeded__pluralize:
      "입력값이 너무 깁니다. 최대 {{max}}자까지 가능합니다",
    form_param_min_length_not_met:
      "입력값이 너무 짧습니다. 최소 {{min}}자 이상이어야 합니다",
    form_param_min_length_not_met__pluralize:
      "입력값이 너무 짧습니다. 최소 {{min}}자 이상이어야 합니다",
    form_param_nil: "필수 입력 항목입니다",
    form_code_incorrect: "인증 코드가 올바르지 않습니다",
    form_password_incorrect: "비밀번호가 올바르지 않습니다",
    form_param_exists: "이미 사용 중인 {{field}}입니다",
    form_param_exists__email_address:
      "이 이메일 주소는 이미 사용 중입니다",
    form_param_exists__phone_number:
      "이 전화번호는 이미 사용 중입니다",
    form_param_exists__username: "이 사용자 이름은 이미 사용 중입니다",
    form_param_numeric: "숫자만 입력 가능합니다",
    form_param_required: "필수 입력 항목입니다",
    form_param_required__email_address:
      "이메일 주소를 입력해주세요",
    form_param_required__phone_number: "전화번호를 입력해주세요",
    form_param_required__username: "사용자 이름을 입력해주세요",
    form_password_validation_failed:
      "비밀번호가 요구사항을 만족하지 않습니다",
    form_username_invalid_character__pluralize:
      "사용자 이름에 사용할 수 없는 문자가 포함되어 있습니다",
    not_allowed_access:
      "접근 권한이 없습니다. 접근이 필요하시면 관리자에게 문의해주세요",
  },
};

// 기본 koKR과 커스텀 로컬라이제이션 병합
const localization: LocalizationResource = {
  ...koKR,
  ...customLocalization,
  // 중첩된 객체는 수동으로 병합
  signIn: {
    ...koKR.signIn,
    ...customLocalization.signIn,
  },
  signUp: {
    ...koKR.signUp,
    ...customLocalization.signUp,
  },
  unstable__errors: {
    ...koKR.unstable__errors,
    ...customLocalization.unstable__errors,
  },
};

export const metadata: Metadata = {
  title: "SaaS 템플릿",
  description: "Next.js + Clerk + Supabase 보일러플레이트",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider localization={localization}>
      <html lang="ko">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <ErrorBoundary>
            <SyncUserProvider>
              {children}
            </SyncUserProvider>
          </ErrorBoundary>
        </body>
      </html>
    </ClerkProvider>
  );
}
