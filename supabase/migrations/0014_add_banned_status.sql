-- 0014_add_banned_status.sql

-- Add 'banned' to the user_verification_status enum
ALTER TYPE public.user_verification_status ADD VALUE IF NOT EXISTS 'banned';