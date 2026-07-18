-- Enable Realtime for the official_messages table
-- This allows Supabase to broadcast INSERT events via WebSockets

alter publication supabase_realtime add table public.official_messages;