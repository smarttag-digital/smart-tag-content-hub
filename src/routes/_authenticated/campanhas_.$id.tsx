import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { ArrowLeft, Copy, ExternalLink, Loader2, Trash2, Upload, Film } from "lucide-react";
import { toast } from "sonner";

import { EmptyState, LoadingGrid, StatusBadge } from "@/components/admin/ui-bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import {
  CAMPAIGN_STATUS,
  CATEGORIES,
  VIDEO_STATUS,
  formatDuration,
  formatPeriod,
  labelOf,
} from "@/lib/domain";
import { readVideoMetadata, signedUrl } from "@/lib/media";

export const Route = createFileRoute("/_authenticated/campanhas_/$id")({
  head: () => ({
    meta: [
      { title: "Detalhes da campanha | SMART TAG Content Hub" },
      {
        name: "description",
        content: "Envie vídeos, acompanhe escolhas do cliente e gerencie o portal da campanha.",
      },
      { property: "og:title", content: "Detalhes da campanha | SMART TAG Content Hub" },
      {
        property: "og:description",
        content: "Envie vídeos, acompanhe escolhas do cliente e gerencie o portal da campanha.",
      },
    ],
  }),
  component: CampaignDetailPage,
});

function CampaignDetailPage() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [meta, setMeta] = useState({ title: "", description: "", category: "reels" });

  const { data: campaign } = useQuery({
    queryKey: ["campaign", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campaigns")
        .select("*, clients(company_name, contact_name)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: videos, isLoading } = useQuery({
    queryKey: ["campaign-videos", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("videos")
        .select("*")
        .eq("campaign_id", id)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return Promise.all(
        data.map(async (video) => ({
          ...video,
          thumbUrl: await signedUrl("thumbnails", video.thumbnail_url),
        })),
      );
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ videoId, status }: { videoId: string; status: string }) => {
      const { error } = await supabase.from("videos").update({ status }).eq("id", videoId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["campaign-videos", id] }),
    onError: (error: Error) => toast.error(error.message),
  });

  const removeVideo = useMutation({
    mutationFn: async (videoId: string) => {
      const { error } = await supabase.from("videos").delete().eq("id", videoId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Vídeo removido");
      queryClient.invalidateQueries({ queryKey: ["campaign-videos", id] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const publish = useMutation({
    mutationFn: async (status: string) => {
      const { error } = await supabase.from("campaigns").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Status da campanha atualizado");
      queryClient.invalidateQueries({ queryKey: ["campaign", id] });
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  async function handleUpload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    try {
      let order = videos?.length ?? 0;
      for (const file of Array.from(files)) {
        const { duration, thumbnail } = await readVideoMetadata(file);
        const base = `${id}/${crypto.randomUUID()}`;
        const videoPath = `${base}.${file.name.split(".").pop() ?? "mp4"}`;
        const { error: uploadError } = await supabase.storage
          .from("videos")
          .upload(videoPath, file, { contentType: file.type });
        if (uploadError) throw uploadError;

        let thumbPath: string | null = null;
        if (thumbnail) {
          thumbPath = `${base}.jpg`;
          await supabase.storage
            .from("thumbnails")
            .upload(thumbPath, thumbnail, { contentType: "image/jpeg" });
        }

        const { error } = await supabase.from("videos").insert({
          campaign_id: id,
          title: meta.title || file.name.replace(/\.[^.]+$/, ""),
          description: meta.description || null,
          category: meta.category,
          duration_seconds: Math.round(duration) || null,
          video_path: videoPath,
          thumbnail_url: thumbPath,
          sort_order: order++,
        });
        if (error) throw error;
      }
      toast.success("Upload concluído");
      setMeta({ title: "", description: "", category: "reels" });
      queryClient.invalidateQueries({ queryKey: ["campaign-videos", id] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha no upload");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <>
      <Link
        to="/campanhas"
        className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar para campanhas
      </Link>

      <div className="surface-panel mb-6 flex flex-col gap-4 p-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-bold">{campaign?.name ?? "Campanha"}</h1>
            {campaign && (
              <StatusBadge
                value={campaign.status}
                label={labelOf(CAMPAIGN_STATUS, campaign.status)}
              />
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {(campaign?.clients as { company_name: string } | null)?.company_name} ·{" "}
            {formatPeriod(campaign?.start_date, campaign?.end_date)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {campaign && (
            <AccessLinkActions
              campaign={{
                id: campaign.id,
                name: campaign.name,
                access_token: campaign.access_token,
                access_revoked: campaign.access_revoked,
              }}
              invalidateKeys={[["campaign", id], ["campaigns"]]}
            />
          )}
          <Button
            size="sm"
            className="gradient-brand"
            onClick={() => publish.mutate(campaign?.status === "publicada" ? "encerrada" : "publicada")}
          >
            {campaign?.status === "publicada" ? "Encerrar campanha" : "Publicar campanha"}
          </Button>
        </div>
      </div>

      <section className="surface-panel mb-6 p-6">
        <h2 className="font-display text-lg font-semibold">Linha do tempo da campanha</h2>
        <p className="mb-4 mt-1 text-sm text-muted-foreground">
          Marcos e interações do cliente registrados automaticamente.
        </p>
        <ActivityTimeline campaignId={id} emptyLabel="Ainda não há movimentações nesta campanha." />
      </section>

      <section className="surface-panel mb-6 p-6">
        <h2 className="font-display text-lg font-semibold">Enviar vídeos</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          A miniatura e a duração são geradas automaticamente a partir do arquivo.
        </p>
        <div className="mt-4 grid gap-4 lg:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="v-title">Título (opcional)</Label>
            <Input
              id="v-title"
              value={meta.title}
              placeholder="Usa o nome do arquivo"
              onChange={(event) => setMeta({ ...meta, title: event.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select
              value={meta.category}
              onValueChange={(value) => setMeta({ ...meta, category: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 lg:col-span-2">
            <Label htmlFor="v-desc">Descrição (opcional)</Label>
            <Textarea
              id="v-desc"
              rows={1}
              value={meta.description}
              onChange={(event) => setMeta({ ...meta, description: event.target.value })}
            />
          </div>
        </div>
        <div className="mt-4">
          <input
            ref={fileRef}
            type="file"
            accept="video/*"
            multiple
            className="hidden"
            onChange={(event) => handleUpload(event.target.files)}
          />
          <Button
            className="gradient-brand"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
          >
            {uploading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            {uploading ? "Enviando..." : "Selecionar arquivos"}
          </Button>
        </div>
      </section>

      <h2 className="mb-4 font-display text-lg font-semibold">
        Vídeos da campanha ({videos?.length ?? 0})
      </h2>
      {isLoading ? (
        <LoadingGrid />
      ) : videos?.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {videos.map((video) => (
            <article key={video.id} className="surface-panel overflow-hidden">
              <div className="relative aspect-video bg-surface-2">
                {video.thumbUrl ? (
                  <img
                    src={video.thumbUrl}
                    alt={`Miniatura do vídeo ${video.title}`}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    <Film className="h-8 w-8" />
                  </div>
                )}
                <span className="absolute bottom-2 right-2 rounded bg-background/85 px-1.5 py-0.5 text-xs">
                  {formatDuration(video.duration_seconds)}
                </span>
              </div>
              <div className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate font-medium">{video.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      {labelOf(CATEGORIES, video.category)}
                    </p>
                  </div>
                  <StatusBadge value={video.status} label={labelOf(VIDEO_STATUS, video.status)} />
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={video.status}
                    onValueChange={(status) => updateStatus.mutate({ videoId: video.id, status })}
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {VIDEO_STATUS.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Remover vídeo"
                    onClick={() => {
                      if (confirm(`Remover "${video.title}"?`)) removeVideo.mutate(video.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Film className="h-8 w-8" />}
          title="Nenhum vídeo enviado"
          description="Envie os vídeos desta campanha para que o cliente possa escolher no portal."
        />
      )}
    </>
  );
}
