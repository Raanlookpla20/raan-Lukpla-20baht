import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { applyCouponSchema } from "@/lib/validations/promotion";
import { isPromotionActive, computeCouponDiscount } from "@/lib/pricing";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = applyCouponSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { valid: false, message: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" },
      { status: 400 }
    );
  }

  const { code, subtotal } = parsed.data;

  const coupon = await prisma.promotion.findUnique({
    where: { code: code.toUpperCase() },
  });

  if (!coupon || coupon.type !== "COUPON" || !isPromotionActive(coupon)) {
    return NextResponse.json({ valid: false, message: "โค้ดส่วนลดไม่ถูกต้องหรือหมดอายุ" });
  }

  if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses) {
    return NextResponse.json({ valid: false, message: "โค้ดส่วนลดถูกใช้ครบจำนวนแล้ว" });
  }

  if (coupon.minOrderAmount != null && subtotal < coupon.minOrderAmount) {
    return NextResponse.json({
      valid: false,
      message: `ยอดสั่งซื้อขั้นต่ำ ${coupon.minOrderAmount} บาท`,
    });
  }

  const discount = computeCouponDiscount(subtotal, coupon);

  return NextResponse.json({ valid: true, discount, message: `ใช้โค้ดสำเร็จ ลด ${discount} บาท` });
}
