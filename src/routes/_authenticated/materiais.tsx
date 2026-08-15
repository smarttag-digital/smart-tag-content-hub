import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useRef, useState } from "react";
import {
  Copy,
  Download,
  FileArchive,
  FileText,
  Film,
  Image as ImageIcon,
  Layers,
  Package,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
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
import {
  MATERIAL_STATUS,
  MATERIAL_TYPES,
  formatBytes,
  formatCountdown,
  formatDateTime,
  guessMaterialType,
  isExpired,
  labelOf,
} from "@/lib/domain";

export const Route = createFileRoute("/_authenticated/materiais")({
  head: () => ({
    meta: [
      { title: "Materiais | SMART TAG Content Hub" },
      {
        name: "description",
        content: "Entrega final de vídeos, imagens, PDFs e pacotes com links temporários por cliente.",
      },
      { property: "og:title", content: "Materiais | SMART TAG Content Hub" },
      {
        property: "og:description",
        content: "Entrega final de vídeos, imagens, PDFs e pacotes com links temporários por cliente.",
      },
    ],
  }),
  component: MateriaisPage,
});

const TYPE_ICON: Record<string, typeof Film> = {
  video: Film,
  imagem: ImageIcon,
  carrossel: Layers,
  pdf: FileText,
  zip: FileArchive,
};

type FormState = {
  name: string;
  description: string;
  clientId: string;
  campaignId: string;
  type: string;
  status: string;
  durationDays: string;
};

const EMPTY_FORM: FormState = {
  name: "",
  description: "",
  clientId: "",
  campaignId: "",
  type: "video",
  status: "publicado",
  durationDays: "7",
};

function expiryFrom(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

function MateriaisPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [clientFilter, setClientFilter] = useState("todos");
  const [campaignFilter, setCampaignFilter] = useState("todas");
  const [typeFilter, setTypeFilter] = useState("todos");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [expiryFilter, setExpiryFilter] = useState("todos");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["materials"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("materials")
        .select("*, clients(company_name), campaigns(id, name, slug)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: downloads } = useQuery({
    queryKey: ["material-downloads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("material_downloads")
        .select("*, materials(name), clients(company_name)")
        .order("downloaded_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
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

  function resetForm() {
    setForm(EMPTY_FORM);
    setFile(null);
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const removeMaterial = useMutation({
    mutationFn: async (material: { id: string; file_path: string }) => {
      await supabase.storage.from("materials").remove([material.file_path]);
      const { error } = await supabase.from("materials").delete().eq("id", material.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Material removido");
      queryClient.invalidateQueries({ queryKey: ["materials"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const republish = useMutation({
    mutationFn: async ({ id, days, count }: { id: string; days: number; count: number }) => {
      const { error } = await supabase
        .from("materials")
        .update({
          status: "publicado",
          duration_days: days,
          published_at: new Date().toISOString(),
          expires_at: expiryFrom(days),
          republished_count: count + 1,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Material republicado por um novo período");
      queryClient.invalidateQueries({ queryKey: ["materials"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status, days }: { id: string; status: string; days: number }) => {
      const { error } = await supabase
        .from("materials")
        .update(
          status === "publicado"
            ? {
                status,
                published_at: new Date().toISOString(),
                expires_at: expiryFrom(days),
              }
            : { status },
        )
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["materials"] }),
    onError: (error: Error) => toast.error(error.message),
  });

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.campaignId) {
      toast.error("Selecione a campanha");
      return;
    }
    if (!file) {
      toast.error("Selecione o arquivo do material");
      return;
    }

    const campaign = (campaigns ?? []).find((item) => item.id === form.campaignId);
    if (!campaign) {
      toast.error("Campanha inválida");
      return;
    }

    setUploading(true);
    setProgress(10);
    try {
      const ext = file.name.split(".").pop() ?? "bin";
      const path = `${campaign.client_id}/${form.campaignId}/${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("materials")
        .upload(path, file, { contentType: file.type || "application/octet-stream" });
      if (uploadError) throw uploadError;
      setProgress(80);

      const days = Number(form.durationDays) || 7;
      const published = form.status === "publicado";
      const { error } = await supabase.from("materials").insert({
        client_id: campaign.client_id,
        campaign_id: form.campaignId,
        name: form.name || file.name.replace(/\.[^.]+$/, ""),
        description: form.description || null,
        file_path: path,
        file_name: file.name,
        file_type: form.type,
        file_mime: file.type || null,
        file_size: file.size,
        status: form.status,
        duration_days: days,
        published_at: published ? new Date().toISOString() : null,
        expires_at: published ? expiryFrom(days) : null,
      });
      if (error) throw error;

      setProgress(100);
      toast.success("Material adicionado!");
      queryClient.invalidateQueries({ queryKey: ["materials"] });
      setOpen(false);
      resetForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha no upload");
    } finally {
      setUploading(false);
    }
  }

  const materials = (data ?? []).filter((material) => {
    const client = material.clients as { company_name: string } | null;
    const campaign = material.campaigns as { id: string; name: string; slug: string } | null;
    const haystack = `${material.name} ${material.file_name} ${client?.company_name ?? ""} ${campaign?.name ?? ""}`;
    const expired = isExpired(material.expires_at);
    return (
      haystack.toLowerCase().includes(search.toLowerCase()) &&
      (clientFilter === "todos" || material.client_id === clientFilter) &&
      (campaignFilter === "todas" || material.campaign_id === campaignFilter) &&
      (typeFilter === "todos" || material.file_type === typeFilter) &&
      (statusFilter === "todos" || material.status === statusFilter) &&
      (expiryFilter === "todos" ||
        (expiryFilter === "expirados" && expired) ||
        (expiryFilter === "vigentes" && !expired))
    );
  });

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader
          title="Materiais"
          description="Arquivos finais entregues ao cliente com link temporário e controle de expiração."
        />
        <Button className="gradient-brand" onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Adicionar material
        </Button>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por material, cliente ou campanha..."
          className="max-w-sm"
        />
        <Select value={clientFilter} onValueChange={setClientFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os clientes</SelectItem>
            {(clients ?? []).map((client) => (
              <SelectItem key={client.id} value={client.id}>
                {client.company_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={campaignFilter} onValueChange={setCampaignFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as campanhas</SelectItem>
            {(campaigns ?? []).map((campaign) => (
              <SelectItem key={campaign.id} value={campaign.id}>
                {campaign.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os tipos</SelectItem>
            {MATERIAL_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status</SelectItem>
            {MATERIAL_STATUS.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={expiryFilter} onValueChange={setExpiryFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Vigência: todas</SelectItem>
            <SelectItem value="vigentes">Dentro do prazo</SelectItem>
            <SelectItem value="expirados">Expirados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <LoadingGrid />
      ) : materials.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {materials.map((material) => {
            const client = material.clients as { company_name: string } | null;
            const campaign = material.campaigns as { id: string; name: string; slug: string } | null;
            const expired = isExpired(material.expires_at);
            const Icon = TYPE_ICON[material.file_type] ?? Package;
            return (
              <article key={material.id} className="surface-panel space-y-3 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="gradient-brand flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-primary-foreground">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="truncate font-medium">{material.name}</h3>
                      <p className="truncate text-xs text-muted-foreground">
                        {client?.company_name ?? "—"} · {campaign?.name ?? "—"}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {labelOf(MATERIAL_TYPES, material.file_type)} ·{" "}
                        {formatBytes(Number(material.file_size))}
                      </p>
                    </div>
                  </div>
                  <StatusBadge
                    value={expired ? "expirado" : material.status}
                    label={expired ? "Expirado" : labelOf(MATERIAL_STATUS, material.status)}
                  />
                </div>

                {material.description && (
                  <p className="text-sm text-muted-foreground">{material.description}</p>
                )}

                <p className="text-xs text-muted-foreground">
                  {material.status === "publicado"
                    ? `Expira em ${formatDateTime(material.expires_at)} · ${formatCountdown(material.expires_at)}`
                    : "Ainda não publicado para o cliente."}
                </p>

                <div className="flex flex-wrap items-center gap-2">
                  <Select
                    value={material.status}
                    onValueChange={(status) =>
                      updateStatus.mutate({
                        id: material.id,
                        status,
                        days: material.duration_days ?? 7,
                      })
                    }
                  >
                    <SelectTrigger className="h-9 w-36 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MATERIAL_STATUS.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      republish.mutate({
                        id: material.id,
                        days: material.duration_days ?? 7,
                        count: material.republished_count ?? 0,
                      })
                    }
                  >
                    <RefreshCw className="mr-2 h-3.5 w-3.5" /> Republicar
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Remover material"
                    onClick={() => {
                      if (confirm(`Remover "${material.name}"?`))
                        removeMaterial.mutate({ id: material.id, file_path: material.file_path });
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
                  </div>
                )}
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={<Package className="h-8 w-8" />}
          title="Nenhum material encontrado"
          description="Envie os arquivos finais para liberar o download no portal do cliente."
        />
      )}

      <section className="surface-panel mt-8 p-6">
        <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold">
          <Download className="h-4 w-4 text-brand-violet" /> Histórico de downloads
        </h2>
        {downloads?.length ? (
          <ol className="space-y-3">
            {downloads.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span>
                  <span className="font-medium">
                    {(item.clients as { company_name: string } | null)?.company_name ?? "Cliente"}
                  </span>{" "}
                  baixou{" "}
                  <span className="text-muted-foreground">
                    {(item.materials as { name: string } | null)?.name ?? item.file_name}
                  </span>
                </span>
                <span className="text-xs text-muted-foreground">
                  {item.status === "expirado" ? "Tentativa após expiração · " : ""}
                  {formatDateTime(item.downloaded_at)}
                </span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Nenhum download registrado ainda.
          </p>
        )}
      </section>

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
            <DialogTitle className="font-display">Adicionar material</DialogTitle>
            <DialogDescription>
              Envie o arquivo final e defina por quantos dias o cliente poderá baixá-lo.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="material-name">Nome do material</Label>
                <Input
                  id="material-name"
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  placeholder="Pacote final — Reels janeiro"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="material-description">Descrição</Label>
                <Textarea
                  id="material-description"
                  rows={3}
                  value={form.description}
                  onChange={(event) => setForm({ ...form, description: event.target.value })}
                  placeholder="Instruções ou observações de uso"
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
                <Label>Tipo</Label>
                <Select value={form.type} onValueChange={(value) => setForm({ ...form, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MATERIAL_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
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
                    {MATERIAL_STATUS.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="material-days">Disponível por (dias)</Label>
                <Input
                  id="material-days"
                  type="number"
                  min={1}
                  value={form.durationDays}
                  onChange={(event) => setForm({ ...form, durationDays: event.target.value })}
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="material-file">Arquivo</Label>
                <Input
                  id="material-file"
                  ref={fileInputRef}
                  type="file"
                  onChange={(event) => {
                    const selected = event.target.files?.[0] ?? null;
                    setFile(selected);
                    if (selected) {
                      setForm((current) => ({
                        ...current,
                        name: current.name || selected.name.replace(/\.[^.]+$/, ""),
                        type: guessMaterialType(selected.name, selected.type),
                      }));
                    }
                  }}
                />
                {file && (
                  <p className="text-xs text-muted-foreground">
                    {file.name} · {formatBytes(file.size)}
                  </p>
                )}
              </div>
            </div>

            {uploading && <Progress value={progress} />}

            <DialogFooter>
              <Button type="button" variant="ghost" disabled={uploading} onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="gradient-brand" disabled={uploading}>
                {uploading ? `Enviando... ${progress}%` : "Salvar material"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
