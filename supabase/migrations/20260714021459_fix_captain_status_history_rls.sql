-- The trigger `trg_complaints_status_history` inserts a row into `complaint_status_history`
-- whenever a complaint is updated.
-- However, we never explicitly created an INSERT policy for `complaint_status_history`
-- for the `brgy_captain` role (or any role), so it defaults to denying the insert.
-- We must allow users (Admins, Staff, Captains, Citizens) to insert into status history 
-- if they have permission to update the complaint itself.

-- Create a policy that allows inserting into complaint_status_history
-- if the user has access to update the associated complaint.
CREATE POLICY "Allow inserting status history" ON public.complaint_status_history
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.complaints c
    WHERE c.id = complaint_id
    AND (
      public.current_role() = 'admin'
      OR (public.current_role() = 'staff' AND c.assigned_department_id = (SELECT department_id FROM public.users WHERE id = auth.uid()))
      OR (public.current_role() = 'brgy_captain' AND c.barangay = (SELECT barangay FROM public.users WHERE id = auth.uid()))
      OR c.created_by = auth.uid()
    )
  )
);

-- Also update the SELECT policy for complaint_status_history to explicitly include brgy_captain
DROP POLICY IF EXISTS "Read status history with complaint access" ON public.complaint_status_history;

CREATE POLICY "Read status history with complaint access" ON public.complaint_status_history 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.complaints c
    WHERE c.id = complaint_id
    AND (
      c.created_by = auth.uid()
      OR public.current_role() = 'admin'
      OR (public.current_role() = 'staff' AND c.assigned_department_id = (SELECT department_id FROM public.users WHERE id = auth.uid()))
      OR (public.current_role() = 'brgy_captain' AND c.barangay = (SELECT barangay FROM public.users WHERE id = auth.uid()))
    )
  )
);
