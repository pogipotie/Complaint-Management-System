BEGIN;

CREATE TABLE public.captain_directory_profiles (
  user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  draft jsonb NOT NULL,
  published jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'withdrawn')),
  version integer NOT NULL DEFAULT 1,
  review_note text,
  reviewed_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.captain_directory_profiles ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.captain_directory_profiles FROM anon, authenticated;
GRANT SELECT ON public.captain_directory_profiles TO authenticated;
CREATE POLICY "Captain or admin reads directory submissions"
ON public.captain_directory_profiles FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.current_role() = 'admin');

CREATE FUNCTION public.submit_captain_directory_profile(details jsonb, consent boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  captain public.users%ROWTYPE;
  clean jsonb;
  start_date date;
  end_date date;
BEGIN
  SELECT * INTO captain FROM public.users WHERE id = auth.uid() FOR SHARE;
  IF captain.id IS NULL OR captain.role <> 'brgy_captain'
     OR NOT captain.is_active OR captain.verification_status <> 'verified' THEN
    RAISE EXCEPTION 'Only active, verified captains can submit a public profile' USING ERRCODE = '42501';
  END IF;
  IF consent IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'Confirm that these official details may be published';
  END IF;
  IF details IS NULL OR jsonb_typeof(details) <> 'object' THEN
    RAISE EXCEPTION 'Profile details must be an object';
  END IF;
  IF EXISTS (SELECT 1 FROM jsonb_object_keys(details) AS k(key)
             WHERE key NOT IN ('official_title', 'term_start', 'term_end', 'office_address',
                              'office_hours', 'official_phone', 'official_email', 'biography')) THEN
    RAISE EXCEPTION 'Only official public-profile fields may be submitted';
  END IF;
  IF EXISTS (SELECT 1 FROM jsonb_each_text(details) WHERE length(value) > 2000) THEN
    RAISE EXCEPTION 'Each field must be no more than 2000 characters';
  END IF;
  IF EXISTS (SELECT 1 FROM jsonb_each(details) WHERE jsonb_typeof(value) NOT IN ('string', 'null')) THEN
    RAISE EXCEPTION 'Profile fields must be text';
  END IF;
  IF nullif(btrim(details->>'official_title'), '') IS NULL
     OR nullif(btrim(captain.full_name), '') IS NULL
     OR nullif(btrim(captain.barangay), '') IS NULL THEN
    RAISE EXCEPTION 'Name, assigned barangay, and official title are required';
  END IF;
  IF nullif(btrim(details->>'official_email'), '') IS NOT NULL
     AND btrim(details->>'official_email') !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' THEN
    RAISE EXCEPTION 'Enter a valid official email';
  END IF;
  start_date := nullif(details->>'term_start', '')::date;
  end_date := nullif(details->>'term_end', '')::date;
  IF start_date IS NOT NULL AND end_date IS NOT NULL AND end_date < start_date THEN
    RAISE EXCEPTION 'Term end must not be before term start';
  END IF;
  -- Name, barangay, and photo come from the account, never client-supplied IDs.
  clean := jsonb_build_object(
    'full_name', captain.full_name, 'barangay', captain.barangay,
    'photo_path', captain.profile_picture_path,
    'official_title', btrim(details->>'official_title'),
    'term_start', start_date, 'term_end', end_date,
    'office_address', nullif(btrim(details->>'office_address'), ''),
    'office_hours', nullif(btrim(details->>'office_hours'), ''),
    'official_phone', nullif(btrim(details->>'official_phone'), ''),
    'official_email', nullif(btrim(details->>'official_email'), ''),
    'biography', nullif(btrim(details->>'biography'), '')
  );
  INSERT INTO public.captain_directory_profiles(user_id, draft)
  VALUES (captain.id, clean)
  ON CONFLICT (user_id) DO UPDATE
  SET draft = EXCLUDED.draft, status = 'pending',
      version = captain_directory_profiles.version + 1,
      review_note = NULL, reviewed_by = NULL, reviewed_at = NULL, updated_at = now();
END;
$$;

CREATE FUNCTION public.review_captain_directory_profile(
  captain_id uuid, expected_version integer, decision text, note text DEFAULT NULL
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  profile public.captain_directory_profiles%ROWTYPE;
  captain public.users%ROWTYPE;
BEGIN
  IF public.current_role() IS DISTINCT FROM 'admin'::public.user_role THEN
    RAISE EXCEPTION 'Only administrators can review public profiles' USING ERRCODE = '42501';
  END IF;
  IF decision IS NULL OR decision NOT IN ('approved', 'rejected', 'withdrawn') THEN
    RAISE EXCEPTION 'Invalid review decision';
  END IF;
  IF length(note) > 2000 OR (decision = 'rejected' AND nullif(btrim(note), '') IS NULL) THEN
    RAISE EXCEPTION 'Provide a rejection reason (maximum 2000 characters)';
  END IF;
  -- Match submit lock order; a concurrent resubmission must not approve stale data.
  SELECT * INTO captain FROM public.users WHERE id = captain_id FOR SHARE;
  SELECT * INTO profile FROM public.captain_directory_profiles WHERE user_id = captain_id FOR UPDATE;
  IF profile.user_id IS NULL OR profile.version IS DISTINCT FROM expected_version THEN
    RAISE EXCEPTION 'The submission changed. Reload it before reviewing';
  END IF;
  IF decision IN ('approved', 'rejected') AND profile.status <> 'pending' THEN
    RAISE EXCEPTION 'Only pending submissions may be approved or rejected';
  END IF;
  IF decision = 'approved' AND (
    captain.role IS DISTINCT FROM 'brgy_captain'::public.user_role
    OR captain.is_active IS DISTINCT FROM true
    OR captain.verification_status IS DISTINCT FROM 'verified'::public.user_verification_status
    OR captain.barangay IS DISTINCT FROM profile.draft->>'barangay'
  ) THEN
    RAISE EXCEPTION 'The captain must be active, verified, and assigned to the submitted barangay';
  END IF;
  IF decision = 'approved' AND profile.draft->>'photo_path' IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM storage.objects WHERE bucket_id = 'captain_photos' AND name = profile.draft->>'photo_path'
  ) THEN
    RAISE EXCEPTION 'The submitted photo is missing. Ask the captain to resubmit';
  END IF;
  UPDATE public.captain_directory_profiles SET
    published = CASE WHEN decision = 'approved' THEN draft
                     WHEN decision = 'withdrawn' THEN NULL ELSE published END,
    status = decision, review_note = nullif(btrim(note), ''),
    reviewed_by = auth.uid(), reviewed_at = now(), updated_at = now(), version = version + 1
  WHERE user_id = captain_id;
END;
$$;

-- Explicit output columns prevent exposure of account/private contact fields.
CREATE FUNCTION public.get_public_captain_directory()
RETURNS TABLE (
  full_name text, barangay text, photo_path text, official_title text,
  term_start date, term_end date, office_address text, office_hours text,
  official_phone text, official_email text, biography text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT p.published->>'full_name', p.published->>'barangay', p.published->>'photo_path',
         p.published->>'official_title', (p.published->>'term_start')::date,
         (p.published->>'term_end')::date, p.published->>'office_address',
         p.published->>'office_hours', p.published->>'official_phone',
         p.published->>'official_email', p.published->>'biography'
  FROM public.captain_directory_profiles p JOIN public.users u ON u.id = p.user_id
  WHERE p.published IS NOT NULL AND u.role = 'brgy_captain'
    AND u.is_active AND u.verification_status = 'verified'
    AND u.barangay = p.published->>'barangay'
  ORDER BY p.published->>'barangay', p.published->>'full_name';
$$;

CREATE FUNCTION public.is_published_captain_photo(object_path text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.captain_directory_profiles p JOIN public.users u ON u.id = p.user_id
    WHERE p.published->>'photo_path' = object_path
      AND u.role = 'brgy_captain' AND u.is_active AND u.verification_status = 'verified'
      AND u.barangay = p.published->>'barangay'
  );
$$;

CREATE POLICY "Public reads only approved captain photos" ON storage.objects
FOR SELECT TO anon, authenticated
USING (bucket_id = 'captain_photos' AND public.is_published_captain_photo(name));

-- Preserve snapshots when a captain replaces their current account photo.
CREATE FUNCTION public.is_retained_captain_photo(object_path text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.captain_directory_profiles
    WHERE published->>'photo_path' = object_path
       OR (status = 'pending' AND draft->>'photo_path' = object_path)
  );
$$;
DROP POLICY "Captains delete own photos" ON storage.objects;
CREATE POLICY "Captains delete own unretained photos" ON storage.objects
FOR DELETE TO authenticated USING (
  bucket_id = 'captain_photos' AND public.current_role() = 'brgy_captain'
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND NOT public.is_retained_captain_photo(name)
);

REVOKE ALL ON FUNCTION public.submit_captain_directory_profile(jsonb, boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.review_captain_directory_profile(uuid, integer, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_public_captain_directory() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_published_captain_photo(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_retained_captain_photo(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_captain_directory_profile(jsonb, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.review_captain_directory_profile(uuid, integer, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_captain_directory() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_published_captain_photo(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_retained_captain_photo(text) TO authenticated;

COMMIT;
