CREATE TABLE public.materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  file_path text NOT NULL,
  file_name text NOT NULL,
  file_type text NOT NULL DEFAULT 'arquivo',
  file_mime text,
  file_size bigint NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'rascunho',
  duration_days integer NOT NULL DEFAULT 7,
  published_at timestamptz,
  expires_at timestamptz,
  republished_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.materials TO authenticated;
GRANT ALL ON public.materials TO service_role;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage materials" ON public.materials FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE TRIGGER t_materials_updated BEFORE UPDATE ON public.materials FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE INDEX idx_materials_campaign ON public.materials(campaign_id);
CREATE INDEX idx_materials_client ON public.materials(client_id);

CREATE TABLE public.material_downloads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id uuid NOT NULL REFERENCES public.materials(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  file_name text,
  status text NOT NULL DEFAULT 'autorizado',
  downloaded_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.material_downloads TO authenticated;
GRANT ALL ON public.material_downloads TO service_role;
ALTER TABLE public.material_downloads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read material downloads" ON public.material_downloads FOR SELECT TO authenticated USING (is_admin());

CREATE INDEX idx_material_downloads_material ON public.material_downloads(material_id);

ALTER TABLE public.activity_logs ADD COLUMN IF NOT EXISTS material_id uuid REFERENCES public.materials(id) ON DELETE SET NULL;