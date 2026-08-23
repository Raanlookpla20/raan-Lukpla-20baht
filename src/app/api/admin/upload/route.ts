import { NextRequest, NextResponse } from "next/server";
import { getStorageProvider, MAX_IMAGE_SIZE_BYTES, ALLOWED_IMAGE_TYPES } from "@/lib/storage";
import { detectImageFormat } from "@/lib/image-format";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file");
  const folderInput = formData.get("folder");
  const folder = folderInput === "store" ? "store" : "products";

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

  // Don't trust file.type alone: iPhones can hand the browser a photo
  // labelled "image/jpeg" that is actually HEIC/HEIF data, which no
  // mainstream browser can render — check the real magic bytes too.
  const realFormat = detectImageFormat(buffer);
  if (realFormat === "heic") {
    return NextResponse.json(
      {
        error:
          "ไฟล์นี้เป็นรูปแบบ HEIC/HEIF (เช่น รูปจาก iPhone ที่ยังไม่แปลงไฟล์) ซึ่งเบราว์เซอร์ส่วนใหญ่แสดงผลไม่ได้ กรุณาแปลงเป็น JPEG หรือ PNG ก่อนอัปโหลด (บน iPhone: ตั้งค่า > กล้อง > รูปแบบ > ความเข้ากันได้สูงสุด หรือเลือก \"คัดลอกเป็น JPEG\" ตอนแชร์รูป)",
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
    folder,
  });

  return NextResponse.json({ url: result.url });
}
