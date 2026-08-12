-- Phase 5: Soft-expiry for transient residents

-- 1. Add 'expired' to the verification_status enum
ALTER TYPE public.user_verification_status ADD VALUE IF NOT EXISTS 'expired';

-- 2. Create the function that will be called by the cron job
CREATE OR REPLACE FUNCTION public.expire_transient_residents()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Mark transient residents as expired if their end date has passed.
  -- This flips their verification_status from 'verified' to 'expired',
  -- which immediately revokes their ability to submit new complaints,
  -- but still allows them to log in and re-verify.
  UPDATE public.users
  SET verification_status = 'expired',
      is_active = false
  WHERE residency_end_date IS NOT NULL
    AND residency_end_date < CURRENT_DATE
    AND verification_status = 'verified';
END;
$$;

-- 3. Schedule the cron job (runs daily at midnight UTC)
-- Note: Requires the pg_cron extension. If the extension is not available
-- (e.g. on a local dev setup without it), we gracefully skip the scheduling.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule(
      'expire_transient_residents_daily',
      '0 0 * * *',
      'SELECT public.expire_transient_residents()'
    );
  ELSE
    RAISE NOTICE 'pg_cron extension is not installed. Expiry function created but not scheduled.';
  END IF;
END
$$;
