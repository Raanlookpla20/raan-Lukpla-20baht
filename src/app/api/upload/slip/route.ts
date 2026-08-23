import { NextRequest, NextResponse } from "next/server";
import { getStorageProvider, MAX_IMAGE_SIZE_BYTES, ALLOWED_IMAGE_TYPES } from "@/lib/storage";
import { detectImageFormat } from "@/lib/image-format";
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

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "รองรับเฉพาะไฟล์รูปภาพ (JPEG, PNG, WebP, GIF)" },
      { status: 400 }
    );
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return NextResponse.json({ error: "ไฟล์มีขนาดใหญ่เกิน 5MB" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const realFormat = detectImageFormat(buffer);
  if (realFormat === "heic") {
    return NextResponse.json(
      {
        error:
          "ไฟล์นี้เป็นรูปแบบ HEIC/HEIF (เช่น รูปจาก iPhone ที่ยังไม่แปลงไฟล์) ซึ่งระบบแสดงผลไม่ได้ กรุณาแปลงเป็น JPEG หรือ PNG ก่อนอัปโหลด (บน iPhone: ตั้งค่า > กล้อง > รูปแบบ > ความเข้ากันได้สูงสุด หรือเลือก \"คัดลอกเป็น JPEG\" ตอนแชร์รูป)",
      },
      { status: 400 }
    );
  }
  if (realFormat === "unknown") {
    return NextResponse.json(
      { error: "ไม่สามารถอ่านไฟล์รูปภาพนี้ได้ กรุณาลองไฟล์ JPEG, PNG, WebP หรือ GIF อื่น" },
      { status: 400 }
    );
  }

  const storage = getStorageProvider();
  const result = await storage.upload({
    buffer,
    filename: file.name,
    contentType: file.type,
    folder: "slips",
  });

  return NextResponse.json({ url: result.url });
}
