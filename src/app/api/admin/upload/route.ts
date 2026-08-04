import { NextRequest, NextResponse } from "next/server";
import { getStorageProvider, MAX_IMAGE_SIZE_BYTES, ALLOWED_IMAGE_TYPES } from "@/lib/storage";

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
  const storage = getStorageProvider();
  const result = await storage.upload({
    buffer,
    filename: file.name,
    contentType: file.type,
    folder,
  });

  return NextResponse.json({ url: result.url });
}
