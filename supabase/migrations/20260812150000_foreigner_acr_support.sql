-- Phase 6: Foreigner / ACR I-Card support

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS is_foreign_resident boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS acr_icard_url text;
