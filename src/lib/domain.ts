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

export const MATERIAL_TYPES = [
  { value: "video", label: "Vídeo" },
  { value: "imagem", label: "Imagem" },
  { value: "carrossel", label: "Carrossel" },
  { value: "pdf", label: "PDF" },
  { value: "zip", label: "ZIP" },
] as const;

export const MATERIAL_STATUS = [
  { value: "rascunho", label: "Rascunho" },
  { value: "publicado", label: "Disponível" },
] as const;

export function guessMaterialType(fileName: string, mime?: string | null) {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  if (mime?.startsWith("video/") || ["mp4", "mov", "webm", "avi"].includes(ext)) return "video";
  if (mime?.startsWith("image/") || ["jpg", "jpeg", "png", "webp", "gif"].includes(ext)) return "imagem";
  if (ext === "pdf" || mime === "application/pdf") return "pdf";
  if (["zip", "rar", "7z"].includes(ext)) return "zip";
  return "imagem";
}

export function formatBytes(bytes?: number | null) {
  if (!bytes) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let index = 0;
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }
  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
}

export function isExpired(expiresAt?: string | null) {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() <= Date.now();
}

export function hoursUntil(expiresAt?: string | null) {
  if (!expiresAt) return null;
  return (new Date(expiresAt).getTime() - Date.now()) / 36e5;
}

export function formatCountdown(expiresAt?: string | null) {
  const hours = hoursUntil(expiresAt);
  if (hours === null) return "Sem prazo";
  if (hours <= 0) return "Expirado";
  const days = Math.floor(hours / 24);
  const rest = Math.floor(hours % 24);
  if (days > 0) return `${days}d ${rest}h restantes`;
  const minutes = Math.floor((hours % 1) * 60);
  return `${rest}h ${minutes}min restantes`;
}
