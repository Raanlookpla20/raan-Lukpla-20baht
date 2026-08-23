import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { serializeProductDetail } from "@/lib/serializers/product";
import { ProductDetailClient } from "@/components/storefront/ProductDetailClient";

async function getProduct(slug: string) {
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

  if (!product || !product.isActive) return null;
  return serializeProductDetail(product);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: "ไม่พบสินค้า" };

  return {
    title: product.name,
    description: product.description || product.name,
    openGraph: {
      title: product.name,
      description: product.description || product.name,
      images: product.images[0] ? [{ url: product.images[0].url }] : undefined,
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) notFound();

  return (
    <ProductDetailClient
      product={{
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        price: product.price,
        compareAtPrice: product.compareAtPrice,
        stock: product.stock,
        images: product.images,
        optionGroups: product.optionGroups,
      }}
    />
  );
}
