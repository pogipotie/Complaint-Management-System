-- Migration 0001: Fix RLS Infinite Recursion
-- 
-- The previous schema used public.current_role() inside the policy for public.users.
-- However, public.current_role() queries public.users, which triggers the policy again,
-- causing a "stack depth limit exceeded" (54001) error.

-- 1. Redefine the helper function as SECURITY DEFINER so it bypasses RLS policies.
--    This allows the database to check a user's role without triggering a policy check loop.
create or replace function public.current_role()
returns public.user_role language sql security definer as $$
  select role from public.users where id = auth.uid() limit 1;
$$;

-- 2. Drop the buggy policy and recreate it safely.
--    We MUST use the public.current_role() function here. Direct subqueries 
--    would trigger the RLS policy again, causing the exact same recursion error.
drop policy if exists "Users can read own profile" on public.users;

create policy "Users can read own profile" on public.users for select using (
  id = auth.uid() 
  or public.current_role() in ('admin','staff')
);
