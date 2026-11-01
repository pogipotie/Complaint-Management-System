-- Escalation is a referral, not a new complaint status.
ALTER TABLE public.complaints
  ADD COLUMN escalated_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN escalated_by_role text,
  ADD COLUMN escalated_at timestamptz,
  ADD COLUMN escalation_reason text;

-- Append-only activity is independent of generic updated_at and cannot be
-- written through the public API. Only database triggers record captain action.
CREATE TABLE public.complaint_captain_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id uuid NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  action text NOT NULL CHECK (action IN ('status_change', 'response')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX complaint_captain_actions_latest_idx
  ON public.complaint_captain_actions (complaint_id, created_at DESC);
ALTER TABLE public.complaint_captain_actions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.complaint_captain_actions FROM anon, authenticated;

-- Preserve available historical action for existing complaints. Creation
-- history and automatic/internal notes do not count as captain responses.
INSERT INTO public.complaint_captain_actions (complaint_id, actor_id, action, created_at)
SELECT h.complaint_id, h.changed_by, 'status_change', h.created_at
FROM public.complaint_status_history h
JOIN public.users u ON u.id = h.changed_by
JOIN public.complaints c ON c.id = h.complaint_id
WHERE u.role = 'brgy_captain' AND u.barangay = c.barangay
  AND h.from_status IS NOT NULL AND h.from_status IS DISTINCT FROM h.to_status
UNION ALL
SELECT m.complaint_id, m.user_id, 'response', m.created_at
FROM public.complaint_comments m
JOIN public.users u ON u.id = m.user_id
JOIN public.complaints c ON c.id = m.complaint_id
WHERE u.role = 'brgy_captain' AND u.barangay = c.barangay
  AND NOT m.is_internal;

CREATE FUNCTION public.complaint_escalation_eligible_at(cid uuid)
RETURNS timestamptz LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT greatest(c.created_at, coalesce(
    (SELECT max(a.created_at) FROM public.complaint_captain_actions a
     WHERE a.complaint_id = c.id), c.created_at
  )) + interval '24 hours'
  FROM public.complaints c WHERE c.id = cid;
$$;
REVOKE ALL ON FUNCTION public.complaint_escalation_eligible_at(uuid) FROM PUBLIC;

CREATE FUNCTION public.get_complaint_escalation_eligibility(cid uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  complaint public.complaints%ROWTYPE;
  actor public.users%ROWTYPE;
  eligible_at timestamptz;
BEGIN
  SELECT * INTO actor FROM public.users WHERE id = auth.uid() AND is_active;
  IF NOT FOUND THEN RAISE EXCEPTION 'An active account is required.'; END IF;
  SELECT * INTO complaint FROM public.complaints WHERE id = cid;
  IF NOT FOUND OR NOT (
    (actor.role = 'citizen' AND complaint.created_by = actor.id)
    OR (actor.role = 'brgy_captain' AND complaint.barangay = actor.barangay)
    OR actor.role = 'admin'
  ) THEN RAISE EXCEPTION 'You cannot access this complaint.'; END IF;

  eligible_at := public.complaint_escalation_eligible_at(cid);
  RETURN jsonb_build_object(
    'can_escalate', complaint.status IN ('pending', 'assigned')
      AND NOT complaint.is_escalated
      AND (actor.role = 'brgy_captain'
        OR (actor.role = 'citizen' AND now() >= eligible_at)),
    'eligible_at', eligible_at,
    'server_now', now(),
    'status', complaint.status,
    'is_escalated', complaint.is_escalated,
    'escalated_by', complaint.escalated_by,
    'escalated_by_role', complaint.escalated_by_role,
    'escalated_at', complaint.escalated_at,
    'escalation_reason', complaint.escalation_reason
  );
END;
$$;
REVOKE ALL ON FUNCTION public.get_complaint_escalation_eligibility(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_complaint_escalation_eligibility(uuid) TO authenticated;

-- All writes, including direct REST updates, obey the same escalation checks.
CREATE FUNCTION public.guard_complaint_escalation()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  actor public.users%ROWTYPE;
  eligible_at timestamptz;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.is_escalated OR NEW.escalated_by IS NOT NULL
      OR NEW.escalated_by_role IS NOT NULL OR NEW.escalated_at IS NOT NULL
      OR NEW.escalation_reason IS NOT NULL THEN
      RAISE EXCEPTION 'New complaints cannot be created already escalated.';
    END IF;
    IF EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'citizen') THEN
      NEW.created_at := now();
    END IF;
    RETURN NEW;
  END IF;

  SELECT * INTO actor FROM public.users WHERE id = auth.uid() AND is_active;
  IF OLD.is_escalated AND actor.role = 'brgy_captain' AND (
    NEW.status IS DISTINCT FROM OLD.status
    OR NEW.resolution_notes IS DISTINCT FROM OLD.resolution_notes
    OR NEW.resolution_images IS DISTINCT FROM OLD.resolution_images
  ) THEN RAISE EXCEPTION 'Only administrators can handle an escalated complaint.'; END IF;

  IF NEW.is_escalated IS DISTINCT FROM OLD.is_escalated THEN
    IF OLD.is_escalated THEN RAISE EXCEPTION 'Escalation cannot be reversed.'; END IF;
    IF actor.id IS NULL OR NOT (
      (actor.role = 'citizen' AND OLD.created_by = actor.id)
      OR (actor.role = 'brgy_captain' AND OLD.barangay = actor.barangay)
    ) THEN RAISE EXCEPTION 'Only the complaint owner or its Barangay Captain can escalate.'; END IF;
    IF OLD.status NOT IN ('pending', 'assigned') OR NEW.status IS DISTINCT FROM OLD.status THEN
      RAISE EXCEPTION 'Only pending or assigned complaints can be escalated without changing status.';
    END IF;
    IF NEW.created_by IS DISTINCT FROM OLD.created_by
      OR NEW.barangay IS DISTINCT FROM OLD.barangay
      OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
      RAISE EXCEPTION 'Complaint ownership, location and submission date cannot change during escalation.';
    END IF;
    IF char_length(btrim(coalesce(NEW.escalation_reason, ''))) NOT BETWEEN 10 AND 2000 THEN
      RAISE EXCEPTION 'Provide an escalation reason between 10 and 2000 characters.';
    END IF;
    eligible_at := public.complaint_escalation_eligible_at(OLD.id);
    IF actor.role = 'citizen' AND now() < eligible_at THEN
      RAISE EXCEPTION 'Escalation is available after 24 hours without captain action, at %.', eligible_at;
    END IF;
    NEW.escalated_by := actor.id;
    NEW.escalated_by_role := actor.role::text;
    NEW.escalated_at := now();
    NEW.escalation_reason := btrim(NEW.escalation_reason);
  ELSIF NEW.escalated_by IS DISTINCT FROM OLD.escalated_by
    OR NEW.escalated_by_role IS DISTINCT FROM OLD.escalated_by_role
    OR NEW.escalated_at IS DISTINCT FROM OLD.escalated_at
    OR NEW.escalation_reason IS DISTINCT FROM OLD.escalation_reason THEN
    -- Permit only the FK's ON DELETE SET NULL when an actor account is deleted.
    IF NOT (pg_trigger_depth() > 1 AND NEW.escalated_by IS NULL
      AND NEW.escalated_by_role IS NOT DISTINCT FROM OLD.escalated_by_role
      AND NEW.escalated_at IS NOT DISTINCT FROM OLD.escalated_at
      AND NEW.escalation_reason IS NOT DISTINCT FROM OLD.escalation_reason) THEN
      RAISE EXCEPTION 'Escalation history cannot be edited.';
    END IF;
  END IF;

  -- Prevent owners from bypassing the waiting rule by backdating or reassigning.
  IF actor.role = 'citizen' AND (
    NEW.created_at IS DISTINCT FROM OLD.created_at
    OR NEW.created_by IS DISTINCT FROM OLD.created_by
    OR NEW.status IS DISTINCT FROM OLD.status
  ) THEN RAISE EXCEPTION 'Citizens cannot change complaint status, ownership or submission date.'; END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_guard_complaint_escalation
BEFORE INSERT OR UPDATE ON public.complaints
FOR EACH ROW EXECUTE FUNCTION public.guard_complaint_escalation();

CREATE FUNCTION public.record_complaint_captain_action()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status AND NOT OLD.is_escalated
    AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid()
      AND role = 'brgy_captain' AND is_active AND barangay = OLD.barangay) THEN
    INSERT INTO public.complaint_captain_actions (complaint_id, actor_id, action)
    VALUES (NEW.id, auth.uid(), 'status_change');
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_record_complaint_captain_action
AFTER UPDATE ON public.complaints
FOR EACH ROW EXECUTE FUNCTION public.record_complaint_captain_action();

CREATE FUNCTION public.record_captain_complaint_response()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  complaint public.complaints%ROWTYPE;
BEGIN
  -- Serialize responses with escalation and status updates on the parent row.
  SELECT * INTO complaint FROM public.complaints WHERE id = NEW.complaint_id FOR UPDATE;
  IF NOT NEW.is_internal AND NEW.user_id = auth.uid() AND NOT complaint.is_escalated
    AND complaint.status IN ('pending', 'assigned')
    AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid()
      AND role = 'brgy_captain' AND is_active AND barangay = complaint.barangay) THEN
    INSERT INTO public.complaint_captain_actions (complaint_id, actor_id, action)
    VALUES (complaint.id, auth.uid(), 'response');
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_record_captain_complaint_response
BEFORE INSERT ON public.complaint_comments
FOR EACH ROW EXECUTE FUNCTION public.record_captain_complaint_response();

