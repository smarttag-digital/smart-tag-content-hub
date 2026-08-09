
CREATE POLICY "agency read media" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id IN ('videos','thumbnails','logos') AND public.is_admin());
CREATE POLICY "agency upload media" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id IN ('videos','thumbnails','logos') AND public.is_admin());
CREATE POLICY "agency update media" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id IN ('videos','thumbnails','logos') AND public.is_admin());
CREATE POLICY "agency delete media" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id IN ('videos','thumbnails','logos') AND public.is_admin());
