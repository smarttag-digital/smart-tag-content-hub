import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Check,
  Clock,
  Download,
  FileArchive,
  FileText,
  Image as ImageIcon,
  Layers,
  Loader2,
  Film,
  Package,
  Play,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  APPROVAL_STATUS,
  CATEGORIES,
  MATERIAL_TYPES,
  formatBytes,
  formatCountdown,
  formatDuration,
  formatPeriod,
  labelOf,
} from "@/lib/domain";
import {
  confirmSelection,
  downloadMaterial,
  getPortal,
  getPortalMaterials,
  saveVideoNote,
  setVideoApproval,
  toggleVideoSelection,
} from "@/lib/portal.functions";

const MATERIAL_ICON: Record<string, typeof Film> = {
  video: Film,
  imagem: ImageIcon,
  carrossel: Layers,
  pdf: FileText,
  zip: FileArchive,
};

export const Route = createFileRoute("/portal/$slug")({
  head: () => ({
    meta: [
      { title: "Portal de seleção | SMART TAG" },
      { name: "description", content: "Assista aos vídeos da sua campanha e escolha os conteúdos que deseja receber." },
      { property: "og:title", content: "Portal de seleção | SMART TAG" },
      { property: "og:description", content: "Assista aos vídeos da sua campanha e escolha os conteúdos que deseja receber." },
    ],
  }),
  ssr: false,
  component: PortalPage,
});

