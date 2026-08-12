-- Allow video uploads (up to 50MB) in the complaint_images bucket
-- and add a video_url column to the complaints table.

-- 1. Update the storage bucket to allow video MIME types and increase the size limit to 50MB.
--    50 * 1024 * 1024 = 52428800 bytes.
UPDATE storage.buckets
SET file_size_limit = 52428800,
    allowed_mime_types = ARRAY[
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'video/mp4',
      'video/webm',
      'video/quicktime',
      'video/3gpp',
      'video/x-matroska'
    ]
WHERE id = 'complaint_images';

-- 2. Add video_url column to complaints (nullable; either image_url or video_url will be used).
ALTER TABLE public.complaints
ADD COLUMN IF NOT EXISTS video_url text;
