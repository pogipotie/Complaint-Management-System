-- 0011_admin_update_users_policy.sql

-- Drop the old update policy
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

-- Recreate policy to allow users to update their own profile, AND admins/staff to update any user
CREATE POLICY "Users can update own profile and admins can update all" ON public.users 
FOR UPDATE 
USING (
  id = auth.uid() OR public.current_role() IN ('admin', 'staff')
) 
WITH CHECK (
  id = auth.uid() OR public.current_role() IN ('admin', 'staff')
);