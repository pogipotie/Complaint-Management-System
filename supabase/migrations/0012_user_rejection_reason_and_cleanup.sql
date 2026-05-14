-- 0012_user_rejection_reason_and_cleanup.sql

-- 1. Add rejection_reason column to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS rejection_reason text;

-- 2. Create a function that deletes rejected users whose registration is older than 24 hours
-- We use SECURITY DEFINER so this function has permission to delete from auth.users
CREATE OR REPLACE FUNCTION public.cleanup_rejected_users()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Deleting from auth.users automatically cascades and deletes the public.users profile
  DELETE FROM auth.users
  WHERE id IN (
    SELECT id FROM public.users
    WHERE verification_status = 'rejected'
    AND created_at < NOW() - INTERVAL '1 day'
  );
END;
$$;

-- 3. Schedule the cleanup function to run automatically every hour using pg_cron
-- Note: pg_cron must be enabled in your Supabase project (Database -> Extensions)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Safely unschedule the job if it exists (ignores error if it doesn't)
DO $$
BEGIN
  PERFORM cron.unschedule('cleanup_rejected_users_job');
EXCEPTION WHEN OTHERS THEN
  -- Do nothing if the job wasn't found
END;
$$;

-- Schedule the job to run at minute 0 of every hour
SELECT cron.schedule(
  'cleanup_rejected_users_job', 
  '0 * * * *', 
  'SELECT public.cleanup_rejected_users();'
);
