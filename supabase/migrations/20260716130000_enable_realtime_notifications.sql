-- Enable Realtime for the notifications table
-- This allows Supabase to broadcast INSERT events via WebSockets to update the bell icon instantly

alter publication supabase_realtime add table public.notifications;