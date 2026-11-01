-- Recover missing dates only from an actual transition into resolved.
UPDATE public.complaints c
SET resolved_at = history.resolved_at
FROM (
  SELECT h.complaint_id, min(h.created_at) AS resolved_at
  FROM public.complaint_status_history h
  JOIN public.complaints complaint ON complaint.id = h.complaint_id
  WHERE h.to_status = 'resolved'
    AND h.from_status IS NOT NULL AND h.from_status <> 'resolved'
    AND h.created_at >= complaint.created_at AND h.created_at <= now()
  GROUP BY h.complaint_id
) history
WHERE c.id = history.complaint_id
  AND c.status = 'resolved' AND c.resolved_at IS NULL;

CREATE FUNCTION public.set_complaint_resolution_timestamp()
RETURNS trigger LANGUAGE plpgsql SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.resolved_at := CASE WHEN NEW.status = 'resolved' THEN statement_timestamp() ELSE NULL END;
  ELSIF OLD.status <> 'resolved' AND NEW.status = 'resolved' THEN
    NEW.resolved_at := statement_timestamp();
  ELSIF OLD.status = 'resolved' THEN
    -- Preserve even an unknown legacy date instead of guessing on a later edit.
    NEW.resolved_at := OLD.resolved_at;
  ELSE
    NEW.resolved_at := NULL;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_complaint_resolution_timestamp
BEFORE INSERT OR UPDATE ON public.complaints
FOR EACH ROW EXECUTE FUNCTION public.set_complaint_resolution_timestamp();

REVOKE ALL ON FUNCTION public.set_complaint_resolution_timestamp() FROM PUBLIC;
