import { z } from "zod";
import { nonEmptyString } from "./common";

export const promotionInputSchema = z
  .object({
    type: z.enum(["PRODUCT_DISCOUNT", "COUPON"]),
    code: z.string().trim().toUpperCase().optional().nullable(),
    discountType: z.enum(["PERCENT", "FIXED"]),
    value: z.coerce.number().positive("มูลค่าส่วนลดต้องมากกว่า 0"),
    minOrderAmount: z.coerce.number().min(0).nullable().optional(),
    maxUses: z.coerce.number().int().positive().nullable().optional(),
    expiresAt: z.coerce.date().nullable().optional(),
    isActive: z.boolean().default(true),
    productId: z.string().nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === "COUPON" && !data.code) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "กรุณากรอกโค้ดส่วนลด",
        path: ["code"],
      });
    }
    if (data.type === "PRODUCT_DISCOUNT" && !data.productId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "กรุณาเลือกสินค้า",
        path: ["productId"],
      });
    }
    if (data.discountType === "PERCENT" && data.value > 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "ส่วนลดแบบเปอร์เซ็นต์ต้องไม่เกิน 100",
        path: ["value"],
      });
    }
  });

export type PromotionInput = z.infer<typeof promotionInputSchema>;

export const applyCouponSchema = z.object({
  code: nonEmptyString("โค้ดส่วนลด"),
  subtotal: z.coerce.number().nonnegative(),
});
