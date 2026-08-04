"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import clsx from "clsx";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/lib/order-status";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";

interface OrderRow {
  orderNumber: string;
  id: string;
  customerName: string;
  phone: string;
  status: string;
  total: number;
  createdAt: string;
  items: { productName: string; quantity: number }[];
}

const STATUS_OPTIONS = [
  { value: "", label: "ทุกสถานะ" },
  { value: "PENDING_PAYMENT", label: "รอชำระเงิน" },
  { value: "PAID", label: "ชำระแล้ว" },
  { value: "SHIPPING", label: "กำลังจัดส่ง" },
  { value: "DELIVERED", label: "ส่งแล้ว" },
  { value: "CANCELLED", label: "ยกเลิก" },
];

export function OrdersListManager() {
  const [orders, setOrders] = useState<OrderRow[] | null>(null);
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  function buildParams(p: number) {
    const params = new URLSearchParams({ page: String(p) });
    if (status) params.set("status", status);
    if (q) params.set("q", q);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    return params;
  }

  async function load(p = 1) {
    const res = await fetch(`/api/admin/orders?${buildParams(p).toString()}`);
    const data = await res.json();
    setOrders(data.orders);
    setPage(data.page);
    setHasMore(data.hasMore);
  }

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, q, from, to]);

  function handleExport() {
    window.location.href = `/api/admin/orders/export?${buildParams(1).toString()}`;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-slate-900">ออเดอร์</h1>
        <Button size="sm" variant="outline" onClick={handleExport}>
          ส่งออก CSV
        </Button>
      </div>

      <div className="flex flex-col gap-2 rounded-2xl border border-[var(--color-border)] bg-white p-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ค้นหาชื่อลูกค้า, เบอร์โทร, เลขออเดอร์"
          className="input"
        />
        <div className="grid grid-cols-3 gap-2">
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="input">
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="input" />
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="input" />
        </div>
      </div>

      {!orders ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <p className="py-10 text-center text-sm text-[var(--color-muted)]">ไม่พบคำสั่งซื้อ</p>
      ) : (
        <div className="flex flex-col gap-2">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/admin/orders/${order.id}`}
              className="flex items-center justify-between rounded-xl border border-[var(--color-border)] bg-white p-3"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-800">{order.orderNumber}</span>
                  <span
                    className={clsx(
                      "rounded-full px-2 py-0.5 text-[10px] font-medium",
                      ORDER_STATUS_COLORS[order.status]
                    )}
                  >
                    {ORDER_STATUS_LABELS[order.status]}
                  </span>
                </div>
                <p className="truncate text-xs text-[var(--color-muted)]">
                  {order.customerName} · {order.phone}
                </p>
                <p className="text-xs text-[var(--color-muted)]">{formatDateTime(order.createdAt)}</p>
              </div>
              <span className="shrink-0 text-sm font-bold text-primary-600">
                {formatCurrency(order.total)}
              </span>
            </Link>
          ))}
        </div>
      )}

      {(page > 1 || hasMore) && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => load(page - 1)}>
            ก่อนหน้า
          </Button>
          <Button variant="outline" size="sm" disabled={!hasMore} onClick={() => load(page + 1)}>
            ถัดไป
          </Button>
        </div>
      )}
    </div>
  );
}
