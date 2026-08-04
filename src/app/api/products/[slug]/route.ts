import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeProductDetail } from "@/lib/serializers/product";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const now = new Date();

  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      images: { orderBy: { sortOrder: "asc" } },
      optionGroups: {
        orderBy: { sortOrder: "asc" },
        include: { values: { orderBy: { sortOrder: "asc" } } },
      },
      promotions: {
        where: {
          type: "PRODUCT_DISCOUNT",
          isActive: true,
          OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        },
        select: { discountType: true, value: true },
        take: 1,
      },
    },
  });

  if (!product || !product.isActive) {
    return NextResponse.json({ error: "ไม่พบสินค้า" }, { status: 404 });
  }

  return NextResponse.json({ product: serializeProductDetail(product) });
}
