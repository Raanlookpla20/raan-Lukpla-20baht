import { NextRequest, NextResponse } from "next/server";
import { getStorageProvider, MAX_IMAGE_SIZE_BYTES, isRejectedByDeclaredMimeType } from "@/lib/storage";
import { detectImageFormat } from "@/lib/image-format";
import { convertHeicToJpeg, withJpegExtension } from "@/lib/heic-convert";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const { allowed } = rateLimit(`upload-slip:${ip}`, { limit: 15, windowMs: 10 * 60 * 1000 });
  if (!allowed) {
    return NextResponse.json(
      { error: "อัปโหลดบ่อยเกินไป กรุณาลองใหม่ภายหลัง" },
      { status: 429 }
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "ไม่พบไฟล์ที่อัปโหลด" }, { status: 400 });
  }

  if (isRejectedByDeclaredMimeType(file.type)) {
    return NextResponse.json(
      { error: "รองรับเฉพาะไฟล์รูปภาพ (JPEG, PNG, WebP, GIF, HEIC/HEIF)" },
      { status: 400 }
    );
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return NextResponse.json({ error: "ไฟล์มีขนาดใหญ่เกิน 5MB" }, { status: 400 });
  }

  let buffer: Buffer = Buffer.from(await file.arrayBuffer());
  let filename = file.name;
  let contentType = file.type;

  const realFormat = detectImageFormat(buffer);
  if (realFormat === "heic") {
    try {
      buffer = await convertHeicToJpeg(buffer);
    } catch (err) {
      console.error("HEIC to JPEG conversion failed:", err);
      return NextResponse.json(
        {
          error:
            "ไม่สามารถแปลงไฟล์ HEIC/HEIF นี้เป็น JPEG ได้ กรุณาลองแปลงเป็น JPEG ก่อนอัปโหลด (บน iPhone: ตั้งค่า > กล้อง > รูปแบบ > ความเข้ากันได้สูงสุด หรือเลือก \"คัดลอกเป็น JPEG\" ตอนแชร์รูป)",
        },
        { status: 400 }
      );
    }
    filename = withJpegExtension(filename);
    contentType = "image/jpeg";
  } else if (realFormat === "unknown") {
    return NextResponse.json(
      { error: "ไม่สามารถอ่านไฟล์รูปภาพนี้ได้ กรุณาลองไฟล์ JPEG, PNG, WebP หรือ GIF อื่น" },
      { status: 400 }
    );
  }

  const storage = getStorageProvider();
  const result = await storage.upload({
    buffer,
    filename,
    contentType,
    folder: "slips",
  });

  return NextResponse.json({ url: result.url });
}
