-- Fix the escalation trigger to bypass RLS when querying users for notifications
-- By adding SECURITY DEFINER, the trigger runs with elevated privileges,
-- allowing the Captain to successfully find admin user IDs despite the strict
-- "Users can read own profile" RLS policy on public.users.

CREATE OR REPLACE FUNCTION public.on_complaint_escalation()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF (NEW.is_escalated = true AND OLD.is_escalated = false) THEN
    -- 1. Notify all admins
    INSERT INTO public.notifications(user_id, complaint_id, type, title, body, should_email)
    SELECT id, NEW.id, 'system', 'Complaint Escalated', concat('A complaint "', NEW.title, '" was escalated by the Barangay Captain of ', NEW.barangay, '.'), false
    FROM public.users WHERE role = 'admin';

    -- 2. Notify the citizen who created the complaint
    INSERT INTO public.notifications(user_id, complaint_id, type, title, body, should_email)
    VALUES (NEW.created_by, NEW.id, 'status_changed', 'Complaint Escalated', concat('Your complaint "', NEW.title, '" has been escalated to the Municipal Admin for assistance.'), true);
  END IF;

  RETURN NEW;
END;
$$;
