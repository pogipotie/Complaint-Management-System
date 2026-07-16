-- Restrict Captains from closing complaints
CREATE OR REPLACE FUNCTION restrict_captain_closing_complaint()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- If the new status is 'closed'
  IF NEW.status = 'closed' AND OLD.status IS DISTINCT FROM 'closed' THEN
    -- Check if the current user is a captain
    IF (SELECT role FROM public.users WHERE id = auth.uid()) = 'brgy_captain' THEN
      RAISE EXCEPTION 'Only administrators can close complaints. Captains can only resolve them.';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS restrict_captain_closing_complaint_trigger ON public.complaints;
CREATE TRIGGER restrict_captain_closing_complaint_trigger
BEFORE UPDATE OF status ON public.complaints
FOR EACH ROW
EXECUTE FUNCTION restrict_captain_closing_complaint();
