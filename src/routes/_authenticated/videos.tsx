import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Film } from "lucide-react";

import { EmptyState, LoadingGrid, PageHeader, StatusBadge } from "@/components/admin/ui-bits";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORIES, VIDEO_STATUS, formatDuration, labelOf } from "@/lib/domain";

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

function VideosPage() {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["videos-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("videos")
        .select("*, campaigns(id, name, clients(company_name))")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const videos = (data ?? []).filter((video) =>
    video.title.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <>
      <PageHeader title="Vídeos" description="Todos os conteúdos enviados, com status de aprovação." />
      <Input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Buscar vídeo..."
        className="mb-5 max-w-sm"
      />
      {isLoading ? (
        <LoadingGrid />
      ) : videos.length ? (
        <div className="surface-panel divide-y divide-border">
          {videos.map((video) => {
            const campaign = video.campaigns as
              | { id: string; name: string; clients: { company_name: string } | null }
              | null;
            return (
              <div key={video.id} className="flex flex-wrap items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{video.title}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {campaign?.clients?.company_name} ·{" "}
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
                </div>
                <span className="text-sm text-muted-foreground">
                  {labelOf(CATEGORIES, video.category)}
                </span>
                <span className="text-sm text-muted-foreground">
                  {formatDuration(video.duration_seconds)}
                </span>
                <StatusBadge value={video.status} label={labelOf(VIDEO_STATUS, video.status)} />
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState icon={<Film className="h-8 w-8" />} title="Nenhum vídeo encontrado" />
      )}
    </>
  );
}
