import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Users, Megaphone, Film, CheckSquare, Clock, ArrowRight } from "lucide-react";

import { PageHeader, StatusBadge, LoadingGrid, EmptyState } from "@/components/admin/ui-bits";
import { supabase } from "@/integrations/supabase/client";
import { CAMPAIGN_STATUS, formatDateTime, formatPeriod, labelOf } from "@/lib/domain";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard | SMART TAG Content Hub" },
      {
        name: "description",
        content: "Indicadores de clientes, campanhas, vídeos e seleções da agência SMART TAG.",
      },
      { property: "og:title", content: "Dashboard | SMART TAG Content Hub" },
      {
        property: "og:description",
        content: "Indicadores de clientes, campanhas, vídeos e seleções da agência SMART TAG.",
      },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const [clients, campaigns, videos, selections, logs, recentCampaigns, materials, downloads] =
        await Promise.all([
          supabase.from("clients").select("id", { count: "exact", head: true }).eq("status", "ativo"),
          supabase
            .from("campaigns")
            .select("id", { count: "exact", head: true })
            .eq("status", "publicada"),
          supabase.from("videos").select("id, status"),
          supabase.from("selections").select("id, status"),
          supabase
            .from("activity_logs")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(8),
          supabase
            .from("campaigns")
            .select("*, clients(company_name), videos(id, status)")
            .order("created_at", { ascending: false })
            .limit(5),
          supabase
            .from("materials")
            .select("id, name, status, expires_at, clients(company_name), campaigns(name)")
            .eq("status", "publicado"),
          supabase.from("material_downloads").select("id", { count: "exact", head: true }),
        ]);

      const allVideos = videos.data ?? [];
      const allMaterials = materials.data ?? [];
      const active = allMaterials.filter((material) => !isExpired(material.expires_at));
      const expiringSoon = active.filter((material) => {
        const hours = hoursUntil(material.expires_at);
        return hours !== null && hours <= 24;
      });

      return {
        clients: clients.count ?? 0,
        campaigns: campaigns.count ?? 0,
        videos: allVideos.length,
        selected: allVideos.filter((video) => video.status === "selecionado").length,
        waitingSend: allVideos.filter((video) => video.status === "preparacao").length,
        pendingSelections: (selections.data ?? []).filter((item) => item.status === "confirmada")
          .length,
        activeMaterials: active.length,
        expiredMaterials: allMaterials.length - active.length,
        downloads: downloads.count ?? 0,
        expiringSoon,
        logs: logs.data ?? [],
        recentCampaigns: recentCampaigns.data ?? [],
      };
    },
  });

  const kpis = [
    { label: "Clientes ativos", value: data?.clients ?? 0, icon: Users },
    { label: "Campanhas publicadas", value: data?.campaigns ?? 0, icon: Megaphone },
    { label: "Vídeos publicados", value: data?.videos ?? 0, icon: Film },
    { label: "Vídeos selecionados", value: data?.selected ?? 0, icon: CheckSquare },
    { label: "Aguardando envio", value: data?.waitingSend ?? 0, icon: Clock },
    { label: "Materiais disponíveis", value: data?.activeMaterials ?? 0, icon: Package },
    { label: "Materiais expirados", value: data?.expiredMaterials ?? 0, icon: AlertTriangle },
    { label: "Downloads realizados", value: data?.downloads ?? 0, icon: Download },
  ];


  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Visão geral das campanhas, conteúdos e aprovações dos seus clientes."
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="surface-panel p-5 transition-transform hover:-translate-y-0.5">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {kpi.label}
              </p>
              <kpi.icon className="h-4 w-4 text-brand-violet" />
            </div>
            <p className="mt-3 font-display text-3xl font-bold">{isLoading ? "—" : kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-5">
        <section className="surface-panel p-6 lg:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Campanhas recentes</h2>
            <Link
              to="/campanhas"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Ver todas <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {isLoading ? (
            <LoadingGrid />
          ) : data?.recentCampaigns.length ? (
            <div className="space-y-3">
              {data.recentCampaigns.map((campaign) => {
                const videos = (campaign.videos as { id: string; status: string }[]) ?? [];
                const selected = videos.filter((video) => video.status !== "aguardando").length;
                return (
                  <Link
                    key={campaign.id}
                    to="/campanhas/$id"
                    params={{ id: campaign.id }}
                    className="flex flex-col gap-2 rounded-xl border border-border bg-surface-2/40 p-4 transition-colors hover:border-brand-violet/40 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{campaign.name}</p>
                      <p className="truncate text-sm text-muted-foreground">
                        {(campaign.clients as { company_name: string } | null)?.company_name} ·{" "}
                        {formatPeriod(campaign.start_date, campaign.end_date)}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-muted-foreground">
                        {videos.length} vídeos · {selected} selecionados
                      </span>
                      <StatusBadge
                        value={campaign.status}
                        label={labelOf(CAMPAIGN_STATUS, campaign.status)}
                      />
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="Nenhuma campanha criada."
              description="Crie sua primeira campanha para começar a compartilhar conteúdos."
            />
          )}
        </section>

        <section className="surface-panel p-6 lg:col-span-2">
          <h2 className="mb-4 font-display text-lg font-semibold">Últimas atividades</h2>
          {isLoading ? (
            <LoadingGrid rows={4} />
          ) : data?.logs.length ? (
            <ol className="space-y-4">
              {data.logs.map((log) => (
                <li key={log.id} className="flex gap-3">
                  <span className="gradient-brand mt-1.5 h-2 w-2 shrink-0 rounded-full" />
                  <div>
                    <p className="text-sm leading-snug">{log.description}</p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(log.created_at)}</p>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nenhuma atividade registrada ainda.
            </p>
          )}
        </section>
      </div>
    </>
  );
}
