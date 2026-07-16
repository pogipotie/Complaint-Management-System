-- Enforce permanent barangay for verified users
CREATE OR REPLACE FUNCTION prevent_verified_barangay_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- If the user is verified, and they are trying to change their barangay
  IF OLD.verification_status = 'verified' AND NEW.barangay IS DISTINCT FROM OLD.barangay THEN
    -- Prevent the change if the user is updating their own profile
    -- (Admins might still need to correct mistakes, so we check if auth.uid() matches the row id)
    IF auth.uid() = OLD.id THEN
      RAISE EXCEPTION 'Cannot change barangay after account verification is complete.';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_verified_barangay_update_trigger ON public.users;
CREATE TRIGGER prevent_verified_barangay_update_trigger
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION prevent_verified_barangay_update();
