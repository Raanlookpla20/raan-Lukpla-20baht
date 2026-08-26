import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkoutSchema, orderLookupSchema } from "@/lib/validations/order";
import { resolveProductPricing, isPromotionActive, computeCouponDiscount } from "@/lib/pricing";
import { getNextOrderNumber } from "@/lib/order-number";
import { getStoreSettings } from "@/lib/store-settings";
import { serializeOrder } from "@/lib/serializers/order";
import { sendPushToAllSubscribers } from "@/lib/push";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { formatCurrency } from "@/lib/format";
import type { Prisma } from "@prisma/client";

class CheckoutError extends Error {
  constructor(
    message: string,
    public status: number = 400,
    public details?: unknown
  ) {
    super(message);
  }
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const { allowed } = rateLimit(`create-order:${ip}`, { limit: 8, windowMs: 10 * 60 * 1000 });
  if (!allowed) {
    return NextResponse.json(
      { error: "คุณสั่งซื้อบ่อยเกินไป กรุณาลองใหม่ภายหลัง" },
      { status: 429 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง", issues: parsed.error.issues },
      { status: 400 }
    );
  }
  const input = parsed.data;

  const settings = await getStoreSettings();
  if (input.paymentMethod === "COD" && !settings.codEnabled) {
    return NextResponse.json(
      { error: "ขณะนี้ไม่รองรับการเก็บเงินปลายทาง กรุณาเลือกวิธีชำระเงินอื่น" },
      { status: 400 }
    );
  }

  try {
    const order = await prisma.$transaction(async (tx) => {
      const now = new Date();
      let subtotal = 0;

      const itemsToCreate: Prisma.OrderItemCreateWithoutOrderInput[] = [];

      for (const cartItem of input.items) {
        const product = await tx.product.findUnique({
          where: { id: cartItem.productId },
          include: {
            optionGroups: { include: { values: true } },
            promotions: {
              where: {
                type: "PRODUCT_DISCOUNT",
                isActive: true,
                OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
              },
              take: 1,
            },
          },
        });

        if (!product || !product.isActive) {
          throw new CheckoutError(`สินค้าไม่พร้อมจำหน่าย`, 409);
        }

        const selectedOptions: {
          groupId: string;
          groupName: string;
          valueId: string;
          valueLabel: string;
          priceDelta: number;
          stock: number;
        }[] = [];

        for (const group of product.optionGroups) {
          const match = group.values.find((v) =>
            cartItem.selectedOptionValueIds.includes(v.id)
          );
          if (!match) {
            throw new CheckoutError(`กรุณาเลือกตัวเลือก "${group.name}" สำหรับ ${product.name}`, 400);
          }
          selectedOptions.push({
            groupId: group.id,
            groupName: group.name,
            valueId: match.id,
            valueLabel: match.label,
            priceDelta: group.useMainPrice ? 0 : match.priceDelta,
            stock: match.stock,
          });
        }

        const availableStock =
          selectedOptions.length > 0
            ? Math.min(...selectedOptions.map((o) => o.stock))
            : product.stock;

        if (availableStock < cartItem.quantity) {
          throw new CheckoutError(
            `"${product.name}" เหลือไม่พอ (คงเหลือ ${Math.max(0, availableStock)} ชิ้น)`,
            409
          );
        }

        // Decrement stock atomically — the `gte` guard prevents overselling
        // under concurrent checkouts; if it doesn't match, someone else won the race.
        if (selectedOptions.length > 0) {
          for (const opt of selectedOptions) {
            const result = await tx.productOptionValue.updateMany({
              where: { id: opt.valueId, stock: { gte: cartItem.quantity } },
              data: { stock: { decrement: cartItem.quantity } },
            });
            if (result.count === 0) {
              throw new CheckoutError(`"${product.name}" (${opt.valueLabel}) สินค้าไม่พอ กรุณาลองใหม่`, 409);
            }
          }
        } else {
          const result = await tx.product.updateMany({
            where: { id: product.id, stock: { gte: cartItem.quantity } },
            data: { stock: { decrement: cartItem.quantity } },
          });
          if (result.count === 0) {
            throw new CheckoutError(`"${product.name}" สินค้าไม่พอ กรุณาลองใหม่`, 409);
          }
        }

        const pricing = resolveProductPricing(product, product.promotions[0] ?? null);
        const unitPrice =
          pricing.price + selectedOptions.reduce((sum, o) => sum + o.priceDelta, 0);
        const lineSubtotal = unitPrice * cartItem.quantity;
        subtotal += lineSubtotal;

        itemsToCreate.push({
          product: { connect: { id: product.id } },
          productName: product.name,
          optionLabel:
            selectedOptions.length > 0
              ? selectedOptions.map((o) => `${o.groupName}: ${o.valueLabel}`).join(" / ")
              : null,
          note: cartItem.note,
          unitPrice,
          quantity: cartItem.quantity,
          subtotal: lineSubtotal,
          selectedOptions: {
            create: selectedOptions.map((o) => ({
              optionValue: { connect: { id: o.valueId } },
              groupName: o.groupName,
              valueLabel: o.valueLabel,
              priceDelta: o.priceDelta,
            })),
          },
        });
      }

      subtotal = Math.round(subtotal * 100) / 100;

      let discount = 0;
      let promotionId: string | null = null;

      if (input.couponCode) {
        const coupon = await tx.promotion.findUnique({
          where: { code: input.couponCode.trim().toUpperCase() },
        });

        if (!coupon || coupon.type !== "COUPON" || !isPromotionActive(coupon)) {
          throw new CheckoutError("โค้ดส่วนลดไม่ถูกต้องหรือหมดอายุ", 400);
        }
        if (coupon.minOrderAmount != null && subtotal < coupon.minOrderAmount) {
          throw new CheckoutError(`ยอดสั่งซื้อขั้นต่ำ ${coupon.minOrderAmount} บาท สำหรับโค้ดนี้`, 400);
        }

        const claim = await tx.promotion.updateMany({
          where: {
            id: coupon.id,
            OR: [{ maxUses: null }, { usedCount: { lt: coupon.maxUses ?? 0 } }],
          },
          data: { usedCount: { increment: 1 } },
        });
        if (claim.count === 0) {
          throw new CheckoutError("โค้ดส่วนลดถูกใช้ครบจำนวนแล้ว", 409);
        }

        discount = computeCouponDiscount(subtotal, coupon);
        promotionId = coupon.id;
      }

      const shippingFee =
        settings.freeShippingThreshold != null && subtotal >= settings.freeShippingThreshold
          ? 0
          : settings.shippingFlatRate;

      const total = Math.max(0, Math.round((subtotal - discount + shippingFee) * 100) / 100);

      const orderNumber = await getNextOrderNumber(tx);

      const created = await tx.order.create({
        data: {
          orderNumber,
          customerName: input.customerName,
          phone: input.phone,
          address: input.address,
          latitude: input.latitude ?? null,
          longitude: input.longitude ?? null,
          mapAddressDetail: input.mapAddressDetail?.trim() || null,
          note: input.note,
          lineUserId: input.lineUserId || null,
          paymentMethod: input.paymentMethod,
          paymentSlipUrl: input.paymentSlipUrl || null,
          status: "PENDING_PAYMENT",
          subtotal,
          discount,
          shippingFee,
          total,
          promotionId,
          items: { create: itemsToCreate },
          statusLogs: {
            create: { fromStatus: null, toStatus: "PENDING_PAYMENT" },
          },
        },
        include: { items: true },
      });

      return created;
    });

    sendPushToAllSubscribers({
      title: `ออเดอร์ใหม่ ${order.orderNumber}`,
      body: `${order.customerName} · ${formatCurrency(order.total)}`,
      url: `/admin/orders/${order.id}`,
      tag: order.id,
    }).catch((err) => console.error("Push notification failed:", err));

    return NextResponse.json({ order: serializeOrder(order) }, { status: 201 });
  } catch (err) {
    if (err instanceof CheckoutError) {
      return NextResponse.json({ error: err.message, details: err.details }, { status: err.status });
    }
    console.error("Order creation failed:", err);
    return NextResponse.json({ error: "ไม่สามารถสร้างคำสั่งซื้อได้ กรุณาลองใหม่" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const parsed = orderLookupSchema.safeParse({
    phone: searchParams.get("phone") ?? undefined,
    lineUserId: searchParams.get("lineUserId") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" },
      { status: 400 }
    );
  }

  const { phone, lineUserId } = parsed.data;

  const orders = await prisma.order.findMany({
    where: {
      OR: [...(phone ? [{ phone }] : []), ...(lineUserId ? [{ lineUserId }] : [])],
    },
    orderBy: { createdAt: "desc" },
    include: { items: true },
    take: 50,
  });

  return NextResponse.json({ orders: orders.map(serializeOrder) });
}
