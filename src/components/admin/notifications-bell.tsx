import { useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { formatDateTime } from "@/lib/domain";
import { cn } from "@/lib/utils";

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string;
  link_to: string | null;
  read_at: string | null;
  created_at: string;
};

/** Generates expiring/expired material notifications from real material data (idempotent). */
async function syncMaterialNotifications() {
  const { data: materials } = await supabase
    .from("materials")
    .select("id, name, client_id, campaign_id, expires_at, republished_count")
    .eq("status", "publicado")
    .not("expires_at", "is", null);

  const now = Date.now();
  const rows = (materials ?? [])
    .map((material) => {
      const expires = new Date(material.expires_at as string).getTime();
      const hours = (expires - now) / 36e5;
      const expired = hours <= 0;
      if (!expired && hours > 24) return null;
      return {
        type: expired ? "material_expirado" : "material_expirando",
        title: expired ? "Material expirado" : "Material expirando em menos de 24h",
        body: `${material.name} ${expired ? "expirou" : "expira"} em ${formatDateTime(material.expires_at)}`,
        link_to: "/materiais",
        client_id: material.client_id,
        campaign_id: material.campaign_id,
        material_id: material.id,
        dedupe_key: `${expired ? "expirado" : "expirando"}:${material.id}:${material.republished_count}`,
      };
    })
    .filter(Boolean) as Record<string, unknown>[];

  if (!rows.length) return;
  await supabase
    .from("notifications")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .upsert(rows as any, { onConflict: "dedupe_key", ignoreDuplicates: true });
}

export function NotificationsBell() {
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications"],
    refetchInterval: 60_000,
    queryFn: async () => {
      const { data } = await supabase
        .from("notifications")
        .select("id, type, title, body, link_to, read_at, created_at")
        .order("created_at", { ascending: false })
        .limit(30);
      return (data ?? []) as Notification[];
    },
  });

  useEffect(() => {
    syncMaterialNotifications()
      .then(() => queryClient.invalidateQueries({ queryKey: ["notifications"] }))
      .catch(() => undefined);
  }, [queryClient]);

  const markRead = useMutation({
    mutationFn: async (ids: string[]) => {
      if (!ids.length) return;
      await supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .in("id", ids);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const unread = notifications.filter((item) => !item.read_at);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="relative flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface-2/60 text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Notificações"
        >
          <Bell className="h-4 w-4" />
          {!!unread.length && (
            <span className="gradient-brand absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-primary-foreground">
              {unread.length > 9 ? "9+" : unread.length}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(22rem,90vw)] p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="font-display text-sm font-semibold">Notificações</p>
          {!!unread.length && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 text-xs"
              onClick={() => markRead.mutate(unread.map((item) => item.id))}
            >
              <CheckCheck className="h-3.5 w-3.5" /> Marcar lidas
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-80">
          {notifications.length ? (
            <ul className="divide-y divide-border">
              {notifications.map((item) => {
                const content = (
                  <div className="flex gap-3 px-4 py-3">
                    <span
                      className={cn(
                        "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                        item.read_at ? "bg-border" : "gradient-brand",
                      )}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium leading-snug">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.body}</p>
                      <p className="mt-1 text-[11px] text-muted-foreground/70">
                        {formatDateTime(item.created_at)}
                      </p>
                    </div>
                  </div>
                );
                return (
                  <li key={item.id} className="transition-colors hover:bg-secondary/60">
                    {item.link_to ? (
                      <Link to={item.link_to} onClick={() => markRead.mutate([item.id])}>
                        {content}
                      </Link>
                    ) : (
                      content
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">
              Nenhuma notificação por aqui.
            </p>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
