import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type PortalVideo = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  duration_seconds: number | null;
  status: string;
  sort_order: number;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  selected: boolean;
  note: string | null;
};

export type PortalData = {
  agency: {
    agency_name: string;
    portal_message: string;
    primary_color: string;
    email: string | null;
    phone: string | null;
    logoUrl: string | null;
  };
  client: { company_name: string; contact_name: string | null; logoUrl: string | null };
  campaign: {
    id: string;
    name: string;
    description: string | null;
    start_date: string | null;
    end_date: string | null;
    slug: string;
  };
  videos: PortalVideo[];
  locked: boolean;
  confirmedAt: string | null;
  selectionStatus: string;
};

const slugInput = z.object({ slug: z.string().min(1) });

async function loadContext(slug: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: campaign } = await supabaseAdmin
    .from("campaigns")
    .select("*, clients(*)")
    .eq("slug", slug)
    .maybeSingle();

  if (!campaign) throw new Error("Campanha não encontrada");
  if (campaign.status === "rascunho") throw new Error("Esta campanha ainda não foi publicada");

  let { data: selection } = await supabaseAdmin
    .from("selections")
    .select("*")
    .eq("campaign_id", campaign.id)
    .maybeSingle();

  if (!selection) {
    const inserted = await supabaseAdmin
      .from("selections")
      .insert({ campaign_id: campaign.id, client_id: campaign.client_id })
      .select("*")
      .single();
    selection = inserted.data;
  }

  return { supabaseAdmin, campaign, selection: selection! };
}

async function sign(
  admin: Awaited<typeof import("@/integrations/supabase/client.server")>["supabaseAdmin"],
  bucket: string,
  path: string | null | undefined,
) {
  if (!path) return null;
  const { data } = await admin.storage.from(bucket).createSignedUrl(path, 60 * 60 * 6);
  return data?.signedUrl ?? null;
}

export const getPortal = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => slugInput.parse(input))
  .handler(async ({ data }): Promise<PortalData> => {
    const { supabaseAdmin, campaign, selection } = await loadContext(data.slug);

    const [{ data: videos }, { data: items }, { data: settings }] = await Promise.all([
      supabaseAdmin
        .from("videos")
        .select("*")
        .eq("campaign_id", campaign.id)
        .order("sort_order", { ascending: true }),
      supabaseAdmin.from("selection_items").select("*").eq("selection_id", selection.id),
      supabaseAdmin.from("agency_settings").select("*").eq("id", 1).maybeSingle(),
    ]);

    const client = campaign.clients as unknown as {
      company_name: string;
      contact_name: string | null;
      logo_url: string | null;
    };

    const selectedMap = new Map((items ?? []).map((item) => [item.video_id, item.note]));

    const resolved = await Promise.all(
      (videos ?? []).map(async (video) => ({
        id: video.id,
        title: video.title,
        description: video.description,
        category: video.category,
        duration_seconds: video.duration_seconds,
        status: video.status,
        sort_order: video.sort_order,
        videoUrl: await sign(supabaseAdmin, "videos", video.video_path),
        thumbnailUrl: await sign(supabaseAdmin, "thumbnails", video.thumbnail_url),
        selected: selectedMap.has(video.id),
        note: selectedMap.get(video.id) ?? null,
      })),
    );

    return {
      agency: {
        agency_name: settings?.agency_name ?? "SMAR TAG",
        portal_message:
          settings?.portal_message ??
          "Selecionamos estes conteúdos para sua avaliação. Assista aos vídeos e escolha aqueles que deseja receber.",
        primary_color: settings?.primary_color ?? "#5D4EE2",
        email: settings?.email ?? null,
        phone: settings?.phone ?? null,
        logoUrl: await sign(supabaseAdmin, "logos", settings?.logo_url),
      },
      client: {
        company_name: client.company_name,
        contact_name: client.contact_name,
        logoUrl: await sign(supabaseAdmin, "logos", client.logo_url),
      },
      campaign: {
        id: campaign.id,
        name: campaign.name,
        description: campaign.description,
        start_date: campaign.start_date,
        end_date: campaign.end_date,
        slug: campaign.slug,
      },
      videos: resolved,
      locked: selection.status !== "aguardando",
      confirmedAt: selection.confirmed_at,
      selectionStatus: selection.status,
    };
  });

