import { z } from "zod";

// Thai mobile phone: starts with 0, second digit 6/8/9, 10 digits total.
// Accepts optional dashes/spaces which are stripped before validation.
export const thaiPhoneSchema = z
  .string()
  .transform((val) => val.replace(/[\s-]/g, ""))
  .pipe(
    z
      .string()
      .regex(/^0[689]\d{8}$/, "เบอร์โทรไม่ถูกต้อง (ต้องเป็นเบอร์มือถือไทย 10 หลัก)")
  );

export const nonEmptyString = (label: string) =>
  z.string().trim().min(1, `กรุณากรอก${label}`);

export const slugSchema = z
  .string()
  .trim()
  .min(1, "กรุณากรอก slug")
  .regex(/^[a-z0-9-]+$/, "slug ต้องเป็นตัวอักษรภาษาอังกฤษพิมพ์เล็ก ตัวเลข และ - เท่านั้น");
