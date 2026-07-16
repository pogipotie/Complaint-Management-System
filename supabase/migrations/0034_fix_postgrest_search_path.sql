-- Fix PostgREST "DATABASE ERROR QUERYING SCHEMA" caused by SET search_path in SQL functions
-- When using LANGUAGE sql, SET search_path can leak or confuse PostgREST's schema cache.
-- Using search_path = '' forces explicit schema references and prevents the bug.

CREATE OR REPLACE FUNCTION public.current_role()
RETURNS public.user_role
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.current_barangay()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
  SELECT barangay FROM public.users WHERE id = auth.uid();
$$;
