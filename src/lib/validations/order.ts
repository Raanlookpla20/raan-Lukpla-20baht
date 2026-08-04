import { z } from "zod";
import { nonEmptyString, thaiPhoneSchema } from "./common";

export const cartItemSchema = z.object({
  productId: nonEmptyString("productId"),
  quantity: z.coerce.number().int().positive("จำนวนต้องมากกว่า 0"),
  // one selected value id per option group on the product, if any
  selectedOptionValueIds: z.array(z.string()).default([]),
  note: z.string().max(300).default(""),
});

export type CartItemInput = z.infer<typeof cartItemSchema>;

export const checkoutSchema = z
  .object({
    customerName: nonEmptyString("ชื่อ").max(100),
    phone: thaiPhoneSchema,
    address: nonEmptyString("ที่อยู่จัดส่ง").max(500),
    note: z.string().max(500).default(""),
    lineUserId: z.string().optional().nullable(),
    paymentMethod: z.enum(["PROMPTPAY", "BANK_TRANSFER", "COD"]),
    paymentSlipUrl: z.string().optional().nullable(),
    couponCode: z.string().trim().optional().nullable(),
    items: z.array(cartItemSchema).min(1, "ตะกร้าสินค้าว่างเปล่า"),
  })
  .superRefine((data, ctx) => {
    if (data.paymentMethod === "BANK_TRANSFER" && !data.paymentSlipUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "กรุณาอัปโหลดสลิปการโอนเงิน",
        path: ["paymentSlipUrl"],
      });
    }
  });

export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const orderLookupSchema = z
  .object({
    phone: thaiPhoneSchema.optional(),
    lineUserId: z.string().optional(),
  })
  .refine((data) => data.phone || data.lineUserId, {
    message: "กรุณากรอกเบอร์โทรศัพท์",
  });

export const orderStatusUpdateSchema = z.object({
  status: z.enum(["PENDING_PAYMENT", "PAID", "SHIPPING", "DELIVERED", "CANCELLED"]),
});
