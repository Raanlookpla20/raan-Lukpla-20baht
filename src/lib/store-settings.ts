import { prisma } from "@/lib/prisma";

export interface StoreSettingsData {
  storeName: string;
  logoUrl: string;
  bannerUrls: string[];
  promptpayId: string;
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
  codEnabled: boolean;
  shippingFlatRate: number;
  freeShippingThreshold: number | null;
  storeLatitude: number;
  storeLongitude: number;
  freeDeliveryRadiusKm: number;
}

const DEFAULTS: StoreSettingsData = {
  storeName: "ร้านลูกปลา 20 บาท",
  logoUrl: "/images/logo-placeholder.svg",
  bannerUrls: ["/images/banner-placeholder-1.svg", "/images/banner-placeholder-2.svg"],
  promptpayId: "0812345678",
  bankName: "ธนาคารกสิกรไทย",
  bankAccountNumber: "123-4-56789-0",
  bankAccountName: "ร้านลูกปลา 20 บาท",
  codEnabled: true,
  shippingFlatRate: 40,
  freeShippingThreshold: 500,
  storeLatitude: 16.0334794,
  storeLongitude: 100.3798431,
  freeDeliveryRadiusKm: 3,
};

/** Reads the singleton store settings row, creating it with defaults if missing. */
export async function getStoreSettings(): Promise<StoreSettingsData> {
  const row =
    (await prisma.storeSettings.findUnique({ where: { id: 1 } })) ??
    (await prisma.storeSettings.create({
      data: { id: 1, bannerUrls: JSON.stringify(DEFAULTS.bannerUrls) },
    }));

  let bannerUrls: string[] = [];
  try {
    bannerUrls = JSON.parse(row.bannerUrls);
  } catch {
    bannerUrls = [];
  }

  return {
    storeName: row.storeName,
    logoUrl: row.logoUrl,
    bannerUrls,
    promptpayId: row.promptpayId,
    bankName: row.bankName,
    bankAccountNumber: row.bankAccountNumber,
    bankAccountName: row.bankAccountName,
    codEnabled: row.codEnabled,
    shippingFlatRate: row.shippingFlatRate,
    freeShippingThreshold: row.freeShippingThreshold,
    storeLatitude: row.storeLatitude,
    storeLongitude: row.storeLongitude,
    freeDeliveryRadiusKm: row.freeDeliveryRadiusKm,
  };
}
