import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { storeSettingsInputSchema } from "@/lib/validations/settings";
import { getStoreSettings } from "@/lib/store-settings";

export async function GET() {
  const settings = await getStoreSettings();
  return NextResponse.json({ settings });
}

export async function PUT(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = storeSettingsInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }
  const input = parsed.data;

  const updated = await prisma.storeSettings.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      storeName: input.storeName,
      logoUrl: input.logoUrl,
      bannerUrls: JSON.stringify(input.bannerUrls),
      promptpayId: input.promptpayId,
      bankName: input.bankName,
      bankAccountNumber: input.bankAccountNumber,
      bankAccountName: input.bankAccountName,
      codEnabled: input.codEnabled,
      shippingFlatRate: input.shippingFlatRate,
      freeShippingThreshold: input.freeShippingThreshold ?? null,
    },
    update: {
      storeName: input.storeName,
      logoUrl: input.logoUrl,
      bannerUrls: JSON.stringify(input.bannerUrls),
      promptpayId: input.promptpayId,
      bankName: input.bankName,
      bankAccountNumber: input.bankAccountNumber,
      bankAccountName: input.bankAccountName,
      codEnabled: input.codEnabled,
      shippingFlatRate: input.shippingFlatRate,
      freeShippingThreshold: input.freeShippingThreshold ?? null,
    },
  });

  return NextResponse.json({ settings: updated });
}
