export const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING_PAYMENT: "รอชำระเงิน",
  PAID: "ชำระแล้ว",
  SHIPPING: "กำลังจัดส่ง",
  DELIVERED: "ส่งแล้ว",
  CANCELLED: "ยกเลิก",
};

export const ORDER_STATUS_COLORS: Record<string, string> = {
  PENDING_PAYMENT: "bg-warning-500/10 text-warning-500",
  PAID: "bg-primary-500/10 text-primary-600",
  SHIPPING: "bg-accent-500/10 text-accent-600",
  DELIVERED: "bg-success-500/10 text-success-500",
  CANCELLED: "bg-danger-500/10 text-danger-600",
};

export const ORDER_STATUS_FLOW = [
  "PENDING_PAYMENT",
  "PAID",
  "SHIPPING",
  "DELIVERED",
  "CANCELLED",
] as const;

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  PROMPTPAY: "พร้อมเพย์",
  BANK_TRANSFER: "โอนเข้าบัญชี",
  COD: "เก็บเงินปลายทาง",
};
