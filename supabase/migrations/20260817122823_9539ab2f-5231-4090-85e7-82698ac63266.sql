-- Replace SECURITY DEFINER role checks in policies with direct, RLS-safe lookups
CREATE POLICY "admins manage clients v2" ON public.clients FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.role IN ('admin','staff')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.role IN ('admin','staff')));
DROP POLICY "admins manage clients" ON public.clients;

CREATE POLICY "admins manage campaigns v2" ON public.campaigns FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.role IN ('admin','staff')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.role IN ('admin','staff')));
DROP POLICY "admins manage campaigns" ON public.campaigns;

CREATE POLICY "admins manage videos v2" ON public.videos FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.role IN ('admin','staff')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.role IN ('admin','staff')));
DROP POLICY "admins manage videos" ON public.videos;

CREATE POLICY "admins manage selections v2" ON public.selections FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.role IN ('admin','staff')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.role IN ('admin','staff')));
DROP POLICY "admins manage selections" ON public.selections;

CREATE POLICY "admins manage selection items v2" ON public.selection_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.role IN ('admin','staff')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.role IN ('admin','staff')));
DROP POLICY "admins manage selection items" ON public.selection_items;

CREATE POLICY "admins write logs v2" ON public.activity_logs FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.role IN ('admin','staff')));
DROP POLICY "admins write logs" ON public.activity_logs;
CREATE POLICY "admins read logs v2" ON public.activity_logs FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.role IN ('admin','staff')));
DROP POLICY "admins read logs" ON public.activity_logs;

CREATE POLICY "admins manage comments v2" ON public.video_comments FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.role IN ('admin','staff')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.role IN ('admin','staff')));
DROP POLICY "admins manage comments" ON public.video_comments;

CREATE POLICY "admins manage settings v2" ON public.agency_settings FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.role IN ('admin','staff')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.role IN ('admin','staff')));
DROP POLICY "admins manage settings" ON public.agency_settings;

CREATE POLICY "admins manage materials v2" ON public.materials FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.role IN ('admin','staff')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.role IN ('admin','staff')));
DROP POLICY "admins manage materials" ON public.materials;

CREATE POLICY "admins read material downloads v2" ON public.material_downloads FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.role IN ('admin','staff')));
DROP POLICY "admins read material downloads" ON public.material_downloads;

REVOKE EXECUTE ON FUNCTION public.is_admin() FROM authenticated, anon, public;