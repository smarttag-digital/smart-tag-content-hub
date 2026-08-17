-- 1. Notifications
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  link_to text,
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  campaign_id uuid REFERENCES public.campaigns(id) ON DELETE CASCADE,
  material_id uuid REFERENCES public.materials(id) ON DELETE CASCADE,
  video_id uuid REFERENCES public.videos(id) ON DELETE CASCADE,
  dedupe_key text UNIQUE,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins read notifications" ON public.notifications FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.role = ANY (ARRAY['admin'::app_role,'staff'::app_role])));

CREATE POLICY "admins update notifications" ON public.notifications FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.role = ANY (ARRAY['admin'::app_role,'staff'::app_role])))
WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.role = ANY (ARRAY['admin'::app_role,'staff'::app_role])));

CREATE INDEX notifications_unread_idx ON public.notifications (read_at, created_at DESC);

-- notifications created automatically from real activity
CREATE OR REPLACE FUNCTION public.notify_from_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_title text;
  v_link text;
BEGIN
  IF NEW.action = 'selection_confirmed' THEN
    v_title := 'Nova seleção recebida'; v_link := '/selecoes';
  ELSIF NEW.action = 'material_baixado' THEN
    v_title := 'Material baixado pelo cliente'; v_link := '/materiais';
  ELSIF NEW.action = 'observacao_enviada' THEN
    v_title := 'Nova observação do cliente'; v_link := '/selecoes';
  ELSIF NEW.action = 'material_publicado' THEN
    v_title := 'Material publicado'; v_link := '/materiais';
  ELSIF NEW.action = 'material_republicado' THEN
    v_title := 'Material republicado'; v_link := '/materiais';
  ELSIF NEW.action = 'aprovacao_conteudo' THEN
    v_title := 'Conteúdo aprovado pelo cliente'; v_link := '/selecoes';
  ELSIF NEW.action = 'alteracao_solicitada' THEN
    v_title := 'Alteração solicitada pelo cliente'; v_link := '/selecoes';
  ELSE
    RETURN NEW;
  END IF;

  INSERT INTO public.notifications (type, title, body, link_to, client_id, campaign_id, material_id, video_id)
  VALUES (NEW.action, v_title, NEW.description, v_link, NEW.client_id, NEW.campaign_id, NEW.material_id, NEW.video_id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER t_activity_notification
AFTER INSERT ON public.activity_logs
FOR EACH ROW EXECUTE FUNCTION public.notify_from_activity();

-- expiring / expired material notifications, generated from real data (idempotent)
CREATE OR REPLACE FUNCTION public.sync_material_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.role = ANY (ARRAY['admin'::app_role,'staff'::app_role])) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  INSERT INTO public.notifications (type, title, body, link_to, client_id, campaign_id, material_id, dedupe_key)
  SELECT 'material_expirando', 'Material expirando em menos de 24h',
         m.name || ' expira em ' || to_char(m.expires_at, 'DD/MM HH24:MI'),
         '/materiais', m.client_id, m.campaign_id, m.id,
         'expirando:' || m.id::text || ':' || m.republished_count::text
  FROM public.materials m
  WHERE m.status = 'publicado' AND m.expires_at IS NOT NULL
    AND m.expires_at > now() AND m.expires_at <= now() + interval '24 hours'
  ON CONFLICT (dedupe_key) DO NOTHING;

  INSERT INTO public.notifications (type, title, body, link_to, client_id, campaign_id, material_id, dedupe_key)
  SELECT 'material_expirado', 'Material expirado',
         m.name || ' expirou em ' || to_char(m.expires_at, 'DD/MM HH24:MI'),
         '/materiais', m.client_id, m.campaign_id, m.id,
         'expirado:' || m.id::text || ':' || m.republished_count::text
  FROM public.materials m
  WHERE m.status = 'publicado' AND m.expires_at IS NOT NULL AND m.expires_at <= now()
  ON CONFLICT (dedupe_key) DO NOTHING;
END;
$$;

REVOKE ALL ON FUNCTION public.sync_material_notifications() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.sync_material_notifications() TO authenticated;

-- 2. Secure campaign access tokens
ALTER TABLE public.campaigns
  ADD COLUMN access_token text,
  ADD COLUMN access_revoked boolean NOT NULL DEFAULT false;

UPDATE public.campaigns SET access_token = replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '') WHERE access_token IS NULL;

ALTER TABLE public.campaigns ALTER COLUMN access_token SET NOT NULL;
CREATE UNIQUE INDEX campaigns_access_token_idx ON public.campaigns (access_token);

-- 3. Individual content approval
ALTER TABLE public.videos
  ADD COLUMN approval_status text NOT NULL DEFAULT 'aguardando',
  ADD COLUMN change_request text,
  ADD COLUMN approval_updated_at timestamptz;