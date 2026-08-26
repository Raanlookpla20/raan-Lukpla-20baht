import { z } from "zod";
import { nonEmptyString, slugSchema } from "./common";

export const productOptionValueSchema = z.object({
  id: z.string().optional(), // present when editing an existing value
  label: nonEmptyString("ชื่อตัวเลือก"),
  priceDelta: z.coerce.number().finite().default(0),
  stock: z.coerce.number().int().min(0, "สต๊อกต้องไม่ติดลบ").default(0),
  imageUrl: z.string().nullable().optional(),
});

export const productOptionGroupSchema = z.object({
  id: z.string().optional(),
  name: nonEmptyString("ชื่อกลุ่มตัวเลือก"),
  useMainPrice: z.boolean().default(true),
  values: z.array(productOptionValueSchema).min(1, "ต้องมีอย่างน้อย 1 ตัวเลือก"),
});

export const productImageSchema = z.object({
  id: z.string().optional(),
  url: z.string().min(1),
  sortOrder: z.coerce.number().int().default(0),
});

export const productInputSchema = z.object({
  name: nonEmptyString("ชื่อสินค้า"),
  slug: slugSchema,
  description: z.string().default(""),
  price: z.coerce.number().positive("ราคาต้องมากกว่า 0"),
  compareAtPrice: z.coerce.number().positive().nullable().optional(),
  stock: z.coerce.number().int().min(0, "สต๊อกต้องไม่ติดลบ"),
  categoryId: nonEmptyString("หมวดหมู่"),
  isActive: z.boolean().default(true),
  sortOrder: z.coerce.number().int().default(0),
  images: z.array(productImageSchema).default([]),
  optionGroups: z.array(productOptionGroupSchema).default([]),
});

export type ProductInput = z.infer<typeof productInputSchema>;

export const bulkCategoryUpdateSchema = z.object({
  productIds: z.array(nonEmptyString("รหัสสินค้า")).min(1, "กรุณาเลือกสินค้าอย่างน้อย 1 รายการ"),
  categoryId: nonEmptyString("หมวดหมู่"),
});

export type BulkCategoryUpdateInput = z.infer<typeof bulkCategoryUpdateSchema>;
