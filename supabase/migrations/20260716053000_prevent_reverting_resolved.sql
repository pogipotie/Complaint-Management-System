-- Prevent reverting from 'resolved' to earlier statuses
CREATE OR REPLACE FUNCTION prevent_reverting_resolved_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- If the old status was 'resolved' and the new status is one of the earlier ones
  IF OLD.status = 'resolved' AND NEW.status IN ('pending', 'assigned', 'in_progress') THEN
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
