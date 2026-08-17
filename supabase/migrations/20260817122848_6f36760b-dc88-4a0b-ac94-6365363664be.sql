DROP POLICY IF EXISTS "agency read media" ON storage.objects;
DROP POLICY IF EXISTS "agency upload media" ON storage.objects;
DROP POLICY IF EXISTS "agency update media" ON storage.objects;
DROP POLICY IF EXISTS "agency delete media" ON storage.objects;
DROP POLICY IF EXISTS "admins read materials storage" ON storage.objects;
DROP POLICY IF EXISTS "admins write materials storage" ON storage.objects;
DROP POLICY IF EXISTS "admins update materials storage" ON storage.objects;
DROP POLICY IF EXISTS "admins delete materials storage" ON storage.objects;

CREATE POLICY "agency read media" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = ANY (ARRAY['videos','thumbnails','logos','materials'])
    AND EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.role IN ('admin','staff')));
CREATE POLICY "agency upload media" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = ANY (ARRAY['videos','thumbnails','logos','materials'])
    AND EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.role IN ('admin','staff')));
CREATE POLICY "agency update media" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = ANY (ARRAY['videos','thumbnails','logos','materials'])
    AND EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.role IN ('admin','staff')))
  WITH CHECK (bucket_id = ANY (ARRAY['videos','thumbnails','logos','materials'])
    AND EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.role IN ('admin','staff')));
CREATE POLICY "agency delete media" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = ANY (ARRAY['videos','thumbnails','logos','materials'])
    AND EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.role IN ('admin','staff')));