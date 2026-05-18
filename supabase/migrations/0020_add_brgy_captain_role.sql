-- Add brgy_captain to user_role ENUM
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'brgy_captain';

-- Add is_escalated column to complaints table
ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS is_escalated boolean not null default false;

-- Update RLS policies for complaints
-- Drop existing select policies to recreate them clearly if needed, or just add new ones.
-- Currently, we have policies like "Citizen can read own complaints", "Staff can read all complaints", "Admin can read all complaints"
-- Let's just create a new policy for brgy_captains so they can read and update complaints in their barangay.

CREATE POLICY "Captain can read barangay complaints" ON public.complaints
FOR SELECT
USING (
  public.current_role() = 'brgy_captain' AND
  barangay = (SELECT barangay FROM public.users WHERE id = auth.uid())
);

CREATE POLICY "Captain can update barangay complaints" ON public.complaints
FOR UPDATE
USING (
  public.current_role() = 'brgy_captain' AND
  barangay = (SELECT barangay FROM public.users WHERE id = auth.uid())
)
WITH CHECK (
  public.current_role() = 'brgy_captain' AND
  barangay = (SELECT barangay FROM public.users WHERE id = auth.uid())
);

-- We should also allow captains to read profiles of users in their barangay (optional, but good for context)
CREATE POLICY "Captain can read barangay users" ON public.users
FOR SELECT
USING (
  public.current_role() = 'brgy_captain' AND
  barangay = (SELECT barangay FROM public.users WHERE id = auth.uid())
);

-- Modify the Community Map secure view to include is_escalated
DROP VIEW IF EXISTS public.community_complaints;

CREATE VIEW public.community_complaints AS
SELECT
  c.id,
  c.title,
  c.description,
  c.status,
  c.priority,
  c.barangay,
  c.latitude,
  c.longitude,
  c.created_at,
  c.is_escalated,
  cat.name as category_name
FROM public.complaints c
LEFT JOIN public.complaint_categories cat ON c.category_id = cat.id
WHERE c.status != 'rejected'
  AND c.latitude IS NOT NULL
  AND c.longitude IS NOT NULL;

REVOKE ALL ON public.community_complaints FROM PUBLIC;
GRANT SELECT ON public.community_complaints TO authenticated;
GRANT SELECT ON public.community_complaints TO service_role;
