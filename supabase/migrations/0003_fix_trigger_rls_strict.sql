-- Revert triggers to normal (non-security definer)
CREATE OR REPLACE FUNCTION public.on_complaint_status_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO public.complaint_status_history(complaint_id, from_status, to_status, changed_by, note)
    VALUES (NEW.id, NULL, NEW.status, NEW.created_by, 'Complaint created');
    
    INSERT INTO public.notifications(user_id, complaint_id, type, title, body, should_email)
    VALUES (NEW.created_by, NEW.id, 'complaint_created', 'Complaint submitted', 'Your complaint was submitted and is now pending review.', true);
    
    RETURN NEW;
  END IF;
  
  IF (TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status) THEN
    INSERT INTO public.complaint_status_history(complaint_id, from_status, to_status, changed_by, note)
    VALUES (NEW.id, OLD.status, NEW.status, auth.uid(), NEW.resolution_notes);
    
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

CREATE OR REPLACE FUNCTION public.audit_complaints_update()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;
  
  INSERT INTO public.audit_logs(actor_user_id, entity_type, entity_id, action, meta)
  VALUES (
    auth.uid(),
    'complaints',
    NEW.id,
    'UPDATE',
    jsonb_build_object('changed_fields', (SELECT jsonb_object_agg(k, v) FROM jsonb_each(to_jsonb(NEW)) AS t(k,v) WHERE to_jsonb(OLD)->k IS DISTINCT FROM v))
  );
  
  RETURN NEW;
END;
$$;

-- Add strict RLS INSERT policies instead

-- First, drop the policies if they already exist to avoid errors
DROP POLICY IF EXISTS "Users can insert status history for their actions" ON public.complaint_status_history;
DROP POLICY IF EXISTS "System/Users can insert notifications for owned complaints" ON public.notifications;
DROP POLICY IF EXISTS "Users can insert audit logs for their actions" ON public.audit_logs;

-- Allow users to insert history records IF they own the complaint or are admins/staff updating it
CREATE POLICY "Users can insert status history for their actions" ON public.complaint_status_history
FOR INSERT
WITH CHECK (
  changed_by = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.complaints c 
    WHERE c.id = complaint_id 
    AND (
      c.created_by = auth.uid() OR 
      public.current_role() = 'admin' OR 
      (public.current_role() = 'staff' AND c.assigned_department_id = (SELECT department_id FROM public.users WHERE id = auth.uid()))
    )
  )
);

-- Allow users to insert notifications (e.g. system generating a notification to the complaint owner)
CREATE POLICY "System/Users can insert notifications for owned complaints" ON public.notifications
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.complaints c 
    WHERE c.id = complaint_id 
    AND (
      c.created_by = auth.uid() OR 
      public.current_role() = 'admin' OR 
      public.current_role() = 'staff'
    )
  )
);

-- Allow admins/staff to insert audit logs
CREATE POLICY "Users can insert audit logs for their actions" ON public.audit_logs
FOR INSERT
WITH CHECK (
  actor_user_id = auth.uid() AND 
  public.current_role() IN ('admin', 'staff')
);
