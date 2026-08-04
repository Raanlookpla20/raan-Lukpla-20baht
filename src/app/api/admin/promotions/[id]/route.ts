import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { promotionInputSchema } from "@/lib/validations/promotion";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = promotionInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }
  const input = parsed.data;

  if (input.type === "COUPON" && input.code) {
    const conflict = await prisma.promotion.findFirst({
      where: { code: input.code, NOT: { id } },
    });
    if (conflict) {
      return NextResponse.json({ error: "โค้ดนี้ถูกใช้แล้ว" }, { status: 409 });
    }
  }

  try {
    const promotion = await prisma.promotion.update({
      where: { id },
      data: {
        type: input.type,
        code: input.type === "COUPON" ? input.code ?? null : null,
        discountType: input.discountType,
        value: input.value,
        minOrderAmount: input.minOrderAmount ?? null,
        maxUses: input.maxUses ?? null,
        expiresAt: input.expiresAt ?? null,
        isActive: input.isActive,
        productId: input.type === "PRODUCT_DISCOUNT" ? input.productId ?? null : null,
      },
    });
    return NextResponse.json({ promotion });
  } catch {
    return NextResponse.json({ error: "บันทึกไม่สำเร็จ" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await prisma.promotion.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "ลบไม่สำเร็จ" }, { status: 500 });
  }
}
