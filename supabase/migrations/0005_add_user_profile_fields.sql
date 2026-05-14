-- 0005_add_user_profile_fields.sql

-- Add new columns to public.users for comprehensive demographic and verification data
ALTER TABLE public.users
ADD COLUMN street_address text,
ADD COLUMN latitude double precision,
ADD COLUMN longitude double precision,
ADD COLUMN date_of_birth date,
ADD COLUMN gender text,
ADD COLUMN civil_status text,
ADD COLUMN occupation text,
ADD COLUMN proof_of_residency_url text,
ADD COLUMN residency_type text,
ADD COLUMN years_of_residency integer,
ADD COLUMN is_pwd boolean default false,
ADD COLUMN emergency_contact_name text,
ADD COLUMN emergency_contact_number text;

-- Add INSERT policy so users can create their own profile after signing up via auth.users
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
CREATE POLICY "Users can insert their own profile" ON public.users
FOR INSERT
WITH CHECK (id = auth.uid());

-- Create Storage Bucket for Citizen IDs
INSERT INTO storage.buckets (id, name, public) VALUES ('citizen_ids', 'citizen_ids', false) ON CONFLICT DO NOTHING;

-- Storage RLS Policies for the new bucket
-- Allow users to upload their own ID
CREATE POLICY "Users can upload their own ID" ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'citizen_ids' AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to view their own ID
CREATE POLICY "Users can view their own ID" ON storage.objects
FOR SELECT
USING (
  bucket_id = 'citizen_ids' AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow staff/admin to view all IDs
CREATE POLICY "Staff and Admin can view all IDs" ON storage.objects
FOR SELECT
USING (
  bucket_id = 'citizen_ids' AND EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('staff', 'admin')
  )
);
