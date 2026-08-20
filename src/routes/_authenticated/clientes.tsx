import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Pencil, Trash2, Users, Search, History } from "lucide-react";
import { toast } from "sonner";

import { ActivityTimeline } from "@/components/admin/activity-timeline";
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
import { CLIENT_STATUS, formatDate, labelOf, randomSuffix, slugify } from "@/lib/domain";

export const Route = createFileRoute("/_authenticated/clientes")({
  head: () => ({
    meta: [
      { title: "Clientes | SMART TAG Content Hub" },
      { name: "description", content: "Cadastro e gestão dos clientes atendidos pela SMART TAG." },
      { property: "og:title", content: "Clientes | SMART TAG Content Hub" },
      { property: "og:description", content: "Cadastro e gestão dos clientes atendidos pela SMART TAG." },
    ],
  }),
  component: ClientsPage,
});

type ClientForm = {
  id?: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string;
  status: string;
  notes: string;
};

const EMPTY: ClientForm = {
  company_name: "",
  contact_name: "",
  email: "",
  phone: "",
  status: "ativo",
  notes: "",
};

function ClientsPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ClientForm>(EMPTY);
  const [search, setSearch] = useState("");
  const [history, setHistory] = useState<{ id: string; name: string } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*, campaigns(id)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const save = useMutation({
    mutationFn: async (values: ClientForm) => {
      const payload = {
        company_name: values.company_name,
        contact_name: values.contact_name || null,
        email: values.email || null,
        phone: values.phone || null,
        status: values.status,
        notes: values.notes || null,
      };
      if (values.id) {
        const { error } = await supabase.from("clients").update(payload).eq("id", values.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("clients")
          .insert({ ...payload, slug: `${slugify(values.company_name)}-${randomSuffix()}` });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(form.id ? "Cliente atualizado" : "Cliente cadastrado");
      setOpen(false);
      setForm(EMPTY);
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("clients").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Cliente removido");
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const filtered = (data ?? []).filter((client) =>
    `${client.company_name} ${client.contact_name ?? ""} ${client.email ?? ""}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  return (
    <>
      <PageHeader
        title="Clientes"
        description="Gerencie as empresas atendidas e seus contatos principais."
        actions={
          <Button
            className="gradient-brand"
            onClick={() => {
              setForm(EMPTY);
              setOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" /> Novo cliente
          </Button>
        }
      />

      <div className="relative mb-5 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar cliente..."
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <LoadingGrid />
      ) : filtered.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((client) => (
            <article key={client.id} className="surface-panel flex flex-col gap-3 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate font-display text-lg font-semibold">
                    {client.company_name}
                  </h2>
                  <p className="truncate text-sm text-muted-foreground">
                    {client.email || "E-mail não informado"}
                  </p>
                </div>
                <StatusBadge value={client.status} label={labelOf(CLIENT_STATUS, client.status)} />
              </div>
              <dl className="space-y-1 text-sm text-muted-foreground">
                <div>{client.contact_name || "Contato não informado"}</div>
                <div>{client.phone || "—"}</div>
              </dl>
              <div className="mt-auto flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
                <span>
                  {(client.campaigns as { id: string }[] | null)?.length ?? 0} campanhas · desde{" "}
                  {formatDate(client.created_at)}
                </span>
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Ver histórico do cliente"
                    onClick={() => setHistory({ id: client.id, name: client.company_name })}
                  >
                    <History className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Editar cliente"
                    onClick={() => {
                      setForm({
                        id: client.id,
                        company_name: client.company_name,
                        contact_name: client.contact_name ?? "",
                        email: client.email ?? "",
                        phone: client.phone ?? "",
                        status: client.status,
                        notes: client.notes ?? "",
                      });
                      setOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Remover cliente"
                    onClick={() => {
                      if (confirm(`Remover ${client.company_name} e suas campanhas?`)) {
                        remove.mutate(client.id);
                      }
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
          icon={<Users className="h-8 w-8" />}
          title="Nenhum cliente cadastrado"
          description="Cadastre o primeiro cliente para começar a criar campanhas e portais."
          action={
            <Button className="gradient-brand" onClick={() => setOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Novo cliente
            </Button>
          }
        />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{form.id ? "Editar cliente" : "Novo cliente"}</DialogTitle>
            <DialogDescription>Dados usados no portal e nas campanhas.</DialogDescription>
          </DialogHeader>
          <form
            id="client-form"
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              save.mutate(form);
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="company">Empresa *</Label>
              <Input
                id="company"
                required
                value={form.company_name}
                onChange={(event) => setForm({ ...form, company_name: event.target.value })}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="contact">Contato</Label>
                <Input
                  id="contact"
                  value={form.contact_name}
                  onChange={(event) => setForm({ ...form, contact_name: event.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(event) => setForm({ ...form, phone: event.target.value })}
                />
              </div>
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
                  {CLIENT_STATUS.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                rows={3}
                value={form.notes}
                onChange={(event) => setForm({ ...form, notes: event.target.value })}
              />
            </div>
          </form>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)} type="button">
              Cancelar
            </Button>
            <Button form="client-form" type="submit" className="gradient-brand" disabled={save.isPending}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!history} onOpenChange={(value) => !value && setHistory(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Histórico de {history?.name}</DialogTitle>
            <DialogDescription>
              Linha do tempo com acessos, seleções, aprovações e downloads do cliente.
            </DialogDescription>
          </DialogHeader>
          {history && (
            <ActivityTimeline
              clientId={history.id}
              limit={50}
              emptyLabel="Nenhuma interação registrada para este cliente."
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
