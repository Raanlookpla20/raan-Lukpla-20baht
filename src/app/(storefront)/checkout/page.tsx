import { getStoreSettings } from "@/lib/store-settings";
import { CheckoutContent } from "@/components/storefront/CheckoutContent";

export const metadata = { title: "ยืนยันคำสั่งซื้อ" };

export default async function CheckoutPage() {
  const settings = await getStoreSettings();
  return <CheckoutContent settings={settings} />;
}
