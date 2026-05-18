-- 0025_allow_captain_update_users.sql

-- Drop the old policy so we can expand it
DROP POLICY IF EXISTS "Users can update own profile and admins can update all" ON public.users;

-- Recreate policy to include brgy_captain (but restricting captains to only update users in their barangay)
CREATE POLICY "Users can update own profile and admins/captains can update" ON public.users 
FOR UPDATE 
USING (
  id = auth.uid() 
  OR public.current_role() IN ('admin', 'staff')
  OR (public.current_role() = 'brgy_captain' AND barangay = public.current_barangay())
) 
WITH CHECK (
  id = auth.uid() 
  OR public.current_role() IN ('admin', 'staff')
  OR (public.current_role() = 'brgy_captain' AND barangay = public.current_barangay())
);