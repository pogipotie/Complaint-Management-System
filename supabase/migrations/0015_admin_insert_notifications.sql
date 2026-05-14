-- 0015_admin_insert_notifications.sql

-- Add policy to allow Admins and Staff to insert notifications for any user
CREATE POLICY "Admins and Staff can insert notifications" ON public.notifications
FOR INSERT
WITH CHECK (
  public.current_role() IN ('admin', 'staff')
);