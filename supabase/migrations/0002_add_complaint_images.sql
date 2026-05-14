-- Add image_url to complaints table
ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS image_url text;

-- Create a public storage bucket for complaint images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'complaint_images', 
  'complaint_images', 
  true, 
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies for `storage.objects`

-- 1. Allow authenticated users to upload images
CREATE POLICY "Users can upload complaint images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'complaint_images');

-- 2. Allow anyone to view complaint images
CREATE POLICY "Anyone can view complaint images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'complaint_images');

-- 3. Allow users to update their own images
CREATE POLICY "Users can update their own complaint images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'complaint_images' AND owner = auth.uid());

-- 4. Allow users to delete their own images
CREATE POLICY "Users can delete their own complaint images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'complaint_images' AND owner = auth.uid());
