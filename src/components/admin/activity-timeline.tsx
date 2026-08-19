import { useQuery } from "@tanstack/react-query";
import { Activity } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { formatDateTime } from "@/lib/domain";
import { LoadingGrid } from "@/components/admin/ui-bits";

export function ActivityTimeline({
  clientId,
  campaignId,
  limit = 30,
  emptyLabel = "Nenhuma atividade registrada ainda.",
}: {
  clientId?: string;
  campaignId?: string;
  limit?: number;
  emptyLabel?: string;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["activity-timeline", clientId ?? null, campaignId ?? null, limit],
    queryFn: async () => {
      let query = supabase
        .from("activity_logs")
        .select("id, actor, action, description, created_at")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (clientId) query = query.eq("client_id", clientId);
      if (campaignId) query = query.eq("campaign_id", campaignId);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <LoadingGrid rows={2} />;

  if (!data?.length) {
    return (
      <p className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
        <Activity className="h-4 w-4" /> {emptyLabel}
      </p>
    );
  }

  return (
    <ol className="relative space-y-4 border-l border-border pl-5">
      {data.map((log) => (
        <li key={log.id} className="relative">
          <span className="gradient-brand absolute -left-[26px] top-1.5 h-2.5 w-2.5 rounded-full" />
          <p className="text-sm">{log.description}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {log.actor === "cliente" ? "Cliente" : "Equipe SMART TAG"} · {formatDateTime(log.created_at)}
          </p>
        </li>
      ))}
    </ol>
  );
}
