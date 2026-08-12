-- ============================================================================
-- Fix stale enum literal in prevent_reverting_resolved_status()
--
-- The function body still contains the string literal 'in_progress' inside
-- an `IN (...)` list. PostgreSQL evaluates that list as a single implicit
-- cast of every literal to the column's enum type, and the new
-- complaint_status enum no longer includes 'in_progress', so every UPDATE
-- on complaints fails with 22P02 before the trigger condition is even
-- checked.
--
-- Since 'in_progress' was merged into 'assigned' during the workflow
-- simplification, dropping the literal preserves the original semantics.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.prevent_reverting_resolved_status()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- If the old status was 'resolved' and the new status is one of the earlier ones or rejected
  IF OLD.status = 'resolved' AND NEW.status IN ('pending', 'assigned', 'rejected') THEN
    RAISE EXCEPTION 'Cannot revert a resolved complaint back to % status.', NEW.status;
  END IF;

  RETURN NEW;
END;
$function$;
