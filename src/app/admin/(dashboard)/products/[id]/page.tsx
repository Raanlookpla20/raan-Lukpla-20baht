import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProductForm } from "@/components/admin/ProductForm";

export const metadata = { title: "แก้ไขสินค้า" };

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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

  if (!product) notFound();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-bold text-slate-900">แก้ไขสินค้า</h1>
      <ProductForm
        initial={{
          id: product.id,
          name: product.name,
          slug: product.slug,
          description: product.description,
          price: product.price,
          compareAtPrice: product.compareAtPrice,
          stock: product.stock,
          categoryId: product.categoryId,
          isActive: product.isActive,
          sortOrder: product.sortOrder,
          images: product.images.map((img) => ({ url: img.url })),
          optionGroups: product.optionGroups.map((g) => ({
            name: g.name,
            values: g.values.map((v) => ({
              label: v.label,
              priceDelta: v.priceDelta,
              stock: v.stock,
              imageUrl: v.imageUrl,
            })),
          })),
        }}
      />
    </div>
  );
}
