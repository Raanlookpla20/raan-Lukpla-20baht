import { z } from "zod";
import { nonEmptyString } from "./common";

export const storeSettingsInputSchema = z.object({
  storeName: nonEmptyString("ชื่อร้าน").max(100),
  logoUrl: z.string().min(1),
  bannerUrls: z.array(z.string().min(1)).default([]),
  promptpayId: nonEmptyString("เลขพร้อมเพย์"),
  bankName: nonEmptyString("ชื่อธนาคาร"),
  bankAccountNumber: nonEmptyString("เลขบัญชี"),
  bankAccountName: nonEmptyString("ชื่อบัญชี"),
  codEnabled: z.boolean(),
  shippingFlatRate: z.coerce.number().min(0),
  freeShippingThreshold: z.coerce.number().min(0).nullable().optional(),
});

export type StoreSettingsInput = z.infer<typeof storeSettingsInputSchema>;

export const loginSchema = z.object({
  username: nonEmptyString("ชื่อผู้ใช้"),
  password: nonEmptyString("รหัสผ่าน"),
});

export type LoginInput = z.infer<typeof loginSchema>;
