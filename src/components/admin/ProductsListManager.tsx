"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToastStore } from "@/store/toast";
import clsx from "clsx";

interface ProductRow {
  id: string;
  name: string;
  slug: string;
  price: number;
  stock: number;
  isActive: boolean;
  category: { id: string; name: string } | null;
  image: string | null;
}

export function ProductsListManager() {
  const [products, setProducts] = useState<ProductRow[] | null>(null);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const addToast = useToastStore((s) => s.addToast);

  async function load(p = 1, q = query) {
    const params = new URLSearchParams({ page: String(p) });
    if (q) params.set("q", q);
    const res = await fetch(`/api/admin/products?${params.toString()}`);
    const data = await res.json();
    setProducts(data.products);
    setPage(data.page);
    setHasMore(data.hasMore);
  }

  useEffect(() => {
    load(1, query);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  async function handleDelete(product: ProductRow) {
    if (!confirm(`ลบสินค้า "${product.name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      addToast("ลบสินค้าแล้ว");
      load(page, query);
    } catch {
      addToast("ลบไม่สำเร็จ", "error");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-lg font-bold text-slate-900">สินค้า</h1>
        <Link href="/admin/products/new">
          <Button size="sm">+ เพิ่มสินค้า</Button>
        </Link>
      </div>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="ค้นหาสินค้า..."
        className="input"
      />

      {!products ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <p className="py-10 text-center text-sm text-[var(--color-muted)]">ไม่พบสินค้า</p>
      ) : (
        <div className="flex flex-col gap-2">
          {products.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-white p-3"
            >
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-50">
                <Image
                  src={p.image ?? "/images/product-placeholder.svg"}
                  alt=""
                  fill
                  sizes="56px"
                  className="object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-800">{p.name}</p>
                <p className="text-xs text-[var(--color-muted)]">
                  {p.category?.name ?? "ไม่มีหมวดหมู่"} · {formatCurrency(p.price)}
                </p>
                <div className="mt-1 flex items-center gap-1.5">
                  <span
                    className={clsx(
                      "rounded-full px-2 py-0.5 text-[10px] font-medium",
                      p.isActive ? "bg-success-500/10 text-success-500" : "bg-slate-200 text-slate-500"
                    )}
                  >
                    {p.isActive ? "เปิดขาย" : "ปิดขาย"}
                  </span>
                  <span
                    className={clsx(
                      "rounded-full px-2 py-0.5 text-[10px] font-medium",
                      p.stock <= 5 ? "bg-warning-500/10 text-warning-500" : "bg-slate-100 text-slate-500"
                    )}
                  >
                    สต๊อก {p.stock}
                  </span>
                </div>
              </div>
              <div className="flex shrink-0 flex-col gap-1">
                <Link
                  href={`/admin/products/${p.id}`}
                  className="rounded-full px-3 py-1 text-center text-xs font-medium text-primary-600 hover:bg-primary-50"
                >
                  แก้ไข
                </Link>
                <button
                  onClick={() => handleDelete(p)}
                  className="rounded-full px-3 py-1 text-xs font-medium text-danger-500 hover:bg-danger-50"
                >
                  ลบ
                </button>
              </div>
            </div>
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
