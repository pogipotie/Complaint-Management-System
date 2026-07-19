-- Create a secure RPC function to get the user's role by email
-- This is used to prevent officials from resetting their passwords themselves

CREATE OR REPLACE FUNCTION public.get_user_role_by_email(lookup_email text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  found_role text;
BEGIN
  SELECT u.role::text INTO found_role
  FROM auth.users au
  JOIN public.users u ON au.id = u.id
  WHERE au.email = lookup_email;

  RETURN found_role;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_role_by_email(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_user_role_by_email(text) TO authenticated;