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
// HEIC/HEIF are accepted here too — the upload routes transcode them to
// JPEG (see convertHeicToJpeg) before anything is stored or served, since
// no mainstream browser can render HEIC in an <img>/next/image tag.
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
];

// Browsers report these when they have no real signal for a file's type —
// an empty string, or the generic fallback "application/octet-stream" that
// Chrome on Windows in particular hands back for HEIC/HEIF, since Windows
// has no built-in MIME association for that extension. Neither is evidence
// the file isn't an image, so callers should let it through to the magic-byte
// sniff (detectImageFormat) instead of hard-rejecting on file.type alone.
const NO_SIGNAL_MIME_TYPES = new Set(["", "application/octet-stream"]);

/** True only when the browser reported a specific type and it's not one we accept. */
export function isRejectedByDeclaredMimeType(mimeType: string): boolean {
  return !NO_SIGNAL_MIME_TYPES.has(mimeType) && !ALLOWED_IMAGE_TYPES.includes(mimeType);
}
