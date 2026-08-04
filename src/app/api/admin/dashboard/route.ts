import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { bangkokDateKey, bangkokDayStart } from "@/lib/timezone";

const LOW_STOCK_THRESHOLD = 5;

export async function GET() {
  const now = new Date();
  const todayStart = bangkokDayStart(now);
  const day30Start = bangkokDayStart(new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000));

  const [
    todayOrders,
    todayOrdersAgg,
    totalCustomersGroups,
    totalProducts,
    lowStockProducts,
    ordersLast30Days,
    bestSellerGroups,
  ] = await Promise.all([
    prisma.order.count({ where: { createdAt: { gte: todayStart }, status: { not: "CANCELLED" } } }),
    prisma.order.aggregate({
      where: { createdAt: { gte: todayStart }, status: { not: "CANCELLED" } },
      _sum: { total: true },
    }),
    prisma.order.groupBy({ by: ["phone"] }),
    prisma.product.count({ where: { isActive: true } }),
    prisma.product.findMany({
      where: { isActive: true, stock: { lte: LOW_STOCK_THRESHOLD } },
      orderBy: { stock: "asc" },
      take: 10,
      select: { id: true, name: true, slug: true, stock: true },
    }),
    prisma.order.findMany({
      where: { createdAt: { gte: day30Start }, status: { not: "CANCELLED" } },
      select: { createdAt: true, total: true },
    }),
    prisma.orderItem.groupBy({
      by: ["productId"],
      where: { productId: { not: null }, order: { status: { not: "CANCELLED" } } },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    }),
  ]);

  // Build a 30-day sales bucket map, then slice the last 7 for the shorter chart
  const bucket = new Map<string, number>();
  for (let i = 0; i < 30; i++) {
    const d = new Date(day30Start.getTime() + i * 24 * 60 * 60 * 1000);
    bucket.set(bangkokDateKey(d), 0);
  }
  for (const order of ordersLast30Days) {
    const key = bangkokDateKey(order.createdAt);
    bucket.set(key, (bucket.get(key) ?? 0) + order.total);
  }
  const salesChart30d = Array.from(bucket.entries()).map(([date, total]) => ({ date, total }));
  const salesChart7d = salesChart30d.slice(-7);

  const bestSellerProductIds = bestSellerGroups
    .map((g) => g.productId)
    .filter((id): id is string => id !== null);
  const bestSellerProducts = await prisma.product.findMany({
    where: { id: { in: bestSellerProductIds } },
    select: { id: true, name: true, slug: true, images: { take: 1, orderBy: { sortOrder: "asc" } } },
  });
  const bestSellers = bestSellerGroups.map((g) => {
    const product = bestSellerProducts.find((p) => p.id === g.productId);
    return {
      productId: g.productId,
      name: product?.name ?? "สินค้าถูกลบแล้ว",
      slug: product?.slug ?? null,
      image: product?.images[0]?.url ?? null,
      totalQuantity: g._sum.quantity ?? 0,
    };
  });

  return NextResponse.json({
    todayOrders,
    todaySales: todayOrdersAgg._sum.total ?? 0,
    totalCustomers: totalCustomersGroups.length,
    totalProducts,
    lowStockProducts,
    salesChart7d,
    salesChart30d,
    bestSellers,
  });
}
