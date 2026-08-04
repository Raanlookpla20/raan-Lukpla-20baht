import { prisma } from "@/lib/prisma";
import { getStoreSettings } from "@/lib/store-settings";
import { HomeContent } from "@/components/storefront/HomeContent";

export default async function HomePage() {
  const [categories, settings] = await Promise.all([
    prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, slug: true },
    }),
    getStoreSettings(),
  ]);

  return <HomeContent categories={categories} banners={settings.bannerUrls} />;
}
