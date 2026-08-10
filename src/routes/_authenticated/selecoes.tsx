import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckSquare } from "lucide-react";
import { toast } from "sonner";

import { EmptyState, LoadingGrid, PageHeader, StatusBadge } from "@/components/admin/ui-bits";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { SELECTION_STATUS, formatDateTime, labelOf } from "@/lib/domain";

export const Route = createFileRoute("/_authenticated/selecoes")({
  head: () => ({
    meta: [
      { title: "Seleções | SMART TAG Content Hub" },
      { name: "description", content: "Acompanhe as escolhas confirmadas pelos clientes e o envio dos conteúdos." },
      { property: "og:title", content: "Seleções | SMART TAG Content Hub" },
      { property: "og:description", content: "Acompanhe as escolhas confirmadas pelos clientes e o envio dos conteúdos." },
    ],
  }),
  component: SelectionsPage,
});

function SelectionsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["selections"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("selections")
        .select("*, campaigns(id, name), clients(company_name), selection_items(id, note, videos(title))")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const update = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("selections").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Status atualizado");
      queryClient.invalidateQueries({ queryKey: ["selections"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const selections = (data ?? []).filter(
    (selection) => (selection.selection_items as unknown[] | null)?.length,
  );

  return (
    <>
      <PageHeader
        title="Seleções"
        description="Escolhas confirmadas pelos clientes e andamento da entrega."
      />
      {isLoading ? (
        <LoadingGrid />
      ) : selections.length ? (
        <div className="space-y-4">
          {selections.map((selection) => {
            const items =
              (selection.selection_items as { id: string; note: string | null; videos: { title: string } | null }[]) ??
              [];
            const campaign = selection.campaigns as { id: string; name: string } | null;
            return (
              <article key={selection.id} className="surface-panel p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-display text-lg font-semibold">
                      {(selection.clients as { company_name: string } | null)?.company_name}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {campaign ? (
                        <Link to="/campanhas/$id" params={{ id: campaign.id }} className="hover:underline">
                          {campaign.name}
                        </Link>
                      ) : (
                        "—"
                      )}{" "}
                      · confirmada em {formatDateTime(selection.confirmed_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge
                      value={selection.status}
                      label={labelOf(SELECTION_STATUS, selection.status)}
                    />
                    <Select
                      value={selection.status}
                      onValueChange={(status) => update.mutate({ id: selection.id, status })}
                    >
                      <SelectTrigger className="h-9 w-44 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SELECTION_STATUS.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <ul className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
                  {items.map((item) => (
                    <li key={item.id} className="flex flex-col gap-0.5">
                      <span className="font-medium">{item.videos?.title ?? "Vídeo"}</span>
                      {item.note && (
                        <span className="text-muted-foreground">Observação: {item.note}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={<CheckSquare className="h-8 w-8" />}
          title="Nenhuma seleção confirmada"
          description="Assim que um cliente confirmar as escolhas, elas aparecerão aqui."
        />
      )}
    </>
  );
}
