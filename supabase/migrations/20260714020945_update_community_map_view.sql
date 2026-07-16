-- Drop and recreate the view to include the custom_category column
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
  c.custom_category,
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
