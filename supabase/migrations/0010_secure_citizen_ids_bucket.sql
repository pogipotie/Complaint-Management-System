-- 0010_secure_citizen_ids_bucket.sql

-- 1. Make the bucket private 
UPDATE storage.buckets SET public = false WHERE id = 'citizen_ids'; 

-- 2. Drop the old public viewing policy 
DROP POLICY IF EXISTS "Public can view IDs" ON storage.objects; 
DROP POLICY IF EXISTS "Staff and Admin can view all IDs" ON storage.objects; 
DROP POLICY IF EXISTS "Users can view their own ID" ON storage.objects; 

-- 3. Create secure policy for Admins 
CREATE POLICY "Staff and Admin can view all IDs" ON storage.objects 
FOR SELECT 
USING ( 
  bucket_id = 'citizen_ids' AND EXISTS ( 
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('staff', 'admin') 
  ) 
); 

-- 4. Create secure policy for the User who uploaded it 
CREATE POLICY "Users can view their own ID" ON storage.objects 
FOR SELECT 
USING ( 
  bucket_id = 'citizen_ids' AND auth.uid()::text = (storage.foldername(name))[1] 
);