-- Quick-win: support foreign / transient residents (boarding-house tenants,
-- institution residents, migrant workers) in the citizen profile.
--
-- The existing residency_type column is free text, so the new values can be
-- added to the dropdown without a schema change. This migration only adds
-- the supporting fields that the verification flow needs.

ALTER TABLE public.users
  -- When the person is *expected* to stop living in this barangay.
  -- For homeowners/long-term renters this stays NULL.
  -- For students/boarders it should be the end of the school year or lease.
  ADD COLUMN IF NOT EXISTS residency_start_date date,
  ADD COLUMN IF NOT EXISTS residency_end_date   date,

  -- Boarding-house / institution specifics (NULL for permanent residents).
  ADD COLUMN IF NOT EXISTS boarding_house_name          text,
  ADD COLUMN IF NOT EXISTS guardian_or_landlord_name    text,
  ADD COLUMN IF NOT EXISTS guardian_or_landlord_contact text,
  ADD COLUMN IF NOT EXISTS school_or_employer           text,

  -- The address on the citizen's valid ID. May differ from current
  -- barangay (e.g. parents' house in another city). Informational only,
  -- never used for complaint routing.
  ADD COLUMN IF NOT EXISTS permanent_address            text,
  ADD COLUMN IF NOT EXISTS permanent_city_municipality  text,
  ADD COLUMN IF NOT EXISTS permanent_province           text;

-- Index to find residents whose transient stay is about to expire.
CREATE INDEX IF NOT EXISTS users_residency_end_idx
  ON public.users (residency_end_date)
  WHERE residency_end_date IS NOT NULL;
