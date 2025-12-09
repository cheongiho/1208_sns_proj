-- ============================================
-- Supabase Storage: posts 버킷 생성
-- ============================================
-- 게시물 이미지 저장용 공개 읽기 버킷
-- ============================================

-- 1. posts 버킷 생성 (이미 존재하면 무시됨)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'posts',
  'posts',
  true,  -- 공개 읽기 버킷
  5242880,  -- 5MB 제한 (5 * 1024 * 1024)
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]  -- 이미지 파일만 허용
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']::text[];

-- ============================================
-- 2. Storage 정책 설정
-- ============================================

-- INSERT: 인증된 사용자만 업로드 가능
CREATE POLICY "Authenticated users can upload to posts bucket"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'posts'
);

-- SELECT: 공개 읽기 (public bucket이므로 모든 사용자 접근 가능)
-- 공개 버킷이므로 별도 정책 불필요 (기본적으로 모든 사용자 접근 가능)

-- DELETE: 본인이 업로드한 파일만 삭제 가능
CREATE POLICY "Users can delete own files from posts bucket"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'posts' AND
  (storage.foldername(name))[1] = (SELECT auth.jwt()->>'sub')
);

-- UPDATE: 본인이 업로드한 파일만 업데이트 가능
CREATE POLICY "Users can update own files in posts bucket"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'posts' AND
  (storage.foldername(name))[1] = (SELECT auth.jwt()->>'sub')
)
WITH CHECK (
  bucket_id = 'posts' AND
  (storage.foldername(name))[1] = (SELECT auth.jwt()->>'sub')
);


