export interface UploadResult {
  url: string;
}

export interface StorageProvider {
  /** Upload a file buffer and return its publicly accessible URL. */
  upload(params: {
    buffer: Buffer;
    filename: string;
    contentType: string;
    folder: "products" | "slips" | "store";
  }): Promise<UploadResult>;
}
