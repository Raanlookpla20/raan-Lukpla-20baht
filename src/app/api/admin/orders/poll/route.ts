import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const since = searchParams.get("since");

  const serverTime = new Date();
  const sinceDate = since ? new Date(since) : new Date(serverTime.getTime() - 60_000);

  const orders = await prisma.order.findMany({
    where: { createdAt: { gt: sinceDate } },
    orderBy: { createdAt: "asc" },
    select: { id: true, orderNumber: true, customerName: true, total: true, createdAt: true },
  });

  return NextResponse.json({ orders, serverTime: serverTime.toISOString() });
}
