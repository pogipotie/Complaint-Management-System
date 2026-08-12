-- One-time backfill: existing "Renter" rows are conceptually the same as
-- "Boarding House Tenant" and should be reclassified so they show the
-- Transient badge in the admin/captain review UI. The "Renter" option
-- has been removed from the registration dropdown.
--
-- Safe to run multiple times: only rows that still say "Renter" are touched.
UPDATE public.users
SET residency_type = 'Boarding House Tenant'
WHERE residency_type = 'Renter';
