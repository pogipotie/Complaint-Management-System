-- Fix complaint_comments RLS policies by using a SECURITY DEFINER helper function
-- This guarantees the access check bypasses any complex nested RLS evaluations
-- that cause 42501 Forbidden errors when Admins or Captains try to comment.

CREATE OR REPLACE FUNCTION public.can_access_complaint(cid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM complaints c
    WHERE c.id = cid
    AND (
      c.created_by = auth.uid() OR
      (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'staff') OR
      ((SELECT role FROM users WHERE id = auth.uid()) = 'brgy_captain' AND c.barangay = (SELECT barangay FROM users WHERE id = auth.uid()))
    )
  );
$$;

-- Update SELECT policy
DROP POLICY IF EXISTS "Users can read all comments on accessible complaints" ON public.complaint_comments;
CREATE POLICY "Users can read all comments on accessible complaints" ON public.complaint_comments
FOR SELECT
USING (
  public.can_access_complaint(complaint_id)
);

-- Update INSERT policy
DROP POLICY IF EXISTS "Users can insert comments on accessible complaints" ON public.complaint_comments;
CREATE POLICY "Users can insert comments on accessible complaints" ON public.complaint_comments
FOR INSERT
WITH CHECK (
  user_id = auth.uid() AND
  public.can_access_complaint(complaint_id)
);
