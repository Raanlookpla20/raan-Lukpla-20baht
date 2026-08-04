import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { orderStatusUpdateSchema } from "@/lib/validations/order";
import { serializeOrder } from "@/lib/serializers/order";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = orderStatusUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "สถานะไม่ถูกต้อง" }, { status: 400 });
  }
  const newStatus = parsed.data.status;

  try {
    const order = await prisma.$transaction(async (tx) => {
      const existing = await tx.order.findUnique({
        where: { id },
        include: { items: { include: { selectedOptions: true } } },
      });
      if (!existing) throw new Error("NOT_FOUND");

      const wasCancelled = existing.status === "CANCELLED";
      const willBeCancelled = newStatus === "CANCELLED";

      // Restore stock when an order transitions INTO cancelled
      if (!wasCancelled && willBeCancelled) {
        for (const item of existing.items) {
          if (item.selectedOptions.length > 0) {
            for (const opt of item.selectedOptions) {
              if (!opt.optionValueId) continue;
              await tx.productOptionValue.update({
                where: { id: opt.optionValueId },
                data: { stock: { increment: item.quantity } },
              });
            }
          } else if (item.productId) {
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: { increment: item.quantity } },
            });
          }
        }
      }

      // Re-deduct stock if an admin un-cancels an order (rare, but keep inventory correct)
      if (wasCancelled && !willBeCancelled) {
        for (const item of existing.items) {
          if (item.selectedOptions.length > 0) {
            for (const opt of item.selectedOptions) {
              if (!opt.optionValueId) continue;
              await tx.productOptionValue.update({
                where: { id: opt.optionValueId },
                data: { stock: { decrement: item.quantity } },
              });
            }
          } else if (item.productId) {
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: { decrement: item.quantity } },
            });
          }
        }
      }

      const updated = await tx.order.update({
        where: { id },
        data: {
          status: newStatus,
          statusLogs: { create: { fromStatus: existing.status, toStatus: newStatus } },
        },
        include: { items: true },
      });

      return updated;
    });

    return NextResponse.json({ order: serializeOrder(order) });
  } catch (err) {
    if (err instanceof Error && err.message === "NOT_FOUND") {
      return NextResponse.json({ error: "ไม่พบคำสั่งซื้อ" }, { status: 404 });
    }
    console.error("Order status update failed:", err);
    return NextResponse.json({ error: "อัปเดตสถานะไม่สำเร็จ" }, { status: 500 });
  }
}
