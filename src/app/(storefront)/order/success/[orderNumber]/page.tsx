import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { serializeOrder } from "@/lib/serializers/order";
import { generatePromptPayQrDataUrl } from "@/lib/promptpay";
import { getStoreSettings } from "@/lib/store-settings";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { PAYMENT_METHOD_LABELS } from "@/lib/order-status";
import { Button } from "@/components/ui/Button";

export const metadata = { title: "สั่งซื้อสำเร็จ" };

export default async function OrderSuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderNumber: string }>;
  searchParams: Promise<{ phone?: string }>;
}) {
  const { orderNumber } = await params;
  const { phone } = await searchParams;

  const orderRecord = await prisma.order.findUnique({
    where: { orderNumber },
    include: { items: true },
  });

  if (!orderRecord || !phone || orderRecord.phone !== phone.replace(/[\s-]/g, "")) {
    notFound();
  }

  const order = serializeOrder(orderRecord);

  let promptPayQr: string | null = null;
  if (order.paymentMethod === "PROMPTPAY") {
    const settings = await getStoreSettings();
    promptPayQr = await generatePromptPayQrDataUrl(settings.promptpayId, order.total);
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-4 py-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success-500/10 text-4xl">
          ✅
        </div>
        <h1 className="text-lg font-bold text-slate-900">สั่งซื้อสำเร็จ!</h1>
        <p className="text-sm text-[var(--color-muted)]">
          เลขที่คำสั่งซื้อ <span className="font-semibold text-primary-600">{order.orderNumber}</span>
        </p>
        <p className="text-xs text-[var(--color-muted)]">{formatDateTime(order.createdAt)}</p>
      </div>

      {order.paymentMethod === "PROMPTPAY" && promptPayQr && (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-white p-4">
          <p className="text-sm text-slate-600">สแกน QR เพื่อชำระเงิน {formatCurrency(order.total)}</p>
          <Image src={promptPayQr} alt="PromptPay QR" width={220} height={220} />
        </div>
      )}

      {order.paymentMethod === "BANK_TRANSFER" && (
        <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4 text-sm text-slate-700">
          {order.paymentSlipUrl ? (
            <p className="text-success-500">ได้รับสลิปการโอนเงินแล้ว ทางร้านจะตรวจสอบและยืนยันการชำระเงิน</p>
          ) : (
            <p>กรุณาโอนเงินและติดต่อร้านค้าเพื่อยืนยันการชำระเงิน</p>
          )}
        </div>
      )}

      {order.paymentMethod === "COD" && (
        <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4 text-sm text-slate-700">
          ชำระเงินปลายทางเมื่อได้รับสินค้า
        </div>
      )}

      <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
        <p className="mb-2 text-sm font-semibold text-slate-700">รายการสินค้า</p>
        <div className="flex flex-col gap-2">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm text-slate-600">
              <div>
                <p>
                  {item.productName} × {item.quantity}
                </p>
                {item.optionLabel && (
                  <p className="text-xs text-[var(--color-muted)]">{item.optionLabel}</p>
                )}
              </div>
              <span>{formatCurrency(item.subtotal)}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 border-t border-[var(--color-border)] pt-2 text-sm text-slate-600">
          <div className="flex justify-between">
            <span>ยอดรวมสินค้า</span>
            <span>{formatCurrency(order.subtotal)}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-success-500">
              <span>ส่วนลด</span>
              <span>-{formatCurrency(order.discount)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>ค่าจัดส่ง</span>
            <span>{order.shippingFee === 0 ? "ฟรี" : formatCurrency(order.shippingFee)}</span>
          </div>
          <div className="mt-1 flex justify-between text-base font-bold text-slate-900">
            <span>ยอดรวมทั้งหมด</span>
            <span className="text-primary-600">{formatCurrency(order.total)}</span>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4 text-sm text-slate-700">
        <p className="mb-1 font-semibold text-slate-800">ข้อมูลจัดส่ง</p>
        <p>{order.customerName}</p>
        <p>{order.phone}</p>
        <p>{order.address}</p>
        {order.note && <p className="text-[var(--color-muted)]">หมายเหตุ: {order.note}</p>}
        <p className="mt-2 text-xs text-[var(--color-muted)]">
          วิธีชำระเงิน: {PAYMENT_METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod}
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Link href="/" className="flex-1">
          <Button variant="outline" fullWidth>
            เลือกซื้อสินค้าต่อ
          </Button>
        </Link>
        <Link href="/order/lookup" className="flex-1">
          <Button fullWidth>ติดตามสถานะออเดอร์</Button>
        </Link>
      </div>
    </div>
  );
}
