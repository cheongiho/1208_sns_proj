"use client";

/**
 * @file CreatePostModal.tsx
 * @description 게시물 작성 모달 컴포넌트
 *
 * Instagram 스타일의 게시물 작성 UI
 * - 이미지 선택 및 미리보기
 * - 캡션 입력 (최대 2,200자)
 * - Supabase Storage 업로드
 * - 게시물 생성 API 호출
 */

import { useState, useRef, useCallback, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Upload, Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useClerkSupabaseClient } from "@/lib/supabase/clerk-client";
import type { PostWithUserAndStats } from "@/lib/types";
import { getUserFriendlyMessage, extractErrorMessage, isNetworkError } from "@/lib/utils/error-handler";

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated?: (post: PostWithUserAndStats) => void;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_CAPTION_LENGTH = 2200;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function CreatePostModal({
  isOpen,
  onClose,
  onPostCreated,
}: CreatePostModalProps) {
  const { user, isSignedIn } = useUser();
  const supabase = useClerkSupabaseClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // 모달이 닫힐 때 상태 초기화
  useEffect(() => {
    if (!isOpen) {
      setSelectedFile(null);
      setPreviewUrl(null);
      setCaption("");
      setError(null);
      setIsUploading(false);
      setDragActive(false);
      // 미리보기 URL 정리
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    }
  }, [isOpen, previewUrl]);

  // 컴포넌트 언마운트 시 미리보기 URL 정리
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // 파일 검증
  const validateFile = (file: File): string | null => {
    // 파일 타입 검증
    if (!ALLOWED_TYPES.includes(file.type)) {
      return "JPEG, PNG, WebP 이미지 파일만 업로드할 수 있습니다";
    }

    // 파일 크기 검증
    if (file.size > MAX_FILE_SIZE) {
      return "이미지는 5MB 이하여야 합니다";
    }

    return null;
  };

  // 파일 선택 핸들러
  const handleFileSelect = useCallback((file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setSelectedFile(file);

    // 기존 미리보기 URL 정리
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    // 새 미리보기 URL 생성
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  }, [previewUrl]);

  // 파일 입력 변경 핸들러
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // 드래그 앤 드롭 핸들러
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      const file = e.dataTransfer.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  // 이미지 변경 핸들러
  const handleChangeImage = () => {
    // 기존 미리보기 URL 정리
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setSelectedFile(null);
    setError(null);
    fileInputRef.current?.click();
  };

  // 게시물 생성 핸들러
  const handleSubmit = async () => {
    if (!isSignedIn || !user) {
      setError("로그인이 필요합니다");
      return;
    }

    if (!selectedFile || !previewUrl) {
      setError("이미지를 선택해주세요");
      return;
    }

    // 캡션 길이 검증
    if (caption.length > MAX_CAPTION_LENGTH) {
      setError(`캡션은 ${MAX_CAPTION_LENGTH}자 이하여야 합니다`);
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      // 1. 파일 업로드 (Supabase Storage)
      const fileExt = selectedFile.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(7)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("posts")
        .upload(filePath, selectedFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      // 2. Public URL 획득
      const {
        data: { publicUrl },
      } = supabase.storage.from("posts").getPublicUrl(filePath);

      // 3. 게시물 생성 API 호출
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageUrl: publicUrl,
          caption: caption.trim() || null,
        }),
      });

      if (!response.ok) {
        const errorMessage = await extractErrorMessage(response);
        throw new Error(errorMessage);
      }

      const data = await response.json();
      const newPost: PostWithUserAndStats = data.data;

      // 성공 시 콜백 호출
      if (onPostCreated) {
        onPostCreated(newPost);
      }

      // 모달 닫기
      onClose();
    } catch (err) {
      console.error("Create post error:", err);
      const errorMessage = getUserFriendlyMessage(err);
      // 네트워크 에러인 경우 특별한 메시지 표시
      if (isNetworkError(err)) {
        setError("네트워크 연결을 확인해주세요. 잠시 후 다시 시도해주세요.");
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsUploading(false);
    }
  };

  // 인증되지 않은 사용자
  if (!isSignedIn) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>게시물 작성</DialogTitle>
          </DialogHeader>
          <div className="py-8 text-center">
            <p className="text-sm text-[#8e8e8e] mb-4">
              게시물을 작성하려면 로그인이 필요합니다
            </p>
            <Button
              onClick={() => {
                onClose();
                window.location.href = "/sign-in";
              }}
              className="bg-[#0095f6] hover:bg-[#0095f6]/90"
            >
              로그인
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>새 게시물 만들기</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 이미지 선택/미리보기 영역 */}
          {!previewUrl ? (
            <div
              className={`relative border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                dragActive
                  ? "border-[#0095f6] bg-[#0095f6]/5"
                  : "border-[#dbdbdb] hover:border-[#8e8e8e]"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileInputChange}
                className="hidden"
                aria-label="이미지 선택"
              />
              <ImageIcon className="w-12 h-12 mx-auto mb-4 text-[#8e8e8e]" />
              <p className="text-lg font-semibold text-[#262626] mb-2">
                사진을 여기에 끌어다 놓으세요
              </p>
              <p className="text-sm text-[#8e8e8e] mb-4">
                또는 컴퓨터에서 선택하세요
              </p>
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="bg-[#0095f6] hover:bg-[#0095f6]/90"
              >
                <Upload className="w-4 h-4 mr-2" />
                컴퓨터에서 선택
              </Button>
            </div>
          ) : (
            <div className="relative w-full aspect-square bg-gray-100 rounded-lg overflow-hidden">
              <Image
                src={previewUrl}
                alt="미리보기"
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 600px"
              />
              <Button
                onClick={handleChangeImage}
                variant="outline"
                className="absolute top-4 right-4"
                disabled={isUploading}
              >
                이미지 변경
              </Button>
            </div>
          )}

          {/* 캡션 입력 영역 */}
          {previewUrl && (
            <div className="space-y-2">
              <label
                htmlFor="caption"
                className="text-sm font-semibold text-[#262626]"
              >
                캡션
              </label>
              <Textarea
                id="caption"
                value={caption}
                onChange={(e) => {
                  setCaption(e.target.value);
                  setError(null);
                }}
                placeholder="게시물에 대한 설명을 입력하세요..."
                maxLength={MAX_CAPTION_LENGTH}
                className="min-h-24 resize-none"
                disabled={isUploading}
              />
              <div className="flex justify-between items-center text-xs text-[#8e8e8e]">
                <span>선택사항</span>
                <span>
                  {caption.length} / {MAX_CAPTION_LENGTH}
                </span>
              </div>
            </div>
          )}

          {/* 에러 메시지 */}
          {error && (
            <div className="text-sm text-[#ed4956] bg-[#ed4956]/10 p-3 rounded-lg">
              {error}
            </div>
          )}

          {/* 공유하기 버튼 */}
          {previewUrl && (
            <div className="flex justify-end gap-2 pt-4 border-t border-[#dbdbdb]">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isUploading}
              >
                취소
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isUploading}
                className="bg-[#0095f6] hover:bg-[#0095f6]/90 disabled:opacity-50"
              >
                {isUploading ? "업로드 중..." : "공유하기"}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

