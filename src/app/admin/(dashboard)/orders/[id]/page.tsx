import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { serializeOrder } from "@/lib/serializers/order";
import { getStoreSettings } from "@/lib/store-settings";
import { haversineDistanceKm } from "@/lib/geo";
import { OrderDetailManager } from "@/components/admin/OrderDetailManager";

export const metadata = { title: "รายละเอียดออเดอร์" };

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { include: { selectedOptions: true } },
      statusLogs: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!order) notFound();

  // Live distance from the store's *current* settings — this is about
  // today's delivery logistics, not a historical snapshot of what the
  // order qualified for when it was placed.
  let distanceFromStoreKm: number | null = null;
  let freeDeliveryRadiusKm: number | null = null;
  if (order.latitude != null && order.longitude != null) {
    const settings = await getStoreSettings();
    distanceFromStoreKm = haversineDistanceKm(
      { lat: settings.storeLatitude, lng: settings.storeLongitude },
      { lat: order.latitude, lng: order.longitude }
    );
    freeDeliveryRadiusKm = settings.freeDeliveryRadiusKm;
  }

  return (
    <OrderDetailManager
      order={serializeOrder(order)}
      distanceFromStoreKm={distanceFromStoreKm}
      freeDeliveryRadiusKm={freeDeliveryRadiusKm}
    />
  );
}
