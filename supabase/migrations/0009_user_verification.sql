-- 0009_user_verification.sql

-- Create the verification status enum
CREATE TYPE public.user_verification_status AS ENUM ('pending', 'verified', 'rejected');

-- Add the verification_status column to users table
ALTER TABLE public.users
ADD COLUMN verification_status public.user_verification_status NOT NULL DEFAULT 'pending';

-- Add an index for quick lookup of pending users by admins
CREATE INDEX users_verification_status_idx ON public.users (verification_status);
