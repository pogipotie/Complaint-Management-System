
-- Update the audit logs INSERT policy to allow citizens to trigger audit logs
-- when they update their complaints (e.g., submitting a rating)

DROP POLICY IF EXISTS "Users can insert audit logs for their actions" ON public.audit_logs;

CREATE POLICY "Users can insert audit logs for their actions" ON public.audit_logs
FOR INSERT
WITH CHECK (
  actor_user_id = auth.uid()
);
