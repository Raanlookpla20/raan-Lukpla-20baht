"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useCartStore, itemUnitPrice } from "@/store/cart";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/Button";

export function CartContent({
  shippingFlatRate,
  freeShippingThreshold,
}: {
  shippingFlatRate: number;
  freeShippingThreshold: number | null;
}) {
  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateNote = useCartStore((s) => s.updateNote);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  if (items.length === 0) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-6 py-20 text-center">
        <div className="text-5xl">🛒</div>
        <p className="text-sm text-[var(--color-muted)]">ยังไม่มีสินค้าในตะกร้า</p>
        <Link href="/">
          <Button>เลือกซื้อสินค้า</Button>
        </Link>
      </div>
    );
  }

  const subtotal = items.reduce((sum, i) => sum + itemUnitPrice(i) * i.quantity, 0);
  const shippingFee =
    freeShippingThreshold != null && subtotal >= freeShippingThreshold ? 0 : shippingFlatRate;
  const total = subtotal + shippingFee;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-4">
      <h1 className="text-lg font-bold text-slate-900">ตะกร้าสินค้า</h1>

      <div className="flex flex-col gap-3">
        {items.map((item) => {
          const unitPrice = itemUnitPrice(item);
          return (
            <div
              key={item.lineId}
              className="flex gap-3 rounded-2xl border border-[var(--color-border)] bg-white p-3"
            >
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-50">
                <Image
                  src={item.image ?? "/images/product-placeholder.svg"}
                  alt={item.name}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </div>
              <div className="flex flex-1 flex-col gap-1">
                <div className="flex items-start justify-between gap-2">
                  <Link href={`/products/${item.slug}`} className="text-sm font-medium text-slate-800">
                    {item.name}
                  </Link>
                  <button
                    onClick={() => removeItem(item.lineId)}
                    className="shrink-0 text-xs text-danger-500"
                    aria-label="ลบสินค้า"
                  >
                    ลบ
                  </button>
                </div>
                {item.options.length > 0 && (
                  <p className="text-xs text-[var(--color-muted)]">
                    {item.options.map((o) => o.valueLabel).join(" / ")}
                  </p>
                )}
                <input
                  value={item.note}
                  onChange={(e) => updateNote(item.lineId, e.target.value)}
                  placeholder="หมายเหตุ (ถ้ามี)"
                  maxLength={300}
                  className="rounded-md border border-transparent bg-slate-50 px-2 py-1 text-xs text-slate-600 focus:border-primary-300 focus:bg-white focus:outline-none"
                />
                <div className="mt-auto flex items-center justify-between">
                  <span className="text-sm font-bold text-primary-600">
                    {formatCurrency(unitPrice)}
                  </span>
                  <div className="flex items-center rounded-full border border-[var(--color-border)]">
                    <button
                      onClick={() => updateQuantity(item.lineId, item.quantity - 1)}
                      className="flex h-7 w-7 items-center justify-center text-slate-600"
                    >
                      −
                    </button>
                    <span className="w-7 text-center text-xs font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.lineId, item.quantity + 1)}
                      disabled={item.quantity >= item.maxStock}
                      className="flex h-7 w-7 items-center justify-center text-slate-600 disabled:opacity-30"
                    >
                      +
                    </button>
                  </div>
                </div>
                {item.quantity >= item.maxStock && (
                  <p className="text-[11px] text-warning-500">สูงสุด {item.maxStock} ชิ้น</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
        <div className="flex justify-between text-sm text-slate-600">
          <span>ยอดรวมสินค้า</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        <div className="mt-1 flex justify-between text-sm text-slate-600">
          <span>ค่าจัดส่ง</span>
          <span>{shippingFee === 0 ? "ฟรี" : formatCurrency(shippingFee)}</span>
        </div>
        {freeShippingThreshold != null && shippingFee > 0 && (
          <p className="mt-1 text-xs text-[var(--color-muted)]">
            ซื้อครบ {formatCurrency(freeShippingThreshold)} ส่งฟรี
          </p>
        )}
        <div className="mt-2 flex justify-between border-t border-[var(--color-border)] pt-2 text-base font-bold text-slate-900">
          <span>ยอดรวมทั้งหมด</span>
          <span className="text-primary-600">{formatCurrency(total)}</span>
        </div>
      </div>

      <Link href="/checkout">
        <Button size="lg" fullWidth>
          ดำเนินการสั่งซื้อ
        </Button>
      </Link>
    </div>
  );
}
