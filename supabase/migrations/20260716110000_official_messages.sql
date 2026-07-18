-- Create official_messages table for Admin and Captain group chat
CREATE TABLE public.official_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  body text not null check (char_length(body) > 0),
  created_at timestamptz not null default now()
);

-- Index for faster ordering
CREATE INDEX official_messages_created_at_idx ON public.official_messages (created_at asc);

-- Enable RLS
ALTER TABLE public.official_messages ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is an official
CREATE OR REPLACE FUNCTION public.is_official()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role IN ('admin', 'staff', 'brgy_captain')
  );
$$;

-- RLS Policies
CREATE POLICY "Officials can read messages" ON public.official_messages
FOR SELECT
USING (public.is_official());

CREATE POLICY "Officials can insert messages" ON public.official_messages
FOR INSERT
WITH CHECK (
  user_id = auth.uid() AND
  public.is_official()
);