-- 0007_announcements.sql

CREATE TABLE public.announcements (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('Road Closure', 'Water Interruption', 'Power Outage', 'General Info', 'Emergency')),
  body text not null check (char_length(body) > 0),
  created_at timestamptz not null default now()
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Everyone can read announcements
CREATE POLICY "Public can read announcements" ON public.announcements
FOR SELECT USING (true);

-- Only admins/staff can insert/delete announcements
CREATE POLICY "Admins can manage announcements" ON public.announcements
FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'staff'))
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'staff'))
);