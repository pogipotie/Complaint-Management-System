-- 0028_fix_comments_rls.sql
-- Allow citizens to read "internal" status updates (which are now official Resolution Notes in the UI)
-- Also allow brgy_captains to read/insert comments on complaints in their barangay

-- Drop old SELECT policies for complaint_comments
DROP POLICY IF EXISTS "Users can read comments on accessible complaints" ON public.complaint_comments;
DROP POLICY IF EXISTS "Staff/Admins can read internal comments" ON public.complaint_comments;

-- Re-create unified SELECT policy for complaint_comments
CREATE POLICY "Users can read all comments on accessible complaints" ON public.complaint_comments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.complaints c 
    WHERE c.id = complaint_id 
    AND (
      c.created_by = auth.uid() OR 
      public.current_role() IN ('admin', 'staff') OR 
      (public.current_role() = 'brgy_captain' AND c.barangay = public.current_barangay())
    )
  )
);

-- Drop old INSERT policy for complaint_comments
DROP POLICY IF EXISTS "Users can insert comments" ON public.complaint_comments;

-- Re-create INSERT policy for complaint_comments to include brgy_captain
CREATE POLICY "Users can insert comments on accessible complaints" ON public.complaint_comments
FOR INSERT
WITH CHECK (
  user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.complaints c 
    WHERE c.id = complaint_id 
    AND (
      c.created_by = auth.uid() OR 
      public.current_role() IN ('admin', 'staff') OR 
      (public.current_role() = 'brgy_captain' AND c.barangay = public.current_barangay())
    )
  )
);