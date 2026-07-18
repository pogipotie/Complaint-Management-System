-- Fix the audit_logs INSERT policy to allow citizens to insert audit logs
-- This was accidentally restricted to admins and captains in a previous migration,
-- which caused a 42501 (Forbidden) error when citizens tried to submit ratings.

DROP POLICY IF EXISTS "Users can insert audit logs for their actions" ON public.audit_logs;

CREATE POLICY "Users can insert audit logs for their actions" ON public.audit_logs
FOR INSERT
WITH CHECK (
  actor_user_id = auth.uid()
);