import type { Metadata } from "next";
import { Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";
import { getStoreSettings } from "@/lib/store-settings";

// Storefront pages read live inventory/pricing/store settings on every
// request — never statically cache them (stock and prices would go stale
// between deploys, and prices are a security-relevant field the server must
// always compute fresh, never bake into a build-time snapshot).
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getStoreSettings();
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const description =
    "ของใช้ในบ้าน เครื่องครัว เครื่องเขียน เครื่องมือช่าง และของเบ็ดเตล็ด ราคาคุ้มค่า สั่งซื้อออนไลน์ง่ายๆ ผ่าน LINE";

  return {
    title: { default: settings.storeName, template: `%s | ${settings.storeName}` },
    description,
    openGraph: {
      title: settings.storeName,
      description,
      url: baseUrl,
      siteName: settings.storeName,
      images: [{ url: `${baseUrl}${settings.logoUrl}` }],
      locale: "th_TH",
      type: "website",
    },
  };
}

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-1 flex-col bg-[var(--background)]">
      <Header />
      <main className="flex flex-1 flex-col">{children}</main>
      <Footer />
    </div>
  );
}
