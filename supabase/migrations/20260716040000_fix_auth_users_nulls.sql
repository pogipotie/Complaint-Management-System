-- Fix NULL values in auth.users that cause 'Database error querying schema' in GoTrue

-- Update existing corrupted rows
UPDATE auth.users SET confirmation_token = '' WHERE confirmation_token IS NULL;
UPDATE auth.users SET recovery_token = '' WHERE recovery_token IS NULL;
UPDATE auth.users SET email_change_token_new = '' WHERE email_change_token_new IS NULL;
UPDATE auth.users SET email_change_token_current = '' WHERE email_change_token_current IS NULL;
UPDATE auth.users SET email_change = '' WHERE email_change IS NULL;

-- Update the admin_create_captain RPC to include these fields as empty strings instead of NULLs
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
    is_anonymous,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change_token_current,
    email_change
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
    false,
    '',
    '',
    '',
    '',
    ''
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
