// Sniffs the real file format from magic bytes instead of trusting the
// browser-supplied `file.type`, which iOS in particular can report as
// "image/jpeg" for a photo that is actually HEIC/HEIF — a format no
// mainstream browser can decode in an <img>/next/image tag.
export type DetectedImageFormat = "jpeg" | "png" | "gif" | "webp" | "heic" | "unknown";

const HEIC_BRANDS = ["heic", "heix", "hevc", "hevx", "mif1", "msf1", "heim", "heis"];

export function detectImageFormat(bytes: Uint8Array): DetectedImageFormat {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "jpeg";
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return "png";
  }
  if (bytes.length >= 3 && bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
    return "gif";
  }
  if (
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  ) {
    return "webp";
  }
  if (bytes.length >= 12 && String.fromCharCode(...bytes.slice(4, 8)) === "ftyp") {
    const brand = String.fromCharCode(...bytes.slice(8, 12));
    if (HEIC_BRANDS.includes(brand)) return "heic";
  }
  return "unknown";
}
