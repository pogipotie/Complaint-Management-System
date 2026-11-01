BEGIN;

ALTER TABLE public.users
  ADD COLUMN approved_at timestamptz,
  ADD COLUMN approved_by uuid REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.notifications ADD COLUMN event_key text;

CREATE FUNCTION public.guard_account_approval()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE actor public.users%ROWTYPE;
BEGIN
  SELECT * INTO actor FROM public.users WHERE id = auth.uid();
  IF TG_OP = 'INSERT' THEN
    IF auth.uid() IS NOT NULL AND coalesce(actor.role::text, 'citizen') = 'citizen' THEN
      IF NEW.id <> auth.uid() OR NEW.role <> 'citizen' OR NOT NEW.is_active THEN
        RAISE EXCEPTION 'Citizens may only register their own citizen account.';
      END IF;
      NEW.verification_status := 'pending';
      NEW.approved_at := NULL;
      NEW.approved_by := NULL;
    END IF;
    RETURN NEW;
  END IF;
  IF auth.uid() IS NOT NULL THEN
    IF actor.id IS NULL OR NOT actor.is_active THEN RAISE EXCEPTION 'Active account required.'; END IF;
    IF actor.role = 'citizen' THEN
      IF NEW.id <> actor.id OR NEW.role IS DISTINCT FROM OLD.role
        OR NEW.is_active IS DISTINCT FROM OLD.is_active
        OR NEW.department_id IS DISTINCT FROM OLD.department_id
        OR NEW.approved_at IS DISTINCT FROM OLD.approved_at
        OR NEW.approved_by IS DISTINCT FROM OLD.approved_by THEN
        RAISE EXCEPTION 'Citizens cannot change account privileges or approval records.';
      END IF;
      IF NEW.verification_status IS DISTINCT FROM OLD.verification_status AND NOT (
        OLD.verification_status IN ('rejected','expired') AND NEW.verification_status = 'pending'
      ) THEN RAISE EXCEPTION 'Only authorized officials can approve accounts.'; END IF;
    ELSIF actor.role = 'brgy_captain' AND NEW.id <> actor.id THEN
      IF actor.verification_status <> 'verified' OR OLD.role <> 'citizen'
        OR OLD.barangay IS DISTINCT FROM actor.barangay
        OR NEW.barangay IS DISTINCT FROM OLD.barangay
        OR NEW.role IS DISTINCT FROM OLD.role
        OR NEW.is_active IS DISTINCT FROM OLD.is_active
        OR NEW.department_id IS DISTINCT FROM OLD.department_id THEN
        RAISE EXCEPTION 'Captains may review only citizens in their own barangay.';
      END IF;
    ELSIF actor.role = 'brgy_captain' THEN
      IF NEW.role IS DISTINCT FROM OLD.role OR NEW.is_active IS DISTINCT FROM OLD.is_active
        OR NEW.verification_status IS DISTINCT FROM OLD.verification_status
        OR NEW.barangay IS DISTINCT FROM OLD.barangay
        OR NEW.department_id IS DISTINCT FROM OLD.department_id THEN
        RAISE EXCEPTION 'Captains cannot change their own account privileges.';
      END IF;
    END IF;
  END IF;
  IF NEW.verification_status = 'verified' AND OLD.verification_status <> 'verified' THEN
    NEW.approved_at := statement_timestamp();
    NEW.approved_by := auth.uid();
  ELSE
    NEW.approved_at := OLD.approved_at;
    NEW.approved_by := OLD.approved_by;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_guard_account_approval BEFORE INSERT OR UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION public.guard_account_approval();

CREATE FUNCTION public.guard_citizen_complaint_submission()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE actor public.users%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN RETURN NEW; END IF;
  -- Serialize approval/revocation with submission.
  SELECT * INTO actor FROM public.users WHERE id = auth.uid() FOR SHARE;
  IF actor.id IS NULL OR NOT actor.is_active THEN RAISE EXCEPTION 'Active account required.'; END IF;
  IF actor.role = 'citizen' AND (
    actor.verification_status <> 'verified'
    OR NEW.created_by <> actor.id
    OR NEW.barangay IS DISTINCT FROM actor.barangay
    OR NEW.status <> 'pending'
  ) THEN RAISE EXCEPTION 'Your account must be approved by your Barangay Captain before submitting complaints.'; END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_guard_citizen_complaint_submission BEFORE INSERT ON public.complaints
FOR EACH ROW EXECUTE FUNCTION public.guard_citizen_complaint_submission();

