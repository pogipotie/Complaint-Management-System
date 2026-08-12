-- Lock down the complaint_images bucket so evidence files can only be
-- accessed by authenticated, authorized users via signed URLs.

-- 1. Make the bucket private. Public URLs (getPublicUrl) will no longer
--    serve files; the frontend must now use createSignedUrl().
UPDATE storage.buckets
SET public = false
WHERE id = 'complaint_images';

-- 2. Drop the old permissive SELECT policy that allowed anonymous access.
DROP POLICY IF EXISTS "Anyone can view complaint images" ON storage.objects;

-- 3. Add a restrictive SELECT policy. Files are stored as either
--    {user_id}/{fileName} (citizen reports) or
--    resolution/{complaint_id}/{fileName} (after-photo proofs).
--    Access is allowed for:
--      * Municipal Admins
--      * Barangay Captains (so they can investigate any complaint)
--      * The citizen who originally uploaded the file
--      * A citizen who owns the complaint the file is attached to
--        (covers the case where someone else submits on their behalf, etc.)
CREATE POLICY "Authorized users can view complaint evidence"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'complaint_images'
  AND (
    public.current_role() = 'admin'
    OR public.current_role() = 'brgy_captain'
    OR (storage.foldername(name))[1] = auth.uid()::text
    OR EXISTS (
      SELECT 1
      FROM public.complaints c
      WHERE c.created_by = auth.uid()
        AND (
          c.image_url LIKE '%' || storage.objects.name
          OR c.video_url LIKE '%' || storage.objects.name
          OR EXISTS (
            SELECT 1 FROM unnest(c.resolution_images) AS r(path)
            WHERE r.path LIKE '%' || storage.objects.name
          )
        )
    )
  )
);
