-- Add a custom_category column to complaints to store user-defined categories
ALTER TABLE public.complaints ADD COLUMN custom_category text;

-- Insert an 'Other' category into the categories table if it doesn't already exist
INSERT INTO public.complaint_categories (name, description, is_active)
VALUES ('Other', 'User-defined custom category', true)
ON CONFLICT (name) DO NOTHING;
