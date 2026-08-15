import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">{title}</h1>
        {description && <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

const TONES: Record<string, string> = {
  aguardando: "bg-secondary text-muted-foreground border-border",
  selecionado: "bg-brand-royal/15 text-brand-blue border-brand-royal/30",
  preparacao: "bg-brand-violet/15 text-brand-violet border-brand-violet/35",
  enviado: "bg-emerald-500/12 text-emerald-300 border-emerald-500/25",
  enviada: "bg-emerald-500/12 text-emerald-300 border-emerald-500/25",
  confirmada: "bg-brand-blue/15 text-brand-blue border-brand-blue/30",
  rascunho: "bg-secondary text-muted-foreground border-border",
  publicada: "bg-brand-violet/15 text-brand-violet border-brand-violet/35",
  encerrada: "bg-secondary text-muted-foreground border-border",
  ativo: "bg-emerald-500/12 text-emerald-300 border-emerald-500/25",
  inativo: "bg-secondary text-muted-foreground border-border",
  publicado: "bg-emerald-500/12 text-emerald-300 border-emerald-500/25",
  expirado: "bg-destructive/15 text-destructive border-destructive/30",
};

export function StatusBadge({ value, label }: { value: string; label: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        TONES[value] ?? "bg-secondary text-muted-foreground border-border",
      )}
    >
      {label}
    </span>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="surface-panel flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      {icon && <div className="text-muted-foreground">{icon}</div>}
      <p className="font-display text-lg font-semibold">{title}</p>
      {description && <p className="max-w-md text-sm text-muted-foreground">{description}</p>}
      {action}
    </div>
  );
}

export function LoadingGrid({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className="h-20 w-full rounded-xl" />
      ))}
    </div>
  );
}