function PortalPage() {
  const { slug } = Route.useParams();
  const queryClient = useQueryClient();
  const load = useServerFn(getPortal);
  const toggle = useServerFn(toggleVideoSelection);
  const note = useServerFn(saveVideoNote);
  const approve = useServerFn(setVideoApproval);
  const confirm = useServerFn(confirmSelection);
  const [filter, setFilter] = useState("todas");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [changeDrafts, setChangeDrafts] = useState<Record<string, string>>({});
  const [changeOpen, setChangeOpen] = useState<Record<string, boolean>>({});
  const [playing, setPlaying] = useState<{ id: string; title: string; url: string } | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["portal", slug],
    queryFn: () => load({ data: { slug } }),
    retry: false,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["portal", slug] });

  const toggleMutation = useMutation({
    mutationFn: (input: { videoId: string; selected: boolean }) =>
      toggle({ data: { slug, ...input } }),
    onSuccess: invalidate,
    onError: (err: Error) => toast.error(err.message),
  });

  const noteMutation = useMutation({
    mutationFn: (input: { videoId: string; note: string }) => note({ data: { slug, ...input } }),
    onSuccess: () => {
      toast.success("Observação enviada");
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const confirmMutation = useMutation({
    mutationFn: () => confirm({ data: { slug } }),
    onSuccess: () => {
      toast.success("Seleção confirmada! Nossa equipe já foi avisada.");
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const loadMaterials = useServerFn(getPortalMaterials);
  const download = useServerFn(downloadMaterial);

  const { data: materials } = useQuery({
    queryKey: ["portal-materials", slug],
    queryFn: () => loadMaterials({ data: { slug } }),
    retry: false,
    refetchInterval: 60_000,
  });

  const downloadMutation = useMutation({
    mutationFn: (materialId: string) => download({ data: { slug, materialId } }),
    onSuccess: (result) => {
      window.open(result.url, "_blank", "noopener");
      toast.success("Download liberado");
      queryClient.invalidateQueries({ queryKey: ["portal-materials", slug] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (isLoading) {
    return (
      <main className="aurora flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-brand-violet" />
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="aurora flex min-h-screen items-center justify-center px-4 text-center">
        <div className="surface-panel max-w-md p-8">
          <h1 className="font-display text-xl font-semibold">Portal indisponível</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {error instanceof Error ? error.message : "Verifique o link recebido pela equipe."}
          </p>
        </div>
      </main>
    );
  }

  const videos = data.videos.filter(
    (video) => filter === "todas" || video.category === filter,
  );
  const selectedCount = data.videos.filter((video) => video.selected).length;

  return (
    <main className="min-h-screen bg-background pb-32">
      <header className="aurora border-b border-border px-4 py-12 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-violet">
            {data.agency.agency_name}
          </p>
          <h1 className="mt-3 font-display text-3xl font-bold lg:text-4xl">{data.campaign.name}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {data.client.company_name} · {formatPeriod(data.campaign.start_date, data.campaign.end_date)}
          </p>
          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {data.agency.portal_message}
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8 lg:px-10">
        {data.locked && (
          <div className="surface-panel mb-6 flex items-center gap-3 p-4 text-sm">
            <Check className="h-4 w-4 text-emerald-400" />
            Seleção confirmada. Nossa equipe está preparando os conteúdos escolhidos.
          </div>
        )}

        <div className="mb-6 flex flex-wrap gap-2">
          {[{ value: "todas", label: "Todas" }, ...CATEGORIES].map((category) => (
            <button
              key={category.value}
              onClick={() => setFilter(category.value)}
              className={
                filter === category.value
                  ? "gradient-brand rounded-full px-4 py-1.5 text-sm font-medium text-primary-foreground"
                  : "rounded-full border border-border px-4 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              }
            >
              {category.label}
            </button>
          ))}
        </div>

        {videos.length ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {videos.map((video) => (
              <article
                key={video.id}
                className={
                  video.selected
                    ? "surface-panel overflow-hidden ring-2 ring-brand-violet"
                    : "surface-panel overflow-hidden"
                }
              >
                <button
                  type="button"
                  className="group relative block aspect-video w-full bg-surface-2"
                  disabled={!video.videoUrl}
                  onClick={() =>
                    video.videoUrl &&
                    setPlaying({ id: video.id, title: video.title, url: video.videoUrl })
                  }
                  aria-label={`Assistir ${video.title}`}
                >
                  {video.thumbnailUrl ? (
                    <img
                      src={video.thumbnailUrl}
                      alt={`Miniatura do vídeo ${video.title}`}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      <Film className="h-8 w-8" />
                    </div>
                  )}
                  <span className="absolute inset-0 flex items-center justify-center bg-background/40 opacity-0 transition-opacity group-hover:opacity-100">
                    <span className="gradient-brand flex h-14 w-14 items-center justify-center rounded-full text-primary-foreground shadow-glow">
                      <Play className="h-6 w-6" />
                    </span>
                  </span>
                  <span className="absolute bottom-2 right-2 rounded bg-background/85 px-1.5 py-0.5 text-xs">
                    {formatDuration(video.duration_seconds)}
                  </span>
                </button>
                <div className="space-y-3 p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h2 className="truncate font-display font-semibold">{video.title}</h2>
                      <p className="text-xs text-muted-foreground">
                        {labelOf(CATEGORIES, video.category)} ·{" "}
                        {formatDuration(video.duration_seconds)}
                      </p>
                    </div>
                  </div>
                  {video.description && (
                    <p className="text-sm text-muted-foreground">{video.description}</p>
                  )}

                  {!data.locked && (
                    <>
                      <Button
                        variant={video.selected ? "secondary" : "default"}
                        className={video.selected ? "w-full" : "gradient-brand w-full"}
                        onClick={() =>
                          toggleMutation.mutate({ videoId: video.id, selected: !video.selected })
                        }
                      >
                        {video.selected ? "Remover seleção" : "Selecionar vídeo"}
                      </Button>
                      {video.selected && (
                        <div className="space-y-2">
                          <Textarea
                            rows={2}
                            placeholder="Alguma observação sobre este vídeo?"
                            value={notes[video.id] ?? video.note ?? ""}
                            onChange={(event) =>
                              setNotes({ ...notes, [video.id]: event.target.value })
                            }
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              noteMutation.mutate({
                                videoId: video.id,
                                note: notes[video.id] ?? video.note ?? "",
                              })
                            }
                          >
                            Enviar observação
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                  {data.locked && video.selected && (
                    <p className="text-sm text-emerald-300">Selecionado</p>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="py-16 text-center text-sm text-muted-foreground">
            Nenhum vídeo nesta categoria.
          </p>
        )}
      </div>

      {!!materials?.length && (
        <section className="mx-auto max-w-6xl px-4 pb-10 lg:px-10">
          <div className="mb-5 flex items-center gap-2">
            <Package className="h-5 w-5 text-brand-violet" />
            <h2 className="font-display text-xl font-semibold">Materiais disponíveis</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {materials.map((material) => {
              const Icon = MATERIAL_ICON[material.file_type] ?? Package;
              return (
                <article
                  key={material.id}
                  className={
                    material.expired
                      ? "surface-panel space-y-3 p-5 opacity-60"
                      : "surface-panel space-y-3 p-5"
                  }
                >
                  <div className="flex items-start gap-3">
                    <span className="gradient-brand flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-primary-foreground">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="truncate font-display font-semibold">{material.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {labelOf(MATERIAL_TYPES, material.file_type)} ·{" "}
                        {formatBytes(material.file_size)}
                      </p>
                    </div>
                  </div>

                  {material.description && (
                    <p className="text-sm text-muted-foreground">{material.description}</p>
                  )}

                  <p
                    className={
                      material.expired
                        ? "flex items-center gap-1.5 text-xs text-destructive"
                        : "flex items-center gap-1.5 text-xs text-muted-foreground"
                    }
                  >
                    <Clock className="h-3.5 w-3.5" />
                    {material.expired
                      ? "Link expirado — solicite a liberação à equipe"
                      : formatCountdown(material.expires_at)}
                  </p>

                  <Button
                    className={material.expired ? "w-full" : "gradient-brand w-full"}
                    variant={material.expired ? "secondary" : "default"}
                    disabled={material.expired || downloadMutation.isPending}
                    onClick={() => downloadMutation.mutate(material.id)}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    {material.expired ? "Indisponível" : "Baixar material"}
                  </Button>
                </article>
              );
            })}
          </div>
        </section>
      )}


      {!data.locked && (
        <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-background/90 px-4 py-4 backdrop-blur-xl lg:px-10">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{selectedCount}</span> vídeo(s)
              selecionado(s)
            </p>
            <Button
              className="gradient-brand"
              disabled={!selectedCount || confirmMutation.isPending}
              onClick={() => confirmMutation.mutate()}
            >
              {confirmMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar seleção
            </Button>
          </div>
        </div>
      )}
      <Dialog open={!!playing} onOpenChange={(value) => !value && setPlaying(null)}>
        <DialogContent className="max-w-4xl border-border bg-background p-0">
          <DialogTitle className="sr-only">{playing?.title ?? "Vídeo"}</DialogTitle>
          <button
            type="button"
            onClick={() => setPlaying(null)}
            aria-label="Fechar player"
            className="absolute right-3 top-3 z-10 rounded-full bg-background/80 p-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
          {playing && (
            <video
              src={playing.url}
              controls
              autoPlay
              className="aspect-video w-full rounded-lg bg-black"
            />
          )}
          <div className="px-5 pb-5">
            <h3 className="font-display text-lg font-semibold">{playing?.title}</h3>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
