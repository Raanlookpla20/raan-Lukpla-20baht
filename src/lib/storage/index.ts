import type { StorageProvider } from "./types";
import { LocalStorageProvider } from "./local-provider";
import { VercelBlobProvider } from "./vercel-blob-provider";

export type { StorageProvider, UploadResult } from "./types";

let cachedProvider: StorageProvider | null = null;

export function getStorageProvider(): StorageProvider {
  if (cachedProvider) return cachedProvider;

  // Explicit STORAGE_PROVIDER wins; otherwise default to Vercel Blob whenever
  // running on Vercel (its filesystem is read-only outside /tmp, so local
  // storage would silently fail there) and to local storage everywhere else.
  const useVercelBlob =
    process.env.STORAGE_PROVIDER === "vercel-blob" ||
    (process.env.STORAGE_PROVIDER !== "local" && Boolean(process.env.VERCEL));

  cachedProvider = useVercelBlob ? new VercelBlobProvider() : new LocalStorageProvider();

  return cachedProvider;
}

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
