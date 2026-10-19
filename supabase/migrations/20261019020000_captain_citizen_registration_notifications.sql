BEGIN;

ALTER TABLE public.notifications ADD COLUMN related_user_id uuid
REFERENCES public.users(id) ON DELETE SET NULL;

CREATE FUNCTION public.notify_captains_citizen_registration()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NEW.role = 'citizen' AND NEW.verification_status = 'pending'
     AND NEW.barangay IS NOT NULL THEN
    INSERT INTO public.notifications(user_id, related_user_id, type, title, body, should_email)
    SELECT captain.id, NEW.id, 'system', 'New Citizen Registration',
           NEW.full_name || ' registered in ' || NEW.barangay || ' and is awaiting verification.', false
    FROM public.users captain
    WHERE captain.role = 'brgy_captain' AND captain.barangay = NEW.barangay
      AND captain.is_active AND captain.verification_status = 'verified';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_captain_citizen_registration_notification
AFTER INSERT ON public.users FOR EACH ROW
EXECUTE FUNCTION public.notify_captains_citizen_registration();

-- Preserve existing admin/staff notices and include same-barangay captains.
CREATE OR REPLACE FUNCTION public.notify_admins_user_resubmission()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF OLD.verification_status = 'rejected' AND NEW.verification_status = 'pending' THEN
    INSERT INTO public.notifications(user_id, related_user_id, type, title, body, should_email)
    SELECT recipient.id, NEW.id, 'system', 'Registration Resubmitted',
           NEW.full_name || ' has updated their profile/ID and is requesting re-verification.', false
    FROM public.users recipient
    WHERE recipient.role IN ('admin', 'staff')
       OR (NEW.role = 'citizen' AND recipient.role = 'brgy_captain'
           AND recipient.barangay = NEW.barangay
           AND recipient.is_active AND recipient.verification_status = 'verified');
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.notify_captains_citizen_registration() FROM PUBLIC;

COMMIT;
