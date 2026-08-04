import { getStoreSettings } from "@/lib/store-settings";
import { CartContent } from "@/components/storefront/CartContent";

export const metadata = { title: "ตะกร้าสินค้า" };

export default async function CartPage() {
  const settings = await getStoreSettings();

  return (
    <CartContent
      shippingFlatRate={settings.shippingFlatRate}
      freeShippingThreshold={settings.freeShippingThreshold}
    />
  );
}
