import { z } from "zod";
import { nonEmptyString, slugSchema } from "./common";

export const categoryInputSchema = z.object({
  name: nonEmptyString("ชื่อหมวดหมู่"),
  slug: slugSchema,
  sortOrder: z.coerce.number().int().default(0),
});

export type CategoryInput = z.infer<typeof categoryInputSchema>;
