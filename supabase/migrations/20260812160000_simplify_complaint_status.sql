-- ============================================================================
-- Simplify complaint status workflow:
--   * Remove 'in_progress' (Captains/Admins can now only use pending/assigned)
--   * Merge 'closed' into 'resolved' (resolved is now the terminal/closed state)
--
-- Migration strategy:
--   1. Map legacy values onto their new equivalents on both the live
--      'complaints' rows and the historical 'complaint_status_history' rows
--      so we don't lose audit-trail semantics.
--   2. Drop the now-obsolete 'restrict_captain_closing_complaint' trigger
--      (there is no longer a 'closed' value to gate).
--   3. Refresh the 'prevent_reverting_resolved_status' trigger to no
--      longer reference the removed enum values.
--   4. Swap the enum type for a new slimmer one.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Data backfill: re-map existing rows before the enum changes
-- ----------------------------------------------------------------------------
UPDATE public.complaints
SET status = 'assigned'
WHERE status = 'in_progress';

UPDATE public.complaints
SET status = 'resolved'
WHERE status = 'closed';

-- Mirror the same mapping onto the historical rows
UPDATE public.complaint_status_history
SET from_status = 'assigned'
WHERE from_status = 'in_progress';

UPDATE public.complaint_status_history
SET to_status = 'assigned'
WHERE to_status = 'in_progress';

UPDATE public.complaint_status_history
SET from_status = 'resolved'
WHERE from_status = 'closed';

UPDATE public.complaint_status_history
SET to_status = 'resolved'
WHERE to_status = 'closed';

-- ----------------------------------------------------------------------------
-- 2. Drop the obsolete captain-closing trigger (no 'closed' value anymore)
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS restrict_captain_closing_complaint_trigger ON public.complaints;
DROP FUNCTION IF EXISTS restrict_captain_closing_complaint();

-- ----------------------------------------------------------------------------
-- 3. Refresh the prevent-reverting-resolved trigger without the dropped values
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION prevent_reverting_resolved_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- A 'resolved' complaint is the terminal/closed state and may not be
  -- reverted to an earlier workflow state.
  IF OLD.status = 'resolved' AND NEW.status IN ('pending', 'assigned', 'rejected') THEN
    RAISE EXCEPTION 'Cannot revert a resolved complaint back to % status.', NEW.status;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_reverting_resolved_status_trigger ON public.complaints;
CREATE TRIGGER prevent_reverting_resolved_status_trigger
BEFORE UPDATE OF status ON public.complaints
FOR EACH ROW
EXECUTE FUNCTION prevent_reverting_resolved_status();

-- ----------------------------------------------------------------------------
-- 4. Swap the enum type
-- ----------------------------------------------------------------------------
-- The new enum is intentionally a fresh type so we can drop the old one
-- cleanly after column conversions.
CREATE TYPE public.complaint_status_new AS ENUM (
  'pending',
  'assigned',
  'resolved',
  'rejected'
);

-- Detach the default on complaints.status so we can retype the column safely
ALTER TABLE public.complaints
  ALTER COLUMN status DROP DEFAULT;

-- Convert both the live and history columns
ALTER TABLE public.complaints
  ALTER COLUMN status TYPE public.complaint_status_new
    USING status::text::public.complaint_status_new;

ALTER TABLE public.complaint_status_history
  ALTER COLUMN from_status TYPE public.complaint_status_new
    USING from_status::text::public.complaint_status_new,
  ALTER COLUMN to_status   TYPE public.complaint_status_new
    USING to_status::text::public.complaint_status_new;

-- Re-apply the default now that the column uses the new type
ALTER TABLE public.complaints
  ALTER COLUMN status SET DEFAULT 'pending'::public.complaint_status_new;

-- Drop the old enum and rename the new one to take its place
DROP TYPE public.complaint_status;
ALTER TYPE public.complaint_status_new RENAME TO complaint_status;
