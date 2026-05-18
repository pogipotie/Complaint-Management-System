-- Update the escalation trigger to include the barangay name in the notification text

CREATE OR REPLACE FUNCTION public.on_complaint_escalation()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF (NEW.is_escalated = true AND OLD.is_escalated = false) THEN
    -- Notify all admins
    INSERT INTO public.notifications(user_id, complaint_id, type, title, body, should_email)
    SELECT id, NEW.id, 'system', 'Complaint Escalated', concat('A complaint "', NEW.title, '" was escalated by the Barangay Captain of ', NEW.barangay, '.'), false
    FROM public.users WHERE role = 'admin';
  END IF;

  RETURN NEW;
END;
$$;