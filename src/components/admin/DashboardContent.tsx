"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import clsx from "clsx";
import { formatCurrency, formatNumber } from "@/lib/format";
import { StatTile } from "./StatTile";
import { SalesChart } from "./SalesChart";
import { Skeleton } from "@/components/ui/Skeleton";

interface DashboardData {
  todayOrders: number;
  todaySales: number;
  totalCustomers: number;
  totalProducts: number;
  lowStockProducts: { id: string; name: string; slug: string; stock: number }[];
  salesChart7d: { date: string; total: number }[];
  salesChart30d: { date: string; total: number }[];
  bestSellers: {
    productId: string | null;
    name: string;
    slug: string | null;
    image: string | null;
    totalQuantity: number;
  }[];
}

export function DashboardContent() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [range, setRange] = useState<"7" | "30">("7");
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/admin/dashboard")
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then(setData)
      .catch(() => setError(true));
  }, []);

  if (error) {
    return <p className="py-10 text-center text-sm text-danger-500">โหลดข้อมูลแดชบอร์ดไม่สำเร็จ</p>;
  }

  if (!data) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="ออเดอร์วันนี้" value={formatNumber(data.todayOrders)} />
        <StatTile label="ยอดขายวันนี้" value={formatCurrency(data.todaySales)} />
        <StatTile label="ลูกค้าทั้งหมด" value={formatNumber(data.totalCustomers)} />
        <StatTile label="สินค้าทั้งหมด" value={formatNumber(data.totalProducts)} />
      </div>

      <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-700">ยอดขายย้อนหลัง</p>
          <div className="flex gap-1 rounded-full bg-slate-100 p-0.5">
            {(["7", "30"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={clsx(
                  "rounded-full px-3 py-1 text-xs font-medium transition",
                  range === r ? "bg-white shadow-sm text-primary-600" : "text-slate-500"
                )}
              >
                {r} วัน
              </button>
            ))}
          </div>
        </div>
        <SalesChart data={range === "7" ? data.salesChart7d : data.salesChart30d} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
          <p className="mb-2 text-sm font-semibold text-slate-700">สินค้าใกล้หมดสต๊อก</p>
          {data.lowStockProducts.length === 0 ? (
            <p className="text-xs text-[var(--color-muted)]">ไม่มีสินค้าใกล้หมด</p>
          ) : (
            <div className="flex flex-col gap-2">
              {data.lowStockProducts.map((p) => (
                <Link
                  key={p.id}
                  href={`/admin/products/${p.id}`}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="truncate text-slate-700">{p.name}</span>
                  <span className="shrink-0 rounded-full bg-warning-500/10 px-2 py-0.5 text-xs font-medium text-warning-500">
                    เหลือ {p.stock}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
          <p className="mb-2 text-sm font-semibold text-slate-700">สินค้าขายดี</p>
          {data.bestSellers.length === 0 ? (
            <p className="text-xs text-[var(--color-muted)]">ยังไม่มีข้อมูล</p>
          ) : (
            <div className="flex flex-col gap-2">
              {data.bestSellers.map((p, i) => (
                <div key={p.productId ?? i} className="flex items-center gap-2 text-sm">
                  <span className="w-4 shrink-0 text-xs font-semibold text-[var(--color-muted)]">
                    {i + 1}
                  </span>
                  <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-md bg-slate-100">
                    <Image
                      src={p.image ?? "/images/product-placeholder.svg"}
                      alt=""
                      fill
                      sizes="32px"
                      className="object-cover"
                    />
                  </div>
                  <span className="flex-1 truncate text-slate-700">{p.name}</span>
                  <span className="shrink-0 text-xs text-[var(--color-muted)]">
                    ขาย {formatNumber(p.totalQuantity)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
