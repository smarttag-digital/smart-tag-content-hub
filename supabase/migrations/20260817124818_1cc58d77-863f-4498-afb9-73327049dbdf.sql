ALTER TABLE public.campaigns
  ALTER COLUMN access_token SET DEFAULT (replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''));

DROP FUNCTION IF EXISTS public.sync_material_notifications();

REVOKE ALL ON FUNCTION public.notify_from_activity() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.notify_from_activity() FROM anon;
REVOKE ALL ON FUNCTION public.notify_from_activity() FROM authenticated;

GRANT INSERT ON public.notifications TO authenticated;

CREATE POLICY "admins insert notifications" ON public.notifications FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.role = ANY (ARRAY['admin'::app_role,'staff'::app_role])));