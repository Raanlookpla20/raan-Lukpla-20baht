import type { Order, OrderItem, OrderStatusLog } from "@prisma/client";

type OrderWithRelations = Order & {
  items: OrderItem[];
  statusLogs?: OrderStatusLog[];
};

export function serializeOrder(order: OrderWithRelations) {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    customerName: order.customerName,
    phone: order.phone,
    address: order.address,
    latitude: order.latitude,
    longitude: order.longitude,
    mapAddressDetail: order.mapAddressDetail,
    note: order.note,
    paymentMethod: order.paymentMethod,
    paymentSlipUrl: order.paymentSlipUrl,
    subtotal: order.subtotal,
    discount: order.discount,
    shippingFee: order.shippingFee,
    total: order.total,
    createdAt: order.createdAt.toISOString(),
    items: order.items.map((item) => ({
      id: item.id,
      productName: item.productName,
      optionLabel: item.optionLabel,
      note: item.note,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      subtotal: item.subtotal,
    })),
    statusLogs: order.statusLogs?.map((log) => ({
      fromStatus: log.fromStatus,
      toStatus: log.toStatus,
      createdAt: log.createdAt.toISOString(),
    })),
  };
}
