import { supabase } from "@/integrations/supabase/client";

const cache = new Map<string, { url: string; expires: number }>();

export async function signedUrl(bucket: string, path?: string | null) {
  if (!path) return null;
  const key = `${bucket}/${path}`;
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return hit.url;
  const { data } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60 * 4);
  if (!data?.signedUrl) return null;
  cache.set(key, { url: data.signedUrl, expires: Date.now() + 1000 * 60 * 60 * 3 });
  return data.signedUrl;
}

export async function signedUrls(bucket: string, paths: (string | null | undefined)[]) {
  const result: Record<string, string> = {};
  await Promise.all(
    paths.map(async (path) => {
      if (!path) return;
      const url = await signedUrl(bucket, path);
      if (url) result[path] = url;
    }),
  );
  return result;
}

export function readVideoMetadata(file: File): Promise<{ duration: number; thumbnail: Blob | null }> {
  return new Promise((resolve) => {
    try {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.muted = true;
      video.playsInline = true;
      const url = URL.createObjectURL(file);
      let settled = false;

      const finish = (duration: number, thumbnail: Blob | null) => {
        if (settled) return;
        settled = true;
        URL.revokeObjectURL(url);
        resolve({ duration, thumbnail });
      };

      video.onloadeddata = () => {
        const duration = Number.isFinite(video.duration) ? video.duration : 0;
        try {
          video.currentTime = Math.min(1, Math.max(0, duration / 3));
        } catch {
          finish(duration, null);
        }
        video.onseeked = () => {
          const canvas = document.createElement("canvas");
          canvas.width = video.videoWidth || 640;
          canvas.height = video.videoHeight || 360;
          const ctx = canvas.getContext("2d");
          if (!ctx) return finish(duration, null);
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((blob) => finish(duration, blob), "image/jpeg", 0.82);
        };
      };
      video.onerror = () => finish(0, null);
      setTimeout(() => finish(Number.isFinite(video.duration) ? video.duration : 0, null), 12000);
      video.src = url;
    } catch {
      resolve({ duration: 0, thumbnail: null });
    }
  });
}
