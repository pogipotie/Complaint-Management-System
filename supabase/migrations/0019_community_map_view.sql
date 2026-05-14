
-- Create a secure view for the Public Community Map
-- This view strips out sensitive PII (citizen id, exact description, evidence photos)
-- and only exposes the location, category, status, and priority of complaints.
-- It excludes 'rejected' complaints.

CREATE OR REPLACE VIEW public.community_complaints AS
SELECT
  c.id,
  c.status,
  c.priority,
  c.barangay,
  c.latitude,
  c.longitude,
  c.created_at,
  cat.name as category_name
FROM public.complaints c
LEFT JOIN public.complaint_categories cat ON c.category_id = cat.id
WHERE c.status != 'rejected'
  AND c.latitude IS NOT NULL
  AND c.longitude IS NOT NULL;

-- Revoke default access and grant explicitly
REVOKE ALL ON public.community_complaints FROM PUBLIC;
GRANT SELECT ON public.community_complaints TO authenticated;
GRANT SELECT ON public.community_complaints TO service_role;
