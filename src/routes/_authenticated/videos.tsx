import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useRef, useState } from "react";
import { Copy, ExternalLink, Film, Loader2, Plus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import { EmptyState, LoadingGrid, PageHeader, StatusBadge } from "@/components/admin/ui-bits";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORIES, VIDEO_STATUS, formatDuration, labelOf } from "@/lib/domain";
import { readVideoMetadata, signedUrl } from "@/lib/media";

export const Route = createFileRoute("/_authenticated/videos")({
  head: () => ({
    meta: [
      { title: "Vídeos | SMART TAG Content Hub" },
      { name: "description", content: "Biblioteca completa de vídeos enviados para todas as campanhas." },
      { property: "og:title", content: "Vídeos | SMART TAG Content Hub" },
      { property: "og:description", content: "Biblioteca completa de vídeos enviados para todas as campanhas." },
    ],
  }),
  component: VideosPage,
});

type FormState = {
  title: string;
  description: string;
  clientId: string;
  campaignId: string;
  category: string;
  status: string;
  sortOrder: string;
};

const EMPTY_FORM: FormState = {
  title: "",
  description: "",
  clientId: "",
  campaignId: "",
  category: "reels",
  status: "aguardando",
  sortOrder: "0",
};

function VideosPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("todas");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["videos-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("videos")
        .select("*, campaigns(id, name, slug, clients(company_name))")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return Promise.all(
        data.map(async (video) => ({
          ...video,
          thumbUrl: await signedUrl("thumbnails", video.thumbnail_url),
        })),
      );
    },
  });

  const { data: clients } = useQuery({
    queryKey: ["clients-lite"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, company_name")
        .order("company_name");
      if (error) throw error;
      return data;
    },
  });

  const { data: campaigns } = useQuery({
    queryKey: ["campaigns-lite"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campaigns")
        .select("id, name, slug, client_id")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const campaignOptions = useMemo(
    () => (campaigns ?? []).filter((c) => !form.clientId || c.client_id === form.clientId),
    [campaigns, form.clientId],
  );

  const removeVideo = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("videos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Vídeo removido");
      queryClient.invalidateQueries({ queryKey: ["videos-all"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("videos").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["videos-all"] }),
    onError: (error: Error) => toast.error(error.message),
  });

  function resetForm() {
    setForm(EMPTY_FORM);
    setVideoFile(null);
    setThumbFile(null);
    setProgress(0);
    if (videoInputRef.current) videoInputRef.current.value = "";
    if (thumbInputRef.current) thumbInputRef.current.value = "";
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.campaignId) {
      toast.error("Selecione a campanha");
      return;
    }
    if (!videoFile) {
      toast.error("Selecione o arquivo de vídeo");
      return;
    }

    setUploading(true);
    setProgress(8);
    try {
      const { duration, thumbnail } = await readVideoMetadata(videoFile);
      setProgress(25);

      const base = `${form.campaignId}/${crypto.randomUUID()}`;
      const videoPath = `${base}.${videoFile.name.split(".").pop() ?? "mp4"}`;
      const { error: uploadError } = await supabase.storage
        .from("videos")
        .upload(videoPath, videoFile, { contentType: videoFile.type });
      if (uploadError) throw uploadError;
      setProgress(75);

      let thumbPath: string | null = null;
      const thumbSource: Blob | null = thumbFile ?? thumbnail;
      if (thumbSource) {
        thumbPath = `${base}.jpg`;
        const { error: thumbError } = await supabase.storage
          .from("thumbnails")
          .upload(thumbPath, thumbSource, {
            contentType: thumbFile ? thumbFile.type : "image/jpeg",
          });
        if (thumbError) thumbPath = null;
      }
      setProgress(90);

      const { error } = await supabase.from("videos").insert({
        campaign_id: form.campaignId,
        title: form.title || videoFile.name.replace(/\.[^.]+$/, ""),
        description: form.description || null,
        category: form.category,
        status: form.status,
        sort_order: Number(form.sortOrder) || 0,
        duration_seconds: Math.round(duration) || null,
        video_path: videoPath,
        thumbnail_url: thumbPath,
      });
      if (error) throw error;

      setProgress(100);
      toast.success("Vídeo adicionado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["videos-all"] });
      queryClient.invalidateQueries({ queryKey: ["campaign-videos", form.campaignId] });
      setOpen(false);
      resetForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha no upload");
    } finally {
      setUploading(false);
    }
  }

  const videos = (data ?? []).filter((video) => {
    const campaign = video.campaigns as
      | { name: string; clients: { company_name: string } | null }
      | null;
    const haystack = `${video.title} ${campaign?.name ?? ""} ${campaign?.clients?.company_name ?? ""}`;
    return (
      haystack.toLowerCase().includes(search.toLowerCase()) &&
      (categoryFilter === "todas" || video.category === categoryFilter) &&
      (statusFilter === "todos" || video.status === statusFilter)
    );
  });

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader title="Vídeos" description="Todos os conteúdos enviados, com status de aprovação." />
        <Button className="gradient-brand" onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Adicionar vídeo
        </Button>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por vídeo, cliente ou campanha..."
          className="max-w-sm"
        />
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as categorias</SelectItem>
            {CATEGORIES.map((category) => (
              <SelectItem key={category.value} value={category.value}>
                {category.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status</SelectItem>
            {VIDEO_STATUS.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <LoadingGrid />
      ) : videos.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {videos.map((video) => {
            const campaign = video.campaigns as
              | { id: string; name: string; slug: string; clients: { company_name: string } | null }
              | null;
            return (
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
                      <p className="truncate text-xs text-muted-foreground">
                        {campaign?.clients?.company_name ?? "—"} ·{" "}
                        {campaign ? (
                          <Link
                            to="/campanhas/$id"
                            params={{ id: campaign.id }}
                            className="hover:underline"
                          >
                            {campaign.name}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {labelOf(CATEGORIES, video.category)}
                      </p>
                    </div>
                    <StatusBadge value={video.status} label={labelOf(VIDEO_STATUS, video.status)} />
                  </div>

                  <div className="flex items-center gap-2">
                    <Select
                      value={video.status}
                      onValueChange={(status) => updateStatus.mutate({ id: video.id, status })}
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

                  {campaign?.slug && (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          navigator.clipboard.writeText(
                            `${window.location.origin}/portal/${campaign.slug}`,
                          );
                          toast.success("Link do cliente copiado!");
                        }}
                      >
                        <Copy className="mr-2 h-3.5 w-3.5" /> Copiar link do cliente
                      </Button>
                      <a
                        href={`/portal/${campaign.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        <ExternalLink className="mr-2 h-3.5 w-3.5" /> Abrir portal
                      </a>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={<Film className="h-8 w-8" />}
          title="Nenhum vídeo encontrado"
          description="Adicione um vídeo para disponibilizá-lo no portal do cliente."
        />
      )}

      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (uploading) return;
          setOpen(value);
          if (!value) resetForm();
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-display">Adicionar vídeo</DialogTitle>
            <DialogDescription>
              Envie o arquivo, associe a uma campanha e defina como o cliente verá o conteúdo.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="title">Título do vídeo</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(event) => setForm({ ...form, title: event.target.value })}
                  placeholder="Reel institucional 01"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  rows={3}
                  value={form.description}
                  onChange={(event) => setForm({ ...form, description: event.target.value })}
                  placeholder="Breve contexto sobre o conteúdo"
                />
              </div>

              <div className="space-y-2">
                <Label>Cliente</Label>
                <Select
                  value={form.clientId}
                  onValueChange={(value) => setForm({ ...form, clientId: value, campaignId: "" })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {(clients ?? []).map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.company_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Campanha</Label>
                <Select
                  value={form.campaignId}
                  onValueChange={(value) => setForm({ ...form, campaignId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a campanha" />
                  </SelectTrigger>
                  <SelectContent>
                    {campaignOptions.map((campaign) => (
                      <SelectItem key={campaign.id} value={campaign.id}>
                        {campaign.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select
                  value={form.category}
                  onValueChange={(value) => setForm({ ...form, category: value })}
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

              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(value) => setForm({ ...form, status: value })}
                >
                  <SelectTrigger>
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="sort">Ordem de exibição</Label>
                <Input
                  id="sort"
                  type="number"
                  min={0}
                  value={form.sortOrder}
                  onChange={(event) => setForm({ ...form, sortOrder: event.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="thumb">Thumbnail (opcional)</Label>
                <Input
                  id="thumb"
                  ref={thumbInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(event) => setThumbFile(event.target.files?.[0] ?? null)}
                />
                <p className="text-xs text-muted-foreground">
                  Se vazio, geramos automaticamente a partir do vídeo.
                </p>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="file">Arquivo de vídeo</Label>
                <Input
                  id="file"
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  required
                  onChange={(event) => setVideoFile(event.target.files?.[0] ?? null)}
                />
              </div>
            </div>

            {uploading && (
              <div className="space-y-2">
                <Progress value={progress} />
                <p className="text-xs text-muted-foreground">Enviando arquivo... {progress}%</p>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                disabled={uploading}
                onClick={() => {
                  setOpen(false);
                  resetForm();
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" className="gradient-brand" disabled={uploading}>
                {uploading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                {uploading ? "Enviando..." : "Salvar vídeo"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
