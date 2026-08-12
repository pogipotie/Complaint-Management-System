-- Boarding-house registry (Phase 4 of the foreign-resident plan).
--
-- A captain can pre-register a boarding house, dormitory, or company housing
-- once. Then any new tenant who types the same boarding_house_name on
-- registration is auto-linked to this record, so the captain can verify them
-- in bulk instead of one-by-one.
--
-- Matching is currently a soft text match on public.users.boarding_house_name.
-- A foreign key can be added later for stricter matching.

CREATE TABLE IF NOT EXISTS public.boarding_houses (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barangay        text NOT NULL,
  name            text NOT NULL,
  street_address  text NOT NULL,
  owner_name      text NOT NULL,
  owner_contact   text NOT NULL,
  max_occupancy   integer,
  is_approved     boolean NOT NULL DEFAULT false,
  notes           text,
  approved_by     uuid REFERENCES public.users(id) ON DELETE SET NULL,
  approved_at     timestamptz,
  created_by      uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  -- Prevent duplicate registrations in the same barangay
  CONSTRAINT boarding_houses_unique_name_in_barangay UNIQUE (barangay, name)
);

CREATE INDEX IF NOT EXISTS boarding_houses_barangay_idx
  ON public.boarding_houses (barangay);

CREATE INDEX IF NOT EXISTS boarding_houses_approved_idx
  ON public.boarding_houses (is_approved) WHERE is_approved = true;

-- Auto-bump updated_at on UPDATE
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS boarding_houses_set_updated_at ON public.boarding_houses;
CREATE TRIGGER boarding_houses_set_updated_at
  BEFORE UPDATE ON public.boarding_houses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- RLS ----------
ALTER TABLE public.boarding_houses ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can READ approved houses (so a citizen can see the
-- list while registering).
DROP POLICY IF EXISTS "Approved boarding houses are publicly readable" ON public.boarding_houses;
CREATE POLICY "Approved boarding houses are publicly readable"
ON public.boarding_houses FOR SELECT
TO authenticated
USING (is_approved = true);

-- Captains and admins can read all houses in the system
DROP POLICY IF EXISTS "Officials can read all boarding houses" ON public.boarding_houses;
CREATE POLICY "Officials can read all boarding houses"
ON public.boarding_houses FOR SELECT
TO authenticated
USING (
  public.current_role() = 'admin'
  OR public.current_role() = 'brgy_captain'
);

-- Admins and barangay captains can INSERT / UPDATE boarding houses.
-- (No DELETE permission for either — removal is done by an admin via SQL
-- to prevent accidental loss of audit history.)
DROP POLICY IF EXISTS "Officials can insert boarding houses" ON public.boarding_houses;
CREATE POLICY "Officials can insert boarding houses"
ON public.boarding_houses FOR INSERT
TO authenticated
WITH CHECK (
  public.current_role() = 'admin'
  OR public.current_role() = 'brgy_captain'
);

DROP POLICY IF EXISTS "Officials can update boarding houses" ON public.boarding_houses;
CREATE POLICY "Officials can update boarding houses"
ON public.boarding_houses FOR UPDATE
TO authenticated
USING (
  public.current_role() = 'admin'
  OR public.current_role() = 'brgy_captain'
)
WITH CHECK (
  public.current_role() = 'admin'
  OR public.current_role() = 'brgy_captain'
);

-- Only admins can DELETE.
DROP POLICY IF EXISTS "Admins can delete boarding houses" ON public.boarding_houses;
CREATE POLICY "Admins can delete boarding houses"
ON public.boarding_houses FOR DELETE
TO authenticated
USING (public.current_role() = 'admin');
