import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toCsv } from "@/lib/csv";
import { ORDER_STATUS_LABELS, PAYMENT_METHOD_LABELS } from "@/lib/order-status";
import { formatDateTime } from "@/lib/format";
import type { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const q = searchParams.get("q")?.trim();
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where: Prisma.OrderWhereInput = {};
  if (status) where.status = status as Prisma.OrderWhereInput["status"];
  if (q) {
    where.OR = [
      { customerName: { contains: q } },
      { phone: { contains: q } },
      { orderNumber: { contains: q } },
    ];
  }
  if (from || to) {
    where.createdAt = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(`${to}T23:59:59.999Z`) } : {}),
    };
  }

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });

  const headers = [
    "เลขที่ออเดอร์",
    "วันที่สั่งซื้อ",
    "ชื่อลูกค้า",
    "เบอร์โทร",
    "ที่อยู่",
    "รายการสินค้า",
    "วิธีชำระเงิน",
    "สถานะ",
    "ยอดรวมสินค้า",
    "ส่วนลด",
    "ค่าจัดส่ง",
    "ยอดรวมทั้งหมด",
  ];

  const rows = orders.map((o) => [
    o.orderNumber,
    formatDateTime(o.createdAt),
    o.customerName,
    o.phone,
    o.address,
    o.items.map((i) => `${i.productName}${i.optionLabel ? ` (${i.optionLabel})` : ""} x${i.quantity}`).join("; "),
    PAYMENT_METHOD_LABELS[o.paymentMethod] ?? o.paymentMethod,
    ORDER_STATUS_LABELS[o.status] ?? o.status,
    o.subtotal,
    o.discount,
    o.shippingFee,
    o.total,
  ]);

  const csv = toCsv(headers, rows);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="orders-${Date.now()}.csv"`,
    },
  });
}
