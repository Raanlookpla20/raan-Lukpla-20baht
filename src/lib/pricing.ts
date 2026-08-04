export interface PricingResult {
  price: number; // final price the customer pays
  compareAtPrice: number | null; // strike-through "was" price, or null if no discount
}

interface PromotionLike {
  discountType: "PERCENT" | "FIXED";
  value: number;
}

export function isPromotionActive(promo: {
  isActive: boolean;
  expiresAt: Date | null;
}): boolean {
  if (!promo.isActive) return false;
  if (promo.expiresAt && promo.expiresAt.getTime() < Date.now()) return false;
  return true;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Resolve the price a customer actually sees/pays for a product, folding in
 * an active PRODUCT_DISCOUNT promotion if present (takes precedence over a
 * manually-set compareAtPrice, to avoid double-discounting).
 */
export function resolveProductPricing(
  product: { price: number; compareAtPrice: number | null },
  activeProductDiscount?: PromotionLike | null
): PricingResult {
  if (activeProductDiscount) {
    const discountAmount =
      activeProductDiscount.discountType === "PERCENT"
        ? product.price * (activeProductDiscount.value / 100)
        : activeProductDiscount.value;
    const price = Math.max(0, round2(product.price - discountAmount));
    return { price, compareAtPrice: product.price };
  }

  if (product.compareAtPrice && product.compareAtPrice > product.price) {
    return { price: product.price, compareAtPrice: product.compareAtPrice };
  }

  return { price: product.price, compareAtPrice: null };
}

export function computeCouponDiscount(
  subtotal: number,
  coupon: PromotionLike
): number {
  const discount =
    coupon.discountType === "PERCENT" ? subtotal * (coupon.value / 100) : coupon.value;
  return Math.max(0, Math.min(subtotal, round2(discount)));
}
