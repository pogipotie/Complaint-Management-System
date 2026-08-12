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
--      and function (the 'closed' value no longer exists).
--   3. Snapshot every RLS policy, view/matview, and trigger that depends
--      on the 'status' / 'from_status' / 'to_status' columns.
--      (PostgreSQL refuses ALTER TYPE on a column referenced by any of
--       these — even when the body never names the column directly. The
--       dependency is recorded in pg_depend at creation time.)
--   4. Drop the dependent objects, swap the enum type, then recreate
--      them verbatim from the captured snapshots.
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
-- 2. Drop the obsolete captain-closing trigger and its function.
--    'closed' is no longer a valid status value, so this guard is redundant.
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS restrict_captain_closing_complaint_trigger ON public.complaints;
DROP FUNCTION IF EXISTS restrict_captain_closing_complaint();

-- ----------------------------------------------------------------------------
-- 3. Snapshot dependent objects BEFORE we drop them
-- ----------------------------------------------------------------------------

-- 3a. RLS policies
--     A policy registers a pg_depend entry on every column it references —
--     including columns reached transitively through a subquery (e.g. a
--     policy on complaint_status_history that selects from complaints.c.id
--     is also recorded as depending on the complaints.status column).
--     Therefore we must look at ALL policies on the two affected tables
--     AND check whether ANY of their dependencies point to a status
--     column on complaints or complaint_status_history.
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
JOIN pg_class c     ON c.oid = p.polrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN ('complaints', 'complaint_status_history')
  AND EXISTS (
    -- The policy has at least one dependency on a 'status' /
    -- 'from_status' / 'to_status' column on either of the two
    -- tables we're about to retype. The dependency may be on the
    -- policy's own table or on a table the policy references in
    -- a subquery.
    SELECT 1
    FROM pg_depend d
    JOIN pg_attribute a
      ON a.attrelid = d.refobjid
     AND a.attnum  = d.refobjsubid
    WHERE d.classid = 'pg_policy'::regclass
      AND d.objid   = p.oid
      AND d.refobjid IN (
        'public.complaints'::regclass,
        'public.complaint_status_history'::regclass
      )
      AND a.attname IN ('status', 'from_status', 'to_status')
  );

-- 3b. Views / materialized views
CREATE TEMP TABLE _status_view_snapshot (
  schemaname    text,
  viewname      text,
  relkind       char,
  definition    text,
  is_populated  boolean,
  relacl        aclitem[]
) ON COMMIT DROP;

INSERT INTO _status_view_snapshot
SELECT DISTINCT
  n.nspname                       AS schemaname,
  c.relname                       AS viewname,
  c.relkind                       AS relkind,
  pg_get_viewdef(c.oid, true)     AS definition,
  c.relispopulated                AS is_populated,
  c.relacl                        AS relacl
FROM pg_rewrite r
JOIN pg_class c       ON c.oid = r.ev_class
JOIN pg_namespace n   ON n.oid = c.relnamespace
JOIN pg_depend d      ON d.objid = r.oid AND d.classid = 'pg_rewrite'::regclass
JOIN pg_attribute a   ON a.attrelid = d.refobjid AND a.attnum = d.refobjsubid
WHERE n.nspname = 'public'
  AND c.relkind IN ('v', 'm')
  AND d.refobjid IN ('public.complaints'::regclass, 'public.complaint_status_history'::regclass)
  AND a.attname IN ('status', 'from_status', 'to_status');

-- 3c. Triggers on the affected tables. We capture the canonical CREATE
--     TRIGGER text (via pg_get_triggerdef) so we can replay it verbatim
--     after the column type is swapped. The trigger function bodies
--     are left alone — string literals compared against NEW.status /
--     OLD.status will be implicitly cast to the new enum type when the
--     trigger fires, so the functions remain valid.
CREATE TEMP TABLE _status_trigger_snapshot (
  schemaname    text,
  tablename     text,
  triggername   text,
  tgdef         text
) ON COMMIT DROP;

INSERT INTO _status_trigger_snapshot
SELECT
  n.nspname,
  c.relname,
  t.tgname,
  pg_get_triggerdef(t.oid)
FROM pg_trigger t
JOIN pg_class c        ON c.oid = t.tgrelid
JOIN pg_namespace n    ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN ('complaints', 'complaint_status_history')
  AND NOT t.tgisinternal;

-- ----------------------------------------------------------------------------
-- 4. Drop the dependent objects
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  r record;
BEGIN
  -- Triggers first (they reference the trigger functions; functions are
  -- left intact because their bodies are still valid against the new
  -- enum type once the column is swapped)
  FOR r IN SELECT tablename, triggername FROM _status_trigger_snapshot LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I CASCADE;', r.triggername, r.tablename);
  END LOOP;

  -- Policies
  FOR r IN SELECT tablename, policyname FROM _status_policy_snapshot LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I CASCADE;', r.policyname, r.tablename);
  END LOOP;

  -- Views / materialized views
  FOR r IN SELECT viewname, relkind FROM _status_view_snapshot LOOP
    IF r.relkind = 'm' THEN
      EXECUTE format('DROP MATERIALIZED VIEW IF EXISTS public.%I CASCADE;', r.viewname);
    ELSE
      EXECUTE format('DROP VIEW IF EXISTS public.%I CASCADE;', r.viewname);
    END IF;
  END LOOP;
END $$;

-- ----------------------------------------------------------------------------
-- 5. Swap the enum type
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- 6. Recreate the dependent objects from the snapshots
-- ----------------------------------------------------------------------------

