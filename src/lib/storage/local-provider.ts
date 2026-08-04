import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import type { StorageProvider, UploadResult } from "./types";

const UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads");

function safeExtension(filename: string): string {
  const ext = path.extname(filename).toLowerCase().replace(/[^a-z0-9.]/g, "");
  return ext || ".bin";
}

export class LocalStorageProvider implements StorageProvider {
  async upload(params: {
    buffer: Buffer;
    filename: string;
    contentType: string;
    folder: "products" | "slips" | "store";
  }): Promise<UploadResult> {
    const dir = path.join(UPLOAD_ROOT, params.folder);
    await mkdir(dir, { recursive: true });

    const uniqueName = `${randomUUID()}${safeExtension(params.filename)}`;
    const filePath = path.join(dir, uniqueName);
    await writeFile(filePath, params.buffer);

    return { url: `/uploads/${params.folder}/${uniqueName}` };
  }
}
