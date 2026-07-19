-- Create trigger to notify citizens when a new announcement is created

CREATE OR REPLACE FUNCTION public.on_announcement_created()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    IF NEW.barangay IS NULL THEN
      -- Municipal announcement -> Notify ALL citizens
      INSERT INTO public.notifications(user_id, type, title, body, should_email)
      SELECT id, 'system', 'Municipal Announcement: ' || NEW.type, NEW.body, false
      FROM public.users WHERE role = 'citizen';
    ELSE
      -- Barangay specific announcement -> Notify citizens in that barangay
      INSERT INTO public.notifications(user_id, type, title, body, should_email)
      SELECT id, 'system', 'Barangay Announcement: ' || NEW.type, NEW.body, false
      FROM public.users WHERE role = 'citizen' AND barangay = NEW.barangay;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_announcement_created ON public.announcements;
CREATE TRIGGER trg_announcement_created
  AFTER INSERT ON public.announcements
  FOR EACH ROW
  EXECUTE FUNCTION public.on_announcement_created();