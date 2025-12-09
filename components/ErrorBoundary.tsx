"use client";

/**
 * @file ErrorBoundary.tsx
 * @description React Error Boundary 컴포넌트
 *
 * 애플리케이션의 예상치 못한 에러를 포착하여 폴백 UI를 표시합니다.
 * 클래스 컴포넌트로 구현해야 합니다 (함수 컴포넌트는 Error Boundary를 지원하지 않음).
 */

import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // 다음 렌더에서 폴백 UI가 표시되도록 상태를 업데이트합니다.
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 에러 리포팅 서비스에 에러를 기록할 수 있습니다.
    console.error("ErrorBoundary caught an error:", error, errorInfo);

    // 커스텀 에러 핸들러 호출
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // 커스텀 폴백 UI가 제공된 경우 사용
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 기본 폴백 UI
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] px-4 py-12">
          <div className="text-center max-w-md">
            <h2 className="text-2xl font-bold text-[#262626] mb-4">
              문제가 발생했습니다
            </h2>
            <p className="text-[#8e8e8e] mb-6">
              예상치 못한 오류가 발생했습니다. 페이지를 새로고침하거나 다시 시도해주세요.
            </p>
            {process.env.NODE_ENV === "development" && this.state.error && (
              <details className="mb-6 text-left">
                <summary className="text-sm text-[#8e8e8e] cursor-pointer mb-2">
                  에러 상세 정보 (개발 모드)
                </summary>
                <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto max-h-48">
                  {this.state.error.toString()}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="px-6 py-2 bg-[#0095f6] text-white rounded-lg hover:bg-[#0095f6]/90 transition-colors font-semibold"
              >
                다시 시도
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-gray-200 text-[#262626] rounded-lg hover:bg-gray-300 transition-colors font-semibold"
              >
                페이지 새로고침
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