CREATE OR REPLACE FUNCTION public.notify_captains_citizen_registration()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.role = 'citizen' AND NEW.verification_status = 'pending' AND NEW.barangay IS NOT NULL THEN
    INSERT INTO public.notifications(user_id,related_user_id,type,title,body,should_email,event_key)
    SELECT id, NEW.id, 'system', 'New Citizen Registration',
      'A new citizen account in your barangay requires approval.', true, 'citizen_registered'
    FROM public.users WHERE role = 'brgy_captain' AND barangay = NEW.barangay
      AND is_active AND verification_status = 'verified';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_admins_user_resubmission()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.role = 'citizen' AND OLD.verification_status IN ('rejected','expired')
    AND NEW.verification_status = 'pending' THEN
    INSERT INTO public.notifications(user_id,related_user_id,type,title,body,should_email,event_key)
    SELECT id, NEW.id, 'system', 'Registration Resubmitted',
      'A citizen in your barangay has resubmitted their account for approval.', true, 'citizen_registered'
    FROM public.users WHERE role = 'brgy_captain' AND barangay = NEW.barangay
      AND is_active AND verification_status = 'verified';
  END IF;
  RETURN NEW;
END;
$$;

CREATE FUNCTION public.notify_citizen_account_approval()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.role = 'citizen' AND NEW.verification_status = 'verified'
    AND OLD.verification_status IN ('pending','rejected','expired') THEN
    INSERT INTO public.notifications(user_id,type,title,body,should_email,event_key)
    VALUES (NEW.id,'system','Account Approved',
      'Your account has been approved. You can now submit a complaint.',true,'account_approved');
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_citizen_account_approval AFTER UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION public.notify_citizen_account_approval();

CREATE OR REPLACE FUNCTION public.on_complaint_status_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.complaint_status_history(complaint_id,from_status,to_status,changed_by,note)
    VALUES (NEW.id,NULL,NEW.status,NEW.created_by,'Complaint created');
    INSERT INTO public.notifications(user_id,complaint_id,type,title,body,should_email)
    VALUES (NEW.created_by,NEW.id,'complaint_created','Complaint submitted',
      'Your complaint was submitted and is now pending review.',true);
    INSERT INTO public.notifications(user_id,complaint_id,type,title,body,should_email,event_key)
    SELECT id,NEW.id,'complaint_created','New Complaint in Your Barangay',
      'A citizen submitted a new complaint in your barangay. Sign in to review it.',true,'complaint_submitted'
    FROM public.users WHERE role = 'brgy_captain' AND barangay = NEW.barangay
      AND is_active AND verification_status = 'verified';
  ELSE
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      INSERT INTO public.complaint_status_history(complaint_id,from_status,to_status,changed_by,note)
      VALUES (NEW.id,OLD.status,NEW.status,auth.uid(),NEW.resolution_notes);
      INSERT INTO public.notifications(user_id,complaint_id,type,title,body,should_email)
      VALUES (NEW.created_by,NEW.id,'status_changed','Complaint status updated',
        concat('The status of your complaint has been updated to ',upper(NEW.status::text),'.'),true);
    END IF;
    IF NEW.rating IS DISTINCT FROM OLD.rating AND NEW.rating IS NOT NULL THEN
      INSERT INTO public.notifications(user_id,complaint_id,type,title,body,should_email)
      SELECT id,NEW.id,'system','Resolution Rating Submitted','A citizen submitted resolution feedback.',false
      FROM public.users WHERE is_active AND (
        role = 'admin' OR (role = 'brgy_captain' AND barangay = NEW.barangay AND verification_status = 'verified'));
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TABLE public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  endpoint text NOT NULL UNIQUE CHECK (length(endpoint) BETWEEN 10 AND 2048),
  p256dh text NOT NULL CHECK (length(p256dh) BETWEEN 40 AND 200),
  auth text NOT NULL CHECK (length(auth) BETWEEN 16 AND 100),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.push_subscriptions FROM anon, authenticated;
GRANT SELECT, DELETE ON public.push_subscriptions TO authenticated;
CREATE POLICY "Captains read own push devices" ON public.push_subscriptions
FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Captains remove own push devices" ON public.push_subscriptions
FOR DELETE USING (user_id = auth.uid());

