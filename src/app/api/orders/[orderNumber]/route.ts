import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeOrder } from "@/lib/serializers/order";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  const { orderNumber } = await params;
  const { searchParams } = new URL(request.url);
  const phone = searchParams.get("phone")?.replace(/[\s-]/g, "");
  const lineUserId = searchParams.get("lineUserId");

  if (!phone && !lineUserId) {
    return NextResponse.json({ error: "กรุณาระบุเบอร์โทรศัพท์" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: { items: true, statusLogs: { orderBy: { createdAt: "asc" } } },
  });

  if (!order || (order.phone !== phone && order.lineUserId !== lineUserId)) {
    return NextResponse.json({ error: "ไม่พบคำสั่งซื้อ" }, { status: 404 });
  }

  return NextResponse.json({ order: serializeOrder(order) });
}
