import convert from "heic-convert";
import sharp from "sharp";

// iPhone photos are typically 3024-4032px wide; downscale HEIC-converted
// uploads to keep Vercel Blob storage and storefront page load reasonable.
// sharp can't decode HEIC itself (its libheif build omits the HEVC codec
// for licensing reasons), so heic-convert does the decode/re-encode to JPEG
// first, then sharp resizes+recompresses that JPEG.
const MAX_WIDTH = 1600;
const JPEG_QUALITY = 90;

export async function convertHeicToJpeg(buffer: Buffer): Promise<Buffer> {
  const rawJpeg = await convert({ buffer, format: "JPEG", quality: 1 });
  return sharp(Buffer.from(rawJpeg))
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .jpeg({ quality: JPEG_QUALITY })
    .toBuffer();
}

export function withJpegExtension(filename: string): string {
  return filename.replace(/\.[^.]+$/, "") + ".jpg";
}
