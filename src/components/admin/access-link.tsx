import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Copy, ExternalLink, RefreshCw, Ban, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { portalUrl } from "@/lib/domain";

function newToken() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function AccessLinkActions({
  campaign,
  invalidateKeys = [["campaigns"]],
}: {
  campaign: { id: string; name: string; access_token: string; access_revoked: boolean };
  invalidateKeys?: unknown[][];
}) {
  const queryClient = useQueryClient();
  const url = portalUrl(campaign.access_token);

  const refresh = () =>
    invalidateKeys.forEach((key) => queryClient.invalidateQueries({ queryKey: key }));

  const update = useMutation({
    mutationFn: async (values: { access_token?: string; access_revoked?: boolean }) => {
      const { error } = await supabase.from("campaigns").update(values).eq("id", campaign.id);
      if (error) throw error;
    },
    onSuccess: refresh,
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <>
      <Button
        size="sm"
        variant="secondary"
        disabled={campaign.access_revoked}
        onClick={() => {
          navigator.clipboard.writeText(url);
          toast.success("Link privado copiado!");
        }}
      >
        <Copy className="mr-2 h-3.5 w-3.5" /> Copiar link
      </Button>
      {!campaign.access_revoked && (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ExternalLink className="mr-2 h-3.5 w-3.5" /> Abrir portal
        </a>
      )}
      <Button
        size="sm"
        variant="ghost"
        disabled={update.isPending}
        onClick={() => {
          if (!confirm("Regerar o link invalida o endereço atual enviado ao cliente. Continuar?")) return;
          update.mutate(
            { access_token: newToken(), access_revoked: false },
            { onSuccess: () => toast.success("Novo link gerado") },
          );
        }}
      >
        <RefreshCw className="mr-2 h-3.5 w-3.5" /> Regerar
      </Button>
      {campaign.access_revoked ? (
        <Button
          size="sm"
          variant="ghost"
          disabled={update.isPending}
          onClick={() =>
            update.mutate(
              { access_revoked: false },
              { onSuccess: () => toast.success("Acesso reativado") },
            )
          }
        >
          <ShieldCheck className="mr-2 h-3.5 w-3.5" /> Reativar
        </Button>
      ) : (
        <Button
          size="sm"
          variant="ghost"
          className="text-destructive hover:text-destructive"
          disabled={update.isPending}
          onClick={() => {
            if (!confirm(`Revogar o acesso do cliente à campanha "${campaign.name}"?`)) return;
            update.mutate(
              { access_revoked: true },
              { onSuccess: () => toast.success("Acesso revogado") },
            );
          }}
        >
          <Ban className="mr-2 h-3.5 w-3.5" /> Revogar
        </Button>
      )}
    </>
  );
}