export const logPortalActivity = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        slug: z.string().min(1),
        action: z.enum(["acesso", "visualizacao"]),
        videoId: z.string().uuid().optional(),
        videoTitle: z.string().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin, campaign } = await loadContext(data.slug);
    const client = campaign.clients as unknown as { company_name: string };
    await supabaseAdmin.from("activity_logs").insert({
      actor: "cliente",
      action: data.action === "acesso" ? "campanha_acessada" : "video_visualizado",
      description:
        data.action === "acesso"
          ? `${client.company_name} acessou a campanha "${campaign.name}"`
          : `${client.company_name} visualizou o vídeo "${data.videoTitle ?? ""}"`,
      client_id: campaign.client_id,
      campaign_id: campaign.id,
      video_id: data.videoId ?? null,
    });
    return { ok: true };
  });

export const toggleVideoSelection = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({ slug: z.string().min(1), videoId: z.string().uuid(), selected: z.boolean() })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin, campaign, selection } = await loadContext(data.slug);
    if (selection.status !== "aguardando") throw new Error("Seleção já confirmada");

    const { data: video } = await supabaseAdmin
      .from("videos")
      .select("id, title, campaign_id")
      .eq("id", data.videoId)
      .maybeSingle();
    if (!video || video.campaign_id !== campaign.id) throw new Error("Vídeo inválido");

    const client = campaign.clients as unknown as { company_name: string };

    if (data.selected) {
      await supabaseAdmin
        .from("selection_items")
        .upsert({ selection_id: selection.id, video_id: video.id }, { onConflict: "selection_id,video_id" });
      await supabaseAdmin.from("videos").update({ status: "selecionado" }).eq("id", video.id);
    } else {
      await supabaseAdmin
        .from("selection_items")
        .delete()
        .eq("selection_id", selection.id)
        .eq("video_id", video.id);
      await supabaseAdmin.from("videos").update({ status: "aguardando" }).eq("id", video.id);
    }

    await supabaseAdmin.from("activity_logs").insert({
      actor: "cliente",
      action: data.selected ? "video_selecionado" : "video_removido",
      description: `${client.company_name} ${data.selected ? "selecionou" : "removeu"} o vídeo "${video.title}"`,
      client_id: campaign.client_id,
      campaign_id: campaign.id,
      video_id: video.id,
    });

    return { ok: true };
  });

export const saveVideoNote = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({ slug: z.string().min(1), videoId: z.string().uuid(), note: z.string().max(1000) })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin, campaign, selection } = await loadContext(data.slug);
    if (selection.status !== "aguardando") throw new Error("Seleção já confirmada");

    const note = data.note.trim();
    await supabaseAdmin
      .from("selection_items")
      .upsert(
        { selection_id: selection.id, video_id: data.videoId, note: note || null },
        { onConflict: "selection_id,video_id" },
      );
    await supabaseAdmin.from("videos").update({ status: "selecionado" }).eq("id", data.videoId);

    if (note) {
      await supabaseAdmin.from("video_comments").insert({
        video_id: data.videoId,
        selection_id: selection.id,
        body: note,
      });
      await supabaseAdmin.from("activity_logs").insert({
        actor: "cliente",
        action: "observacao_enviada",
        description: `Nova observação do cliente na campanha "${campaign.name}"`,
        client_id: campaign.client_id,
        campaign_id: campaign.id,
        video_id: data.videoId,
      });
    }
    return { ok: true };
  });

export const confirmSelection = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => slugInput.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin, campaign, selection } = await loadContext(data.slug);
    if (selection.status !== "aguardando") throw new Error("Seleção já confirmada");

    const { count } = await supabaseAdmin
      .from("selection_items")
      .select("id", { count: "exact", head: true })
      .eq("selection_id", selection.id);

    if (!count) throw new Error("Selecione pelo menos um vídeo");

    await supabaseAdmin
      .from("selections")
      .update({ status: "confirmada", confirmed_at: new Date().toISOString() })
      .eq("id", selection.id);

    const client = campaign.clients as unknown as { company_name: string };
    await supabaseAdmin.from("activity_logs").insert({
      actor: "cliente",
      action: "selection_confirmed",
      description: `${client.company_name} confirmou a seleção de ${count} vídeo(s) na campanha "${campaign.name}"`,
      client_id: campaign.client_id,
      campaign_id: campaign.id,
    });

    return { ok: true, count };
  });
