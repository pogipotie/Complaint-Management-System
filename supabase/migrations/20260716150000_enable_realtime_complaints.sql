-- Enable Realtime for the complaints table
-- This allows Supabase to broadcast INSERT and UPDATE events via WebSockets
-- so that the Captain and Admin complaint tables update automatically without reloading the page.

alter publication supabase_realtime add table public.complaints;