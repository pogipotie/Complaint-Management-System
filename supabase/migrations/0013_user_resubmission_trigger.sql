-- 0013_user_resubmission_trigger.sql

-- Trigger to notify admins when a user resubmits their registration
CREATE OR REPLACE FUNCTION public.notify_admins_user_resubmission()
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER 
AS $$
BEGIN
  -- Check if a rejected user changed their status back to pending
  IF OLD.verification_status = 'rejected' AND NEW.verification_status = 'pending' THEN
    
    -- Insert a system notification for every admin and staff member
    INSERT INTO public.notifications (user_id, type, title, body, should_email)
    SELECT 
      id as user_id,
      'system'::public.notification_type,
      'Registration Resubmitted' as title,
      NEW.full_name || ' has updated their profile/ID and is requesting re-verification.' as body,
      false
    FROM public.users
    WHERE role IN ('admin', 'staff');
    
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger on the users table
DROP TRIGGER IF EXISTS trg_user_resubmission_notification ON public.users;
CREATE TRIGGER trg_user_resubmission_notification
AFTER UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.notify_admins_user_resubmission();