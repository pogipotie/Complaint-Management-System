-- Add DELETE policy for notifications table
DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;

CREATE POLICY "Users can delete own notifications" 
ON public.notifications 
FOR DELETE 
USING (user_id = auth.uid());