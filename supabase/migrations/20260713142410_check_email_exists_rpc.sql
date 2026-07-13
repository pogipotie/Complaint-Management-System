-- Create a secure RPC function to check if an email exists in auth.users
-- This function runs with SECURITY DEFINER so it can access the auth schema
CREATE OR REPLACE FUNCTION public.check_email_exists(lookup_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users WHERE email = lookup_email
  );
END;
$$;

-- Ensure the function is accessible to anonymous users (so the login page can use it)
GRANT EXECUTE ON FUNCTION public.check_email_exists(text) TO anon;
GRANT EXECUTE ON FUNCTION public.check_email_exists(text) TO authenticated;