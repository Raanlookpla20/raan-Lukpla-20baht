import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { productInputSchema } from "@/lib/validations/product";

const PAGE_SIZE = 20;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);

  const where = q
    ? { OR: [{ name: { contains: q } }, { description: { contains: q } }] }
    : {};

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        category: { select: { id: true, name: true } },
        images: { orderBy: { sortOrder: "asc" }, take: 1 },
      },
    }),
    prisma.product.count({ where }),
  ]);

  return NextResponse.json({
    products: products.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: p.price,
      stock: p.stock,
      isActive: p.isActive,
      category: p.category,
      image: p.images[0]?.url ?? null,
    })),
    page,
    pageSize: PAGE_SIZE,
    total,
    hasMore: page * PAGE_SIZE < total,
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = productInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }
  const input = parsed.data;

  const existing = await prisma.product.findUnique({ where: { slug: input.slug } });
  if (existing) {
    return NextResponse.json({ error: "slug นี้ถูกใช้แล้ว" }, { status: 409 });
  }

  const product = await prisma.product.create({
    data: {
      name: input.name,
      slug: input.slug,
      description: input.description,
      price: input.price,
      compareAtPrice: input.compareAtPrice ?? null,
      stock: input.stock,
      categoryId: input.categoryId,
      isActive: input.isActive,
      sortOrder: input.sortOrder,
      images: {
        create: input.images.map((img, i) => ({ url: img.url, sortOrder: img.sortOrder ?? i })),
      },
      optionGroups: {
        create: input.optionGroups.map((group, gi) => ({
          name: group.name,
          sortOrder: gi,
          values: {
            create: group.values.map((v, vi) => ({
              label: v.label,
              priceDelta: v.priceDelta,
              stock: v.stock,
              imageUrl: v.imageUrl ?? null,
              sortOrder: vi,
            })),
          },
        })),
      },
    },
  });

  return NextResponse.json({ product }, { status: 201 });
}
