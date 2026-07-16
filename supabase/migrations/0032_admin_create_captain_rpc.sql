-- Secure RPC to create a barangay captain account directly
-- This bypasses the normal signup flow and directly inserts into auth.users and public.users
CREATE OR REPLACE FUNCTION public.admin_create_captain(
  captain_email text,
  captain_password text,
  captain_full_name text,
  captain_barangay text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  new_user_id uuid;
  encrypted_pw text;
BEGIN
  -- Check if the current user is an admin
  IF public.current_role() != 'admin' THEN
    RAISE EXCEPTION 'Only administrators can create captain accounts';
  END IF;

  -- Check if email already exists
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = captain_email) THEN
    RAISE EXCEPTION 'Email is already registered';
  END IF;

  -- Encrypt password
  encrypted_pw := crypt(captain_password, gen_salt('bf'));
  new_user_id := gen_random_uuid();

  -- Insert into auth.users
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
    updated_at
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
    now()
  );

  -- Insert into auth.identities
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

  -- Insert into public.users
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
