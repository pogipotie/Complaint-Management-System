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
--   4. Temporarily detach RLS policies that depend on the 'status' column,
--      swap the enum type, then re-attach the policies verbatim.
--      (PostgreSQL forbids ALTER TYPE on columns referenced by policies
--       even when the policy expression does not mention the column.)
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
-- Snapshot every RLS policy that depends on columns we are about to retype,
-- drop those policies, perform the column type swap, then recreate them
-- byte-for-byte. We keep the snapshot in a temp table so we can replay it.
CREATE TEMP TABLE _status_policy_snapshot (
  schemaname text,
  tablename  text,
  policyname text,
  cmd        text,
  qual       text,
  with_check text,
  roles      text[]
) ON COMMIT DROP;

INSERT INTO _status_policy_snapshot
SELECT
  n.nspname  AS schemaname,
  c.relname  AS tablename,
  p.polname  AS policyname,
  CASE p.polcmd
    WHEN 'r' THEN 'SELECT'
    WHEN 'a' THEN 'INSERT'
    WHEN 'w' THEN 'UPDATE'
    WHEN 'd' THEN 'DELETE'
    ELSE 'ALL'
  END        AS cmd,
  pg_get_expr(p.polqual,      c.oid) AS qual,
  pg_get_expr(p.polwithcheck, c.oid) AS with_check,
  (
    SELECT array_agg(rolname ORDER BY rolname)
    FROM pg_roles
    WHERE oid = ANY (p.polroles)
  )         AS roles
FROM pg_policy p
JOIN pg_class c ON c.oid = p.polrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN ('complaints', 'complaint_status_history')
  AND c.oid IN (
    -- Only policies whose dependency set includes the 'status' column
    -- (or the 'from_status'/'to_status' columns) of the same table.
    SELECT refobjid
    FROM pg_depend d
    JOIN pg_attribute a ON a.attrelid = d.refobjid AND a.attnum = d.refobjsubid
    WHERE d.classid = 'pg_policy'::regclass
      AND d.refobjid = c.oid
      AND a.attname IN ('status', 'from_status', 'to_status')
  );

-- Drop the dependent policies (CASCADE just in case they are nested).
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN SELECT tablename, policyname FROM _status_policy_snapshot LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I CASCADE;', r.policyname, r.tablename);
  END LOOP;
END $$;

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

-- Restore the policies using their captured qual/with_check expressions
DO $$
DECLARE
  r record;
  roles_csv text;
BEGIN
  FOR r IN SELECT * FROM _status_policy_snapshot LOOP
    roles_csv := array_to_string(r.roles, ', ');

    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR %s TO %s USING (%s) WITH CHECK (%s);',
      r.policyname,
      r.tablename,
      r.cmd,
      roles_csv,
      COALESCE(r.qual, 'true'),
      COALESCE(r.with_check, 'true')
    );
  END LOOP;
END $$;

-- The temp table is dropped automatically at end of transaction.
