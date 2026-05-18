-- 0024_allow_captain_insert_notifications.sql

-- Drop the old policy so we can expand it
DROP POLICY IF EXISTS "Admins and Staff can insert notifications" ON public.notifications;

-- Recreate policy to include brgy_captain alongside staff and admin
CREATE POLICY "Admins, Staff, and Captains can insert notifications" ON public.notifications
FOR INSERT
WITH CHECK (
  public.current_role() IN ('admin', 'staff', 'brgy_captain')
);