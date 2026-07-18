-- Enable Realtime for the complaint_comments table
-- This allows Supabase to broadcast INSERT events via WebSockets so the Discussion Thread updates instantly

alter publication supabase_realtime add table public.complaint_comments;