-- 0008_admin_notifications.sql

-- Update the status change trigger to include notification for admins on new complaints
CREATE OR REPLACE FUNCTION public.on_complaint_status_change()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO public.complaint_status_history(complaint_id, from_status, to_status, changed_by, note)
    VALUES (NEW.id, NULL, NEW.status, NEW.created_by, 'Complaint created');
    
    -- Notify the citizen
    INSERT INTO public.notifications(user_id, complaint_id, type, title, body, should_email)
    VALUES (NEW.created_by, NEW.id, 'complaint_created', 'Complaint submitted', 'Your complaint was submitted and is now pending review.', true);
    
    -- Notify all admins
    INSERT INTO public.notifications(user_id, complaint_id, type, title, body, should_email)
    SELECT id, NEW.id, 'complaint_created', 'New Complaint Reported', concat('A new complaint "', NEW.title, '" was submitted.'), false
    FROM public.users WHERE role = 'admin';

    RETURN NEW;
  END IF;
  
  IF (TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status) THEN
    INSERT INTO public.complaint_status_history(complaint_id, from_status, to_status, changed_by, note)
    VALUES (NEW.id, OLD.status, NEW.status, auth.uid(), NEW.resolution_notes);
    
    -- Notify the citizen of the status change
    INSERT INTO public.notifications(user_id, complaint_id, type, title, body, should_email)
    VALUES (
      NEW.created_by, 
      NEW.id, 
      'status_changed', 
      'Complaint status updated', 
      concat('The status of your complaint has been updated to ', upper(replace(NEW.status::text, '_', ' ')), '.'), 
      true
    );
    
    RETURN NEW;
  END IF;
  
  RETURN NEW;
END;
$$;
