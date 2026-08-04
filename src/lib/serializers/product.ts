import type { Product, ProductImage, ProductOptionGroup, ProductOptionValue, Category, Promotion } from "@prisma/client";
import { resolveProductPricing } from "@/lib/pricing";

type ProductWithListRelations = Product & {
  category: Pick<Category, "id" | "name" | "slug">;
  images: Pick<ProductImage, "id" | "url" | "sortOrder">[];
  promotions: Pick<Promotion, "discountType" | "value">[];
};

export function serializeProductListItem(product: ProductWithListRelations) {
  const pricing = resolveProductPricing(product, product.promotions[0] ?? null);
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    price: pricing.price,
    compareAtPrice: pricing.compareAtPrice,
    stock: product.stock,
    isActive: product.isActive,
    category: product.category,
    image: product.images[0]?.url ?? null,
  };
}

type ProductWithDetailRelations = Product & {
  category: Pick<Category, "id" | "name" | "slug">;
  images: Pick<ProductImage, "id" | "url" | "sortOrder">[];
  optionGroups: (ProductOptionGroup & { values: ProductOptionValue[] })[];
  promotions: Pick<Promotion, "discountType" | "value">[];
};

export function serializeProductDetail(product: ProductWithDetailRelations) {
  const pricing = resolveProductPricing(product, product.promotions[0] ?? null);
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    price: pricing.price,
    compareAtPrice: pricing.compareAtPrice,
    stock: product.stock,
    isActive: product.isActive,
    category: product.category,
    images: product.images
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((img) => ({ id: img.id, url: img.url })),
    optionGroups: product.optionGroups
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((group) => ({
        id: group.id,
        name: group.name,
        values: group.values
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((v) => ({
            id: v.id,
            label: v.label,
            priceDelta: v.priceDelta,
            stock: v.stock,
          })),
      })),
  };
}
