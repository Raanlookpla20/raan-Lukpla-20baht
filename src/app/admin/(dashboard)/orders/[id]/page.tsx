import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { serializeOrder } from "@/lib/serializers/order";
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

  return <OrderDetailManager order={serializeOrder(order)} />;
}
