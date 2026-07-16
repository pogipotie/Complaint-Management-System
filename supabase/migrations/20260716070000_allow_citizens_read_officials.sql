-- Allow citizens to read the basic profile information of officials
-- This fixes the issue where the frontend shows "Staff" or "Admin" instead of "Captain" 
-- because the citizen's query was blocked by RLS from fetching the Captain's role.

CREATE POLICY "Anyone can read officials profiles" ON public.users
FOR SELECT
USING (
  role IN ('admin', 'staff', 'brgy_captain')
);
