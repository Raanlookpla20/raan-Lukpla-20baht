import { put } from "@vercel/blob";
import { randomUUID } from "crypto";
import path from "path";
import type { StorageProvider, UploadResult } from "./types";

function safeExtension(filename: string): string {
  const ext = path.extname(filename).toLowerCase().replace(/[^a-z0-9.]/g, "");
  return ext || ".bin";
}

export class VercelBlobProvider implements StorageProvider {
  async upload(params: {
    buffer: Buffer;
    filename: string;
    contentType: string;
    folder: "products" | "slips" | "store";
  }): Promise<UploadResult> {
    const uniqueName = `${params.folder}/${randomUUID()}${safeExtension(params.filename)}`;
    const blob = await put(uniqueName, params.buffer, {
      access: "public",
      contentType: params.contentType,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    return { url: blob.url };
  }
}
