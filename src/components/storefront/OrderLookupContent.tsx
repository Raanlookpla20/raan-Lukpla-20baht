"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLiff } from "@/hooks/useLiff";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/lib/order-status";
import { Button } from "@/components/ui/Button";
import clsx from "clsx";

interface OrderSummary {
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
  phone: string;
  items: { productName: string; quantity: number }[];
}

export function OrderLookupContent() {
  const liff = useLiff();
  const [phone, setPhone] = useState("");
  const [orders, setOrders] = useState<OrderSummary[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  async function search(params: { phone?: string; lineUserId?: string }) {
    setLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams();
      if (params.phone) query.set("phone", params.phone);
      if (params.lineUserId) query.set("lineUserId", params.lineUserId);
      const res = await fetch(`/api/orders?${query.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "ค้นหาไม่สำเร็จ");
      setOrders(data.orders);
    } catch (err) {
      setError(err instanceof Error ? err.message : "ค้นหาไม่สำเร็จ");
      setOrders(null);
    } finally {
      setLoading(false);
      setSearched(true);
    }
  }

  // Auto-search by LINE profile if opened inside LINE and logged in
  useEffect(() => {
    if (liff.profile?.userId) {
      search({ lineUserId: liff.profile.userId });
    }
  }, [liff.profile]);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5 px-4 py-6">
      <h1 className="text-lg font-bold text-slate-900">ติดตามสถานะออเดอร์</h1>

      <div className="flex gap-2">
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="กรอกเบอร์โทรศัพท์ที่ใช้สั่งซื้อ"
          className="input flex-1"
          inputMode="tel"
        />
        <Button onClick={() => search({ phone: phone.trim() })} disabled={loading || !phone.trim()}>
          ค้นหา
        </Button>
      </div>

      {loading && <p className="text-center text-sm text-[var(--color-muted)]">กำลังค้นหา...</p>}
      {error && <p className="text-center text-sm text-danger-500">{error}</p>}

      {searched && !loading && orders?.length === 0 && (
        <p className="text-center text-sm text-[var(--color-muted)]">ไม่พบคำสั่งซื้อ</p>
      )}

      <div className="flex flex-col gap-3">
        {orders?.map((order) => (
          <Link
            key={order.orderNumber}
            href={`/order/success/${order.orderNumber}?phone=${encodeURIComponent(order.phone)}`}
            className="rounded-2xl border border-[var(--color-border)] bg-white p-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-800">{order.orderNumber}</span>
              <span
                className={clsx(
                  "rounded-full px-2.5 py-1 text-xs font-medium",
                  ORDER_STATUS_COLORS[order.status]
                )}
              >
                {ORDER_STATUS_LABELS[order.status]}
              </span>
            </div>
            <p className="mt-1 text-xs text-[var(--color-muted)]">
              {formatDateTime(order.createdAt)} · {order.items.length} รายการ
            </p>
            <p className="mt-1 text-sm font-bold text-primary-600">{formatCurrency(order.total)}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
