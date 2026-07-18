-- Add barangay column to announcements for targeted announcements
ALTER TABLE public.announcements
ADD COLUMN barangay text;

CREATE INDEX idx_announcements_barangay ON public.announcements (barangay);

-- Update RLS for announcements
DROP POLICY IF EXISTS "Public can read announcements" ON public.announcements;
DROP POLICY IF EXISTS "Admins can manage announcements" ON public.announcements;

-- Read Policy: 
-- 1. Public can read global announcements (barangay IS NULL)
-- 2. Authenticated users can read their own barangay's announcements
-- 3. Admins can read all announcements
CREATE POLICY "Users can read relevant announcements" ON public.announcements
FOR SELECT
USING (
  barangay IS NULL OR
  public.current_role() = 'admin' OR
  barangay = public.current_barangay()
);

-- Manage Policy for Admins:
-- Admins can manage all announcements (both global and barangay-specific)
CREATE POLICY "Admins can manage all announcements" ON public.announcements
FOR ALL
USING (public.current_role() = 'admin')
WITH CHECK (public.current_role() = 'admin');

-- Manage Policy for Captains:
-- Captains can only insert/update/delete announcements for their own barangay
CREATE POLICY "Captains can manage their barangay announcements" ON public.announcements
FOR ALL
USING (
  public.current_role() = 'brgy_captain' AND
  barangay = public.current_barangay()
)
WITH CHECK (
  public.current_role() = 'brgy_captain' AND
  barangay = public.current_barangay()
);
