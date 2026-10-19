BEGIN;

ALTER TABLE public.users ADD COLUMN profile_picture_path text;
ALTER TABLE public.users ADD CONSTRAINT captain_profile_picture_path CHECK (
  profile_picture_path IS NULL OR (
    role = 'brgy_captain' AND
    profile_picture_path ~ ('^' || id::text || '/[a-f0-9-]+\.(jpg|png|webp)$')
  )
);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('captain_photos', 'captain_photos', false, 2097152,
        ARRAY['image/jpeg', 'image/png', 'image/webp']);

CREATE POLICY "Officials can view captain photos" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'captain_photos' AND public.is_official());

CREATE POLICY "Captains upload own photos" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'captain_photos' AND public.current_role() = 'brgy_captain'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Captains delete own photos" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'captain_photos' AND public.current_role() = 'brgy_captain'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Existing profile policies allow admins and same-barangay captains to edit
-- other users. Photo ownership must also be enforced at the column level.
CREATE FUNCTION public.guard_captain_profile_picture()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.profile_picture_path IS NOT NULL)
     OR (TG_OP = 'UPDATE' AND NEW.profile_picture_path IS DISTINCT FROM OLD.profile_picture_path) THEN
    IF auth.uid() IS DISTINCT FROM NEW.id
       OR public.current_role() IS DISTINCT FROM 'brgy_captain'::public.user_role THEN
      RAISE EXCEPTION 'Only captains can change their own profile picture' USING ERRCODE = '42501';
    END IF;
    IF NEW.profile_picture_path IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM storage.objects
      WHERE bucket_id = 'captain_photos' AND name = NEW.profile_picture_path
    ) THEN
      RAISE EXCEPTION 'Upload the profile picture before saving its path';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER guard_captain_profile_picture
BEFORE INSERT OR UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION public.guard_captain_profile_picture();

COMMIT;
