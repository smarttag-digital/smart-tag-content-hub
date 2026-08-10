import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Megaphone, Copy, ExternalLink, Trash2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { CAMPAIGN_STATUS, formatPeriod, labelOf, randomSuffix, slugify } from "@/lib/domain";

export const Route = createFileRoute("/_authenticated/campanhas")({
  head: () => ({
    meta: [
      { title: "Campanhas | SMART TAG Content Hub" },
      {
        name: "description",
        content: "Crie campanhas, publique portais de seleção e acompanhe o status de cada cliente.",
      },
      { property: "og:title", content: "Campanhas | SMART TAG Content Hub" },
      {
        property: "og:description",
        content: "Crie campanhas, publique portais de seleção e acompanhe o status de cada cliente.",
      },
    ],
  }),
  component: CampaignsPage,
});

type Form = {
  client_id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  status: string;
};

const EMPTY: Form = {
  client_id: "",
  name: "",
  description: "",
  start_date: "",
  end_date: "",
  status: "rascunho",
};

function CampaignsPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Form>(EMPTY);
  const [filter, setFilter] = useState("todas");

  const { data: clients } = useQuery({
    queryKey: ["clients", "options"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, company_name")
        .order("company_name");
      if (error) throw error;
      return data;
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campaigns")
        .select("*, clients(company_name), videos(id, status)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const save = useMutation({
    mutationFn: async (values: Form) => {
      const { error } = await supabase.from("campaigns").insert({
        client_id: values.client_id,
        name: values.name,
        description: values.description || null,
        start_date: values.start_date || null,
        end_date: values.end_date || null,
        status: values.status,
        slug: `${slugify(values.name)}-${randomSuffix()}`,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Campanha criada");
      setOpen(false);
      setForm(EMPTY);
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("campaigns").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Campanha removida");
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const campaigns = (data ?? []).filter(
    (campaign) => filter === "todas" || campaign.status === filter,
  );

  function copyLink(slug: string) {
    const url = `${window.location.origin}/portal/${slug}`;
    navigator.clipboard.writeText(url);
    toast.success("Link do portal copiado!");
  }

  return (
    <>
      <PageHeader
        title="Campanhas"
        description="Organize os conteúdos por período e libere o portal de seleção do cliente."
        actions={
          <Button
            className="gradient-brand"
            onClick={() => {
              setForm(EMPTY);
              setOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" /> Nova campanha
          </Button>
        }
      />

      <div className="mb-5 flex flex-wrap gap-2">
        {[{ value: "todas", label: "Todas" }, ...CAMPAIGN_STATUS].map((status) => (
          <button
            key={status.value}
            onClick={() => setFilter(status.value)}
            className={
              filter === status.value
                ? "gradient-brand rounded-full px-4 py-1.5 text-sm font-medium text-primary-foreground"
                : "rounded-full border border-border px-4 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            }
          >
            {status.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <LoadingGrid />
      ) : campaigns.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {campaigns.map((campaign) => {
            const videos = (campaign.videos as { id: string; status: string }[]) ?? [];
            const chosen = videos.filter((video) => video.status !== "aguardando").length;
            return (
              <article key={campaign.id} className="surface-panel p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      to="/campanhas/$id"
                      params={{ id: campaign.id }}
                      className="font-display text-lg font-semibold hover:underline"
                    >
                      {campaign.name}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {(campaign.clients as { company_name: string } | null)?.company_name}
                    </p>
                  </div>
                  <StatusBadge
                    value={campaign.status}
                    label={labelOf(CAMPAIGN_STATUS, campaign.status)}
                  />
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  {formatPeriod(campaign.start_date, campaign.end_date)}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {videos.length} vídeos · {chosen} escolhidos
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button size="sm" variant="secondary" onClick={() => copyLink(campaign.slug)}>
                    <Copy className="mr-2 h-3.5 w-3.5" /> Copiar link
                  </Button>
                  <a
                    href={`/portal/${campaign.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <ExternalLink className="mr-2 h-3.5 w-3.5" /> Abrir portal
                  </a>
                  <Link
                    to="/campanhas/$id"
                    params={{ id: campaign.id }}
                    className="inline-flex items-center rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Gerenciar vídeos
                  </Link>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Remover campanha"
                    className="ml-auto"
                    onClick={() => {
                      if (confirm(`Remover a campanha "${campaign.name}"?`)) remove.mutate(campaign.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={<Megaphone className="h-8 w-8" />}
          title="Nenhuma campanha encontrada"
          description="Crie uma campanha e envie o link privado para seu cliente escolher os vídeos."
        />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Nova campanha</DialogTitle>
            <DialogDescription>
              Cada campanha gera um link privado exclusivo para o cliente.
            </DialogDescription>
          </DialogHeader>
          <form
            id="campaign-form"
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (!form.client_id) {
                toast.error("Selecione um cliente");
                return;
              }
              save.mutate(form);
            }}
          >
            <div className="space-y-2">
              <Label>Cliente *</Label>
              <Select
                value={form.client_id}
                onValueChange={(value) => setForm({ ...form, client_id: value })}
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
              <Label htmlFor="name">Nome da campanha *</Label>
              <Input
                id="name"
                required
                placeholder="Conteúdos de Março"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="start">Início</Label>
                <Input
                  id="start"
                  type="date"
                  value={form.start_date}
                  onChange={(event) => setForm({ ...form, start_date: event.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end">Fim</Label>
                <Input
                  id="end"
                  type="date"
                  value={form.end_date}
                  onChange={(event) => setForm({ ...form, end_date: event.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="desc">Descrição</Label>
              <Textarea
                id="desc"
                rows={3}
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
              />
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
                  {CAMPAIGN_STATUS.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </form>
          <DialogFooter>
            <Button variant="ghost" type="button" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button form="campaign-form" type="submit" className="gradient-brand" disabled={save.isPending}>
              Criar campanha
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
