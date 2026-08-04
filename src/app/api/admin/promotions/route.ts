import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { promotionInputSchema } from "@/lib/validations/promotion";

export async function GET() {
  const promotions = await prisma.promotion.findMany({
    orderBy: { createdAt: "desc" },
    include: { product: { select: { id: true, name: true } } },
  });
  return NextResponse.json({ promotions });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = promotionInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }
  const input = parsed.data;

  if (input.type === "COUPON" && input.code) {
    const existing = await prisma.promotion.findUnique({ where: { code: input.code } });
    if (existing) {
      return NextResponse.json({ error: "โค้ดนี้ถูกใช้แล้ว" }, { status: 409 });
    }
  }

  const promotion = await prisma.promotion.create({
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

  return NextResponse.json({ promotion }, { status: 201 });
}
