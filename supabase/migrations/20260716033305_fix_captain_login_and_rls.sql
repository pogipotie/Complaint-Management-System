-- 1. Fix existing corrupted accounts in auth.users
UPDATE auth.users SET is_sso_user = false WHERE is_sso_user IS NULL;
UPDATE auth.users SET is_super_admin = false WHERE is_super_admin IS NULL;
UPDATE auth.users SET is_anonymous = false WHERE is_anonymous IS NULL;

-- 2. Update the RPC to include all required GoTrue fields to prevent 500 Schema Errors
CREATE OR REPLACE FUNCTION public.admin_create_captain(
  captain_email text,
  captain_password text,
  captain_full_name text,
  captain_barangay text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  new_user_id uuid;
  encrypted_pw text;
BEGIN
  IF public.current_role() != 'admin' THEN
    RAISE EXCEPTION 'Only administrators can create captain accounts';
  END IF;

  IF EXISTS (SELECT 1 FROM auth.users WHERE email = captain_email) THEN
    RAISE EXCEPTION 'Email is already registered';
  END IF;

  encrypted_pw := extensions.crypt(captain_password, extensions.gen_salt('bf'));
  new_user_id := gen_random_uuid();

  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    is_sso_user,
    is_super_admin,
    is_anonymous
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    new_user_id,
    'authenticated',
    'authenticated',
    captain_email,
    encrypted_pw,
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(),
    now(),
    false,
    false,
    false
  );

  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    new_user_id,
    new_user_id,
    format('{"sub":"%s","email":"%s"}', new_user_id::text, captain_email)::jsonb,
    'email',
    new_user_id::text,
    now(),
    now(),
    now()
  );

  INSERT INTO public.users (
    id,
    role,
    full_name,
    barangay,
    verification_status
  ) VALUES (
    new_user_id,
    'brgy_captain',
    captain_full_name,
    captain_barangay,
    'verified'
  );

  RETURN json_build_object('success', true, 'user_id', new_user_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_create_captain(text, text, text, text) TO authenticated;

-- 3. Fix the RLS Policy for audit_logs so Captains can trigger it when updating statuses
DROP POLICY IF EXISTS "Users can insert audit logs for their actions" ON public.audit_logs;
CREATE POLICY "Users can insert audit logs for their actions" ON public.audit_logs
FOR INSERT
WITH CHECK (
  actor_user_id = auth.uid() AND 
  public.current_role() IN ('admin', 'staff', 'brgy_captain')
);

-- 4. Re-apply the complaint_status_history policy to be absolutely sure
DROP POLICY IF EXISTS "Allow inserting status history" ON public.complaint_status_history;
CREATE POLICY "Allow inserting status history" ON public.complaint_status_history
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.complaints c
    WHERE c.id = complaint_id
    AND (
      public.current_role() = 'admin'
      OR (public.current_role() = 'staff' AND c.assigned_department_id = (SELECT department_id FROM public.users WHERE id = auth.uid()))
      OR (public.current_role() = 'brgy_captain' AND c.barangay = (SELECT barangay FROM public.users WHERE id = auth.uid()))
      OR c.created_by = auth.uid()
    )
  )
);
