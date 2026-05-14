
-- Allow citizens to update their own complaints
-- This is necessary for citizens to provide a resolution rating and feedback

CREATE POLICY "Citizen can update own complaints" ON public.complaints
FOR UPDATE
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());
