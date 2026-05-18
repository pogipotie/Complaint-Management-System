-- 0022_fix_infinite_recursion.sql

-- 1. Create a secure function to get the current user's role without triggering RLS.
-- SECURITY DEFINER makes it run as the database owner (bypassing RLS).
CREATE OR REPLACE FUNCTION public.current_role()
RETURNS public.user_role
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$;

-- 2. Create a secure function to get the current user's barangay without triggering RLS.
CREATE OR REPLACE FUNCTION public.current_barangay()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT barangay FROM public.users WHERE id = auth.uid();
$$;

-- 3. Fix the recursive policies on public.users
DROP POLICY IF EXISTS "Captain can read barangay users" ON public.users;
CREATE POLICY "Captain can read barangay users" ON public.users
FOR SELECT
USING (
  public.current_role() = 'brgy_captain' AND
  barangay = public.current_barangay()
);

-- 4. Fix the recursive policies on public.complaints
DROP POLICY IF EXISTS "Captain can read barangay complaints" ON public.complaints;
CREATE POLICY "Captain can read barangay complaints" ON public.complaints
FOR SELECT
USING (
  public.current_role() = 'brgy_captain' AND
  barangay = public.current_barangay()
);

DROP POLICY IF EXISTS "Captain can update barangay complaints" ON public.complaints;
CREATE POLICY "Captain can update barangay complaints" ON public.complaints
FOR UPDATE
USING (
  public.current_role() = 'brgy_captain' AND
  barangay = public.current_barangay()
)
WITH CHECK (
  public.current_role() = 'brgy_captain' AND
  barangay = public.current_barangay()
);

-- 5. Just to be absolutely safe, let's fix the announcements policy
-- 'FOR ALL' applies to SELECT as well, so GET /announcements queries public.users.
-- Let's separate it into INSERT/UPDATE/DELETE so public READs are completely free of overhead.
DROP POLICY IF EXISTS "Admins can manage announcements" ON public.announcements;

CREATE POLICY "Admins can insert announcements" ON public.announcements
FOR INSERT
WITH CHECK (public.current_role() IN ('admin', 'staff'));

CREATE POLICY "Admins can update announcements" ON public.announcements
FOR UPDATE
USING (public.current_role() IN ('admin', 'staff'))
WITH CHECK (public.current_role() IN ('admin', 'staff'));

CREATE POLICY "Admins can delete announcements" ON public.announcements
FOR DELETE
USING (public.current_role() IN ('admin', 'staff'));
