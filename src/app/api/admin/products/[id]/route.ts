import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { productInputSchema } from "@/lib/validations/product";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      optionGroups: {
        orderBy: { sortOrder: "asc" },
        include: { values: { orderBy: { sortOrder: "asc" } } },
      },
    },
  });
  if (!product) {
    return NextResponse.json({ error: "ไม่พบสินค้า" }, { status: 404 });
  }
  return NextResponse.json({ product });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = productInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }
  const input = parsed.data;

  const conflict = await prisma.product.findFirst({
    where: { slug: input.slug, NOT: { id } },
  });
  if (conflict) {
    return NextResponse.json({ error: "slug นี้ถูกใช้แล้ว" }, { status: 409 });
  }

  try {
    const product = await prisma.$transaction(async (tx) => {
      await tx.productImage.deleteMany({ where: { productId: id } });
      await tx.productOptionGroup.deleteMany({ where: { productId: id } });

      return tx.product.update({
        where: { id },
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
                  sortOrder: vi,
                })),
              },
            })),
          },
        },
      });
    });

    return NextResponse.json({ product });
  } catch {
    return NextResponse.json({ error: "บันทึกไม่สำเร็จ" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "ลบไม่สำเร็จ" }, { status: 500 });
  }
}
