-- 0006_citizen_features.sql

-- 1. Before & After Photo Proof
ALTER TABLE public.complaints
ADD COLUMN resolution_images text[] default '{}';

-- 2. Resolution Rating & Feedback
ALTER TABLE public.complaints
ADD COLUMN rating integer check (rating >= 1 and rating <= 5),
ADD COLUMN feedback_text text;

-- 3. Two-way Comments / Chat
CREATE TABLE public.complaint_comments (
  id uuid primary key default gen_random_uuid(),
  complaint_id uuid not null references public.complaints(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  body text not null check (char_length(body) > 0),
  is_internal boolean not null default false, -- if true, only staff/admins can see it
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
CREATE INDEX complaint_comments_complaint_idx ON public.complaint_comments (complaint_id, created_at asc);

-- Trigger for updated_at on comments
CREATE TRIGGER trg_complaint_comments_updated_at BEFORE UPDATE ON public.complaint_comments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS for Comments
ALTER TABLE public.complaint_comments ENABLE ROW LEVEL SECURITY;

-- Everyone involved can read public comments
CREATE POLICY "Users can read comments on accessible complaints" ON public.complaint_comments
FOR SELECT
USING (
  is_internal = false AND 
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

-- Staff/Admins can read internal comments
CREATE POLICY "Staff/Admins can read internal comments" ON public.complaint_comments
FOR SELECT
USING (
  is_internal = true AND 
  public.current_role() IN ('admin', 'staff') AND
  EXISTS (
    SELECT 1 FROM public.complaints c 
    WHERE c.id = complaint_id 
    AND (
      public.current_role() = 'admin' OR 
      c.assigned_department_id = (SELECT department_id FROM public.users WHERE id = auth.uid())
    )
  )
);

-- Users can insert comments if they have access to the complaint
CREATE POLICY "Users can insert comments" ON public.complaint_comments
FOR INSERT
WITH CHECK (
  user_id = auth.uid() AND
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

-- 4. Community Map & Upvoting
CREATE TABLE public.complaint_upvotes (
  complaint_id uuid not null references public.complaints(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  PRIMARY KEY (complaint_id, user_id)
);
CREATE INDEX complaint_upvotes_complaint_idx ON public.complaint_upvotes (complaint_id);

-- RLS for Upvotes
ALTER TABLE public.complaint_upvotes ENABLE ROW LEVEL SECURITY;

-- Anyone can read upvotes
CREATE POLICY "Anyone can read upvotes" ON public.complaint_upvotes FOR SELECT USING (true);

-- Citizens can insert their own upvote
CREATE POLICY "Citizens can insert own upvotes" ON public.complaint_upvotes FOR INSERT WITH CHECK (user_id = auth.uid());

-- Citizens can delete their own upvote
CREATE POLICY "Citizens can delete own upvotes" ON public.complaint_upvotes FOR DELETE USING (user_id = auth.uid());

-- Adjust Complaints SELECT policy so citizens can see public complaints on the community map
-- Wait, we need to allow citizens to read other people's complaints if they are not anonymous, 
-- or we can just expose basic data. Let's create a secure view for the community map instead to avoid leaking PII.

CREATE OR REPLACE VIEW public.community_complaints AS
SELECT 
  c.id,
  c.category_id,
  cat.name as category_name,
  c.status,
  c.priority,
  c.title,
  c.description,
  c.latitude,
  c.longitude,
  c.barangay,
  c.evidence_paths,
  c.created_at,
  c.resolved_at,
  (SELECT count(*) FROM public.complaint_upvotes u WHERE u.complaint_id = c.id) as upvote_count,
  EXISTS(SELECT 1 FROM public.complaint_upvotes u WHERE u.complaint_id = c.id AND u.user_id = auth.uid()) as has_upvoted
FROM public.complaints c
JOIN public.complaint_categories cat ON c.category_id = cat.id
WHERE c.status NOT IN ('rejected');

-- Add notification type for comments
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'new_comment';

-- Update the status change trigger to include notification for resolution
CREATE OR REPLACE FUNCTION public.on_complaint_status_change()
RETURNS trigger LANGUAGE plpgsql AS $$
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

-- Trigger for new comment notifications
CREATE OR REPLACE FUNCTION public.on_new_comment()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  complaint_owner uuid;
BEGIN
  IF NEW.is_internal = true THEN
    RETURN NEW;
  END IF;

  SELECT created_by INTO complaint_owner FROM public.complaints WHERE id = NEW.complaint_id;
  
  -- If the commenter is NOT the complaint owner, notify the owner
  IF NEW.user_id != complaint_owner THEN
    INSERT INTO public.notifications(user_id, complaint_id, type, title, body, should_email)
    VALUES (
      complaint_owner,
      NEW.complaint_id,
      'new_comment',
      'New Comment on your Complaint',
      'A staff member has left a comment on your complaint. Please review and reply if necessary.',
      true
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_new_comment AFTER INSERT ON public.complaint_comments FOR EACH ROW EXECUTE FUNCTION public.on_new_comment();
