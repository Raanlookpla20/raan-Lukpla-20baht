import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { bulkCategoryUpdateSchema } from "@/lib/validations/product";

export async function PATCH(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = bulkCategoryUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }
  const { productIds, categoryId } = parsed.data;

  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!category) {
    return NextResponse.json({ error: "ไม่พบหมวดหมู่ที่เลือก" }, { status: 404 });
  }

  try {
    const result = await prisma.product.updateMany({
      where: { id: { in: productIds } },
      data: { categoryId },
    });
    return NextResponse.json({ count: result.count });
  } catch {
    return NextResponse.json({ error: "ย้ายหมวดหมู่ไม่สำเร็จ" }, { status: 500 });
  }
}