-- 6a. Views / materialized views + ACLs
DO $$
DECLARE
  r record;
  acl_item record;
  grant_sql text;
BEGIN
  FOR r IN SELECT * FROM _status_view_snapshot ORDER BY relkind, viewname LOOP
    IF r.relkind = 'm' THEN
      EXECUTE format('CREATE MATERIALIZED VIEW public.%I AS %s;', r.viewname, r.definition);
      IF r.is_populated THEN
        EXECUTE format('REFRESH MATERIALIZED VIEW public.%I;', r.viewname);
      END IF;
    ELSE
      EXECUTE format('CREATE VIEW public.%I AS %s;', r.viewname, r.definition);
    END IF;

    IF r.relacl IS NOT NULL THEN
      FOR acl_item IN
        SELECT grantee::regrole::text AS grantee_text,
               privilege_type,
               is_grantable
        FROM aclexplode(r.relacl) a(grantor, grantee, privilege_type, is_grantable)
        WHERE grantee <> 0
      LOOP
        grant_sql := format(
          'GRANT %s ON public.%I TO %s%s;',
          acl_item.privilege_type,
          r.viewname,
          acl_item.grantee_text,
          CASE WHEN acl_item.is_grantable THEN ' WITH GRANT OPTION' ELSE '' END
        );
        EXECUTE grant_sql;
      END LOOP;
    END IF;
  END LOOP;
END $$;

-- 6b. RLS policies
--
-- Three extra concerns when replaying the captured expressions:
--
--   (a) `array_agg(rolname) WHERE oid = ANY (p.polroles)` returns NULL
--       when the policy was created without a `TO` clause (i.e. applies
--       to PUBLIC, stored as oid 0). We must therefore omit the `TO`
--       clause entirely in that case rather than emitting `TO  USING ...`.
--
--   (b) The captured qual/with_check text can contain string literals
--       typed against the OLD enum, e.g. `'closed'::complaint_status`
--       or `'in_progress'::complaint_status`. Those casts would fail at
--       parse time against the new enum. We rewrite them in-place to
--       the merged equivalents so the expressions are still valid
--       ('closed' -> 'resolved', 'in_progress' -> 'assigned').
--
--   (c) PostgreSQL only allows WITH CHECK on INSERT and UPDATE policies.
--       SELECT and DELETE policies must not emit a WITH CHECK clause
--       (even as `WITH CHECK (true)`). We branch on the policy command.
DO $$
DECLARE
  r record;
  roles_csv text;
  fixed_qual text;
  fixed_check text;
  prefix text;
  using_clause text;
  check_clause text;
  to_clause text;
  stmt text;
BEGIN
  FOR r IN SELECT * FROM _status_policy_snapshot LOOP
    roles_csv := array_to_string(r.roles, ', ');

    -- Rewrite references to the dropped enum values. We replace both the
    -- type-cast and the bare string-literal forms so the expression
    -- remains semantically equivalent.
    fixed_qual := r.qual;
    fixed_check := r.with_check;

    -- 'closed' -> 'resolved' (the merge target)
    fixed_qual  := REPLACE(fixed_qual,  '''closed''::complaint_status',       '''resolved''::complaint_status');
    fixed_check := REPLACE(fixed_check, '''closed''::complaint_status',       '''resolved''::complaint_status');
    fixed_qual  := REPLACE(fixed_qual,  '''closed''',                        '''resolved''');
    fixed_check := REPLACE(fixed_check, '''closed''',                        '''resolved''');

    -- 'in_progress' -> 'assigned' (the merge target)
    fixed_qual  := REPLACE(fixed_qual,  '''in_progress''::complaint_status',  '''assigned''::complaint_status');
    fixed_check := REPLACE(fixed_check, '''in_progress''::complaint_status',  '''assigned''::complaint_status');
    fixed_qual  := REPLACE(fixed_qual,  '''in_progress''',                   '''assigned''');
    fixed_check := REPLACE(fixed_check, '''in_progress''',                   '''assigned''');

    -- SELECT / DELETE: USING only, no WITH CHECK
    -- INSERT: WITH CHECK only, no USING (in our case we fall back to 'true')
    -- UPDATE: both USING and WITH CHECK
    IF r.cmd = 'SELECT' OR r.cmd = 'DELETE' THEN
      using_clause := format('USING (%s)', COALESCE(fixed_qual, 'true'));
      check_clause := '';
    ELSIF r.cmd = 'INSERT' THEN
      using_clause := '';
      check_clause := format('WITH CHECK (%s)', COALESCE(fixed_check, 'true'));
    ELSE
      using_clause := format('USING (%s)', COALESCE(fixed_qual, 'true'));
      check_clause := format('WITH CHECK (%s)', COALESCE(fixed_check, 'true'));
    END IF;

    IF roles_csv IS NULL OR roles_csv = '' THEN
      to_clause := '';
    ELSE
      to_clause := format('TO %s ', roles_csv);
    END IF;

    stmt := format(
      'CREATE POLICY %I ON public.%I FOR %s %s%s%s;',
      r.policyname,
      r.tablename,
      r.cmd,
      to_clause,
      using_clause,
      check_clause
    );

    EXECUTE stmt;
  END LOOP;
END $$;

-- 6c. Triggers (replayed via pg_get_triggerdef).
--     The prevent_reverting_resolved_status function body is left intact
--     because its string literals are compared against NEW/OLD.status and
--     are implicitly cast to the new enum type at comparison time.
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN SELECT * FROM _status_trigger_snapshot LOOP
    EXECUTE r.tgdef;
  END LOOP;
END $$;

-- The temp tables are dropped automatically at end of transaction.
