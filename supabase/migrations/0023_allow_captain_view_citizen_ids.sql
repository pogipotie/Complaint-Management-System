-- 0023_allow_captain_view_citizen_ids.sql

-- Drop the old policy so we can expand it
DROP POLICY IF EXISTS "Staff and Admin can view all IDs" ON storage.objects; 

-- Recreate policy to include brgy_captain alongside staff and admin
CREATE POLICY "Admins, Staff, and Captains can view IDs" ON storage.objects 
FOR SELECT 
USING ( 
  bucket_id = 'citizen_ids' AND EXISTS ( 
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('staff', 'admin', 'brgy_captain') 
  ) 
);