CREATE FUNCTION public.register_push_subscription(push_endpoint text, push_p256dh text, push_auth text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE actor public.users%ROWTYPE; subscription_id uuid;
BEGIN
  SELECT * INTO actor FROM public.users WHERE id = auth.uid();
  IF actor.id IS NULL OR actor.role <> 'brgy_captain' OR NOT actor.is_active
    OR actor.verification_status <> 'verified' THEN RAISE EXCEPTION 'Approved captain account required.'; END IF;
  -- Only browser push providers; prevents arbitrary server-side request targets.
  IF push_endpoint !~ '^https://(fcm[.]googleapis[.]com|updates[.]push[.]services[.]mozilla[.]com|[a-zA-Z0-9.-]+[.]notify[.]windows[.]com|web[.]push[.]apple[.]com)/' THEN
    RAISE EXCEPTION 'Unsupported push provider.';
  END IF;
  IF (SELECT count(*) FROM public.push_subscriptions WHERE user_id = actor.id) >= 10
    AND NOT EXISTS (SELECT 1 FROM public.push_subscriptions WHERE user_id = actor.id AND endpoint = push_endpoint) THEN
    RAISE EXCEPTION 'Maximum of 10 devices reached. Remove an old device first.';
  END IF;
  INSERT INTO public.push_subscriptions(user_id,endpoint,p256dh,auth)
  VALUES (actor.id,push_endpoint,push_p256dh,push_auth)
  ON CONFLICT (endpoint) DO UPDATE SET user_id=excluded.user_id,p256dh=excluded.p256dh,auth=excluded.auth
  RETURNING id INTO subscription_id;
  RETURN subscription_id;
END;
$$;
REVOKE ALL ON FUNCTION public.register_push_subscription(text,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.register_push_subscription(text,text,text) TO authenticated;

CREATE TABLE public.notification_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id uuid NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  channel text NOT NULL CHECK (channel IN ('email','push')),
  subscription_id uuid REFERENCES public.push_subscriptions(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','sent','failed','cancelled')),
  attempts integer NOT NULL DEFAULT 0,
  available_at timestamptz NOT NULL DEFAULT now(),
  locked_at timestamptz,
  lease_token uuid,
  sent_at timestamptz,
  provider_id text,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((channel='email' AND subscription_id IS NULL) OR (channel='push' AND subscription_id IS NOT NULL))
);
CREATE UNIQUE INDEX notification_email_once ON public.notification_deliveries(notification_id) WHERE channel='email';
CREATE UNIQUE INDEX notification_push_once ON public.notification_deliveries(notification_id,subscription_id) WHERE channel='push';
CREATE INDEX notification_delivery_due ON public.notification_deliveries(status,available_at);
ALTER TABLE public.notification_deliveries ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.notification_deliveries FROM anon, authenticated;
GRANT ALL ON public.push_subscriptions, public.notification_deliveries TO service_role;

CREATE FUNCTION public.guard_notification_delivery_event()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  -- Client-created legacy notices may appear in-app, but cannot enqueue mail/push.
  IF auth.uid() IS NOT NULL AND pg_trigger_depth() = 1 THEN NEW.event_key := NULL; END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_guard_notification_delivery_event BEFORE INSERT ON public.notifications
FOR EACH ROW EXECUTE FUNCTION public.guard_notification_delivery_event();

CREATE FUNCTION public.queue_notification_delivery()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.event_key IN ('citizen_registered','account_approved','complaint_submitted') THEN
    INSERT INTO public.notification_deliveries(notification_id,channel)
    VALUES (NEW.id,'email') ON CONFLICT DO NOTHING;
    IF NEW.event_key IN ('citizen_registered','complaint_submitted') THEN
      INSERT INTO public.notification_deliveries(notification_id,channel,subscription_id)
      SELECT NEW.id,'push',id FROM public.push_subscriptions WHERE user_id=NEW.user_id
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_queue_notification_delivery AFTER INSERT ON public.notifications
FOR EACH ROW EXECUTE FUNCTION public.queue_notification_delivery();

CREATE FUNCTION public.claim_notification_deliveries(batch_size integer DEFAULT 20)
RETURNS SETOF public.notification_deliveries LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.notification_deliveries SET status='failed',last_error='Worker lease expired after maximum attempts'
  WHERE status='processing' AND attempts >= 5 AND locked_at < now()-interval '10 minutes';
  RETURN QUERY UPDATE public.notification_deliveries d SET status='processing',attempts=d.attempts+1,
    locked_at=now(),lease_token=gen_random_uuid()
  WHERE d.id IN (
    SELECT id FROM public.notification_deliveries
    WHERE attempts < 5 AND (
      (status='pending' AND available_at <= now())
      OR (status='processing' AND locked_at < now()-interval '10 minutes'))
    ORDER BY available_at LIMIT least(greatest(batch_size,1),50) FOR UPDATE SKIP LOCKED
  ) RETURNING d.*;
END;
$$;
REVOKE ALL ON FUNCTION public.claim_notification_deliveries(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_notification_deliveries(integer) TO service_role;

REVOKE ALL ON FUNCTION public.guard_account_approval() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.guard_citizen_complaint_submission() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.notify_citizen_account_approval() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.guard_notification_delivery_event() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.queue_notification_delivery() FROM PUBLIC;

-- Own-profile approval changes must also refresh an already-open citizen form.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname='supabase_realtime')
    AND NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime'
      AND schemaname='public' AND tablename='users') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
  END IF;
END $$;

COMMIT;
