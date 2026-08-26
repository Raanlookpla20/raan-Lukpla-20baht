"use client";

import Image from "next/image";
import { useState } from "react";
import clsx from "clsx";
import { formatCurrency, formatDateTime } from "@/lib/format";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  ORDER_STATUS_FLOW,
  PAYMENT_METHOD_LABELS,
} from "@/lib/order-status";
import { useToastStore } from "@/store/toast";

interface OrderDetail {
  id: string;
  orderNumber: string;
  status: string;
  customerName: string;
  phone: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  mapAddressDetail: string | null;
  note: string;
  paymentMethod: string;
  paymentSlipUrl: string | null;
  subtotal: number;
  discount: number;
  shippingFee: number;
  total: number;
  createdAt: string;
  items: {
    id: string;
    productName: string;
    optionLabel: string | null;
    note: string;
    unitPrice: number;
    quantity: number;
    subtotal: number;
  }[];
  statusLogs?: { fromStatus: string | null; toStatus: string; createdAt: string }[];
}

export function OrderDetailManager({ order: initial }: { order: OrderDetail }) {
  const [order, setOrder] = useState(initial);
  const [updating, setUpdating] = useState(false);
  const addToast = useToastStore((s) => s.addToast);

  async function changeStatus(newStatus: string) {
    if (newStatus === order.status) return;
    if (newStatus === "CANCELLED" && !confirm("ยกเลิกออเดอร์นี้และคืนสต๊อกสินค้า?")) return;

    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "อัปเดตไม่สำเร็จ");
      setOrder(data.order);
      addToast("อัปเดตสถานะแล้ว");
    } catch (err) {
      addToast(err instanceof Error ? err.message : "อัปเดตไม่สำเร็จ", "error");
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-900">{order.orderNumber}</h1>
          <p className="text-xs text-[var(--color-muted)]">{formatDateTime(order.createdAt)}</p>
        </div>
        <span className={clsx("rounded-full px-3 py-1 text-xs font-medium", ORDER_STATUS_COLORS[order.status])}>
          {ORDER_STATUS_LABELS[order.status]}
        </span>
      </div>

      <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
        <p className="mb-2 text-sm font-semibold text-slate-700">เปลี่ยนสถานะ</p>
        <div className="flex flex-wrap gap-2">
          {ORDER_STATUS_FLOW.map((s) => (
            <button
              key={s}
              disabled={updating}
              onClick={() => changeStatus(s)}
              className={clsx(
                "rounded-full px-3 py-1.5 text-xs font-medium transition disabled:opacity-50",
                order.status === s
                  ? "bg-primary-500 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              {ORDER_STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4 text-sm text-slate-700">
        <p className="mb-1 font-semibold text-slate-800">ข้อมูลลูกค้า</p>
        <p>{order.customerName}</p>
        <p>{order.phone}</p>
        <p>{order.address}</p>
        {order.mapAddressDetail && (
          <p className="text-[var(--color-muted)]">รายละเอียดตำแหน่ง: {order.mapAddressDetail}</p>
        )}
        {order.latitude != null && order.longitude != null && (
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${order.latitude},${order.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:underline"
          >
            📍 เปิดตำแหน่งจัดส่งบนแผนที่
          </a>
        )}
        {order.note && <p className="text-[var(--color-muted)]">หมายเหตุ: {order.note}</p>}
        <p className="mt-2 text-xs text-[var(--color-muted)]">
          ชำระเงิน: {PAYMENT_METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod}
        </p>
        {order.paymentSlipUrl && (
          <div className="relative mt-2 h-48 w-full max-w-xs overflow-hidden rounded-lg border">
            <Image src={order.paymentSlipUrl} alt="สลิปการโอนเงิน" fill className="object-contain" />
          </div>
        )}
      </div>

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
                {item.note && <p className="text-xs text-[var(--color-muted)]">หมายเหตุ: {item.note}</p>}
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
            <span>{formatCurrency(order.shippingFee)}</span>
          </div>
          <div className="mt-1 flex justify-between text-base font-bold text-slate-900">
            <span>ยอดรวมทั้งหมด</span>
            <span className="text-primary-600">{formatCurrency(order.total)}</span>
          </div>
        </div>
      </div>

      {order.statusLogs && order.statusLogs.length > 0 && (
        <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
          <p className="mb-2 text-sm font-semibold text-slate-700">ประวัติการเปลี่ยนสถานะ</p>
          <div className="flex flex-col gap-1.5">
            {order.statusLogs.map((log, i) => (
              <div key={i} className="flex justify-between text-xs text-[var(--color-muted)]">
                <span>
                  {log.fromStatus ? `${ORDER_STATUS_LABELS[log.fromStatus]} → ` : ""}
                  {ORDER_STATUS_LABELS[log.toStatus]}
                </span>
                <span>{formatDateTime(log.createdAt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
