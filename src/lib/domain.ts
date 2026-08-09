export const CATEGORIES = [
  { value: "reels", label: "Reels" },
  { value: "stories", label: "Stories" },
  { value: "anuncio", label: "Anúncio" },
  { value: "institucional", label: "Institucional" },
  { value: "outro", label: "Outro" },
] as const;

export const VIDEO_STATUS = [
  { value: "aguardando", label: "Aguardando escolha" },
  { value: "selecionado", label: "Selecionado" },
  { value: "preparacao", label: "Em preparação" },
  { value: "enviado", label: "Enviado" },
] as const;

export const CAMPAIGN_STATUS = [
  { value: "rascunho", label: "Rascunho" },
  { value: "publicada", label: "Publicada" },
  { value: "encerrada", label: "Encerrada" },
] as const;

export const SELECTION_STATUS = [
  { value: "aguardando", label: "Aguardando" },
  { value: "confirmada", label: "Confirmada" },
  { value: "preparacao", label: "Em preparação" },
  { value: "enviada", label: "Enviada" },
] as const;

export const CLIENT_STATUS = [
  { value: "ativo", label: "Ativo" },
  { value: "inativo", label: "Inativo" },
] as const;

export function labelOf(list: readonly { value: string; label: string }[], value: string) {
  return list.find((item) => item.value === value)?.label ?? value;
}

export function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = value.length <= 10 ? new Date(`${value}T12:00:00`) : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("pt-BR");
}

export function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatPeriod(start?: string | null, end?: string | null) {
  if (!start && !end) return "Período não definido";
  return `${formatDate(start)} — ${formatDate(end)}`;
}

export function formatDuration(seconds?: number | null) {
  if (!seconds && seconds !== 0) return "--:--";
  const total = Math.round(seconds);
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

export function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function randomSuffix() {
  return Math.random().toString(36).slice(2, 8);
}
