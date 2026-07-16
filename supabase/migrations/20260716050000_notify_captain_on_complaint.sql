-- Update the complaint trigger to notify admins and the assigned barangay captain
CREATE OR REPLACE FUNCTION public.on_complaint_status_change()
RETURNS trigger LANGUAGE plpgsql AS $body
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

    -- Notify the Barangay Captain of that specific barangay
    IF NEW.barangay IS NOT NULL THEN
      INSERT INTO public.notifications(user_id, complaint_id, type, title, body, should_email)
      SELECT id, NEW.id, 'complaint_created', 'New Issue in Your Barangay', concat('A new issue "', NEW.title, '" was reported in ', NEW.barangay, '.'), false
      FROM public.users 
      WHERE role = 'brgy_captain' AND barangay = NEW.barangay;
    END IF;

    RETURN NEW;
  END IF;

  IF (TG_OP = 'UPDATE') THEN
    -- Handle status change
    IF (NEW.status IS DISTINCT FROM OLD.status) THEN
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
    END IF;

    -- Handle resolution rating added by citizen
    IF (NEW.rating IS DISTINCT FROM OLD.rating AND NEW.rating IS NOT NULL) THEN
      -- Notify all admins
      INSERT INTO public.notifications(user_id, complaint_id, type, title, body, should_email)
      SELECT id, NEW.id, 'system', 'Resolution Rating Submitted', concat('A citizen submitted a ', NEW.rating, '-star rating for complaint "', NEW.title, '".'), false
      FROM public.users WHERE role = 'admin';
      
      -- Also notify the Barangay Captain if they handled it
      IF NEW.barangay IS NOT NULL THEN
        INSERT INTO public.notifications(user_id, complaint_id, type, title, body, should_email)
        SELECT id, NEW.id, 'system', 'Resolution Rating Submitted', concat('A citizen submitted a ', NEW.rating, '-star rating for an issue in your barangay.'), false
        FROM public.users 
        WHERE role = 'brgy_captain' AND barangay = NEW.barangay;
      END IF;
    END IF;

    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$body;