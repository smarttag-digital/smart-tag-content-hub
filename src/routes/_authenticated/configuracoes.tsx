import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/admin/ui-bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações | SMAR TAG Content Hub" },
      { name: "description", content: "Personalize a mensagem e os contatos exibidos no portal do cliente." },
      { property: "og:title", content: "Configurações | SMAR TAG Content Hub" },
      { property: "og:description", content: "Personalize a mensagem e os contatos exibidos no portal do cliente." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    agency_name: "SMAR TAG",
    portal_message: "",
    email: "",
    phone: "",
  });

  const { data } = useQuery({
    queryKey: ["agency-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agency_settings")
        .select("*")
        .eq("id", 1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (data) {
      setForm({
        agency_name: data.agency_name ?? "SMAR TAG",
        portal_message: data.portal_message ?? "",
        email: data.email ?? "",
        phone: data.phone ?? "",
      });
    }
  }, [data]);

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("agency_settings").upsert({
        id: 1,
        agency_name: form.agency_name,
        portal_message: form.portal_message || undefined,
        email: form.email || undefined,
        phone: form.phone || undefined,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Configurações salvas");
      queryClient.invalidateQueries({ queryKey: ["agency-settings"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <>
      <PageHeader
        title="Configurações"
        description="Informações exibidas para os clientes no portal de seleção."
      />
      <form
        className="surface-panel max-w-2xl space-y-4 p-6"
        onSubmit={(event) => {
          event.preventDefault();
          save.mutate();
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="agency">Nome da agência</Label>
          <Input
            id="agency"
            value={form.agency_name}
            onChange={(event) => setForm({ ...form, agency_name: event.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="message">Mensagem do portal</Label>
          <Textarea
            id="message"
            rows={4}
            value={form.portal_message}
            onChange={(event) => setForm({ ...form, portal_message: event.target.value })}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="s-email">E-mail de contato</Label>
            <Input
              id="s-email"
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="s-phone">Telefone / WhatsApp</Label>
            <Input
              id="s-phone"
              value={form.phone}
              onChange={(event) => setForm({ ...form, phone: event.target.value })}
            />
          </div>
        </div>
        <Button type="submit" className="gradient-brand" disabled={save.isPending}>
          Salvar configurações
        </Button>
      </form>
    </>
  );
}