CREATE FUNCTION public.escalate_complaint(cid uuid, reason text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  complaint public.complaints%ROWTYPE;
BEGIN
  SELECT * INTO complaint FROM public.complaints WHERE id = cid FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Complaint not found.'; END IF;
  -- This also verifies actor access before returning duplicate-state information.
  PERFORM public.get_complaint_escalation_eligibility(cid);
  IF complaint.is_escalated THEN RAISE EXCEPTION 'This complaint has already been escalated.'; END IF;
  UPDATE public.complaints SET is_escalated = true, escalation_reason = reason
  WHERE id = cid RETURNING * INTO complaint;
  RETURN jsonb_build_object(
    'is_escalated', complaint.is_escalated,
    'escalated_by', complaint.escalated_by,
    'escalated_by_role', complaint.escalated_by_role,
    'escalated_at', complaint.escalated_at,
    'escalation_reason', complaint.escalation_reason
  );
END;
$$;
REVOKE ALL ON FUNCTION public.escalate_complaint(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.escalate_complaint(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.on_complaint_escalation()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  actor_label text;
BEGIN
  IF NEW.is_escalated AND NOT OLD.is_escalated THEN
    actor_label := CASE WHEN NEW.escalated_by_role = 'citizen'
      THEN 'the citizen after 24 hours without captain action'
      ELSE 'the Barangay Captain' END;
    INSERT INTO public.notifications(user_id, complaint_id, type, title, body, should_email)
    SELECT id, NEW.id, 'system', 'Complaint Escalated',
      concat('Complaint "', NEW.title, '" in ', NEW.barangay, ' was escalated by ',
        actor_label, '. Reason: ', NEW.escalation_reason), false
    FROM public.users WHERE role = 'admin' AND is_active;

    INSERT INTO public.notifications(user_id, complaint_id, type, title, body, should_email)
    VALUES (NEW.created_by, NEW.id, 'status_changed', 'Complaint Escalated',
      concat('Your complaint "', NEW.title, '" has been referred to the Municipal Admin. Reason: ',
        NEW.escalation_reason), true);

    IF NEW.escalated_by_role = 'citizen' THEN
      INSERT INTO public.notifications(user_id, complaint_id, type, title, body, should_email)
      SELECT id, NEW.id, 'system', 'Citizen Escalated Complaint',
        concat('A citizen referred complaint "', NEW.title, '" to the Municipal Admin. Reason: ',
          NEW.escalation_reason), false
      FROM public.users WHERE role = 'brgy_captain' AND barangay = NEW.barangay AND is_active;
    END IF;

    INSERT INTO public.complaint_comments (complaint_id, user_id, body, is_internal)
    VALUES (NEW.id, NEW.escalated_by,
      concat('Complaint escalated to Municipal Admin by ', actor_label,
        '. Reason: ', NEW.escalation_reason), true);
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger functions are not callable API endpoints.
REVOKE ALL ON FUNCTION public.guard_complaint_escalation() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.record_complaint_captain_action() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.record_captain_complaint_response() FROM PUBLIC;
