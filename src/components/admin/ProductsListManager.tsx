"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
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

interface CategoryOption {
  id: string;
  name: string;
}

// Session-scoped (not localStorage): a fresh browser session should start
// the list clean, but navigating to edit a product and back within the same
// session should land exactly where the admin left off.
const QUERY_STORAGE_KEY = "admin-products-list-query";
const SCROLL_STORAGE_KEY = "admin-products-list-scroll";

export function ProductsListManager() {
  const [products, setProducts] = useState<ProductRow[] | null>(null);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const addToast = useToastStore((s) => s.addToast);
  const scrollRestoredRef = useRef(false);
  // Guards the [query] effect below from re-running the initial load a
  // second time once the restored query (if any) lands — see the mount
  // effect for why.
  const skipNextQueryLoadRef = useRef(true);

  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkCategoryId, setBulkCategoryId] = useState("");
  const [bulkMoving, setBulkMoving] = useState(false);
  const selectAllRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then((data) => setCategories(data.categories));
  }, []);

  async function load(p = 1, q = query) {
    // A fresh page of rows invalidates any selection made against the
    // previous set (different search, different page, or a just-completed
    // bulk action) — start clean rather than carry stale ids (or a stale
    // target-category choice) forward.
    setSelectedIds(new Set());
    setBulkCategoryId("");
    const params = new URLSearchParams({ page: String(p) });
    if (q) params.set("q", q);
    const res = await fetch(`/api/admin/products?${params.toString()}`);
    const data = await res.json();
    setProducts(data.products);
    setPage(data.page);
    setHasMore(data.hasMore);
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (!products) return;
    setSelectedIds((prev) => {
      const allSelected = products.every((p) => prev.has(p.id));
      return allSelected ? new Set() : new Set(products.map((p) => p.id));
    });
  }

  useEffect(() => {
    if (!selectAllRef.current || !products) return;
    const selectedCount = products.filter((p) => selectedIds.has(p.id)).length;
    selectAllRef.current.indeterminate = selectedCount > 0 && selectedCount < products.length;
  }, [selectedIds, products]);

  async function handleBulkMove() {
    if (selectedIds.size === 0 || !bulkCategoryId) return;
    const targetCategory = categories.find((c) => c.id === bulkCategoryId);
    const count = selectedIds.size;
    const confirmed = confirm(
      `ยืนยันย้ายสินค้า ${count} รายการ ไปหมวดหมู่ "${targetCategory?.name ?? ""}" ใช่หรือไม่`
    );
    if (!confirmed) return;

    setBulkMoving(true);
    try {
      const res = await fetch("/api/admin/products/bulk-category", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productIds: [...selectedIds], categoryId: bulkCategoryId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "ย้ายหมวดหมู่ไม่สำเร็จ");
      addToast(`ย้ายสินค้า ${count} รายการเรียบร้อย`);
      load(page, query); // also clears the (now-stale) selection + category choice
    } catch (err) {
      addToast(err instanceof Error ? err.message : "ย้ายหมวดหมู่ไม่สำเร็จ", "error");
    } finally {
      setBulkMoving(false);
    }
  }

  // Restore the previous search text (if any) and fire the one-and-only
  // initial load with its final value. If we instead let the [query] effect
  // below handle every load, a restored query would fire it twice — once
  // with the still-empty initial query, once after setQuery lands — and
  // whichever fetch resolved last would win the race, sometimes leaving the
  // (correctly filtered) UI showing the wrong, unfiltered list.
  useEffect(() => {
    const savedQuery = sessionStorage.getItem(QUERY_STORAGE_KEY) ?? "";
    if (savedQuery) {
      setQuery(savedQuery); // the [query] effect's next run does the actual load
    } else {
      load(1, "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (skipNextQueryLoadRef.current) {
      skipNextQueryLoadRef.current = false;
      return;
    }
    load(1, query);
    sessionStorage.setItem(QUERY_STORAGE_KEY, query);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  // Restore scroll position exactly once, after the list has actually
  // rendered (restoring before the rows exist would just clamp to 0).
  useEffect(() => {
    if (!products || scrollRestoredRef.current) return;
    scrollRestoredRef.current = true;
    const savedScroll = sessionStorage.getItem(SCROLL_STORAGE_KEY);
    if (savedScroll) {
      requestAnimationFrame(() => window.scrollTo(0, Number(savedScroll)));
    }
  }, [products]);

  // Keep the latest scroll position saved so it survives navigating away to
  // edit a product and back.
  useEffect(() => {
    function handleScroll() {
      sessionStorage.setItem(SCROLL_STORAGE_KEY, String(window.scrollY));
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
    <div className={clsx("flex flex-col gap-4", selectedIds.size > 0 && "pb-20")}>
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
        <div className="flex flex-col gap-1">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-11 rounded-lg" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <p className="py-10 text-center text-sm text-[var(--color-muted)]">ไม่พบสินค้า</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--color-border)] bg-white">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-slate-50 text-left text-xs font-medium text-slate-500">
                <th className="px-3 py-2 font-medium">
                  <input
                    ref={selectAllRef}
                    type="checkbox"
                    checked={products.length > 0 && products.every((p) => selectedIds.has(p.id))}
                    onChange={toggleSelectAll}
                    className="h-4 w-4"
                    aria-label="เลือกสินค้าทั้งหมด"
                  />
                </th>
                <th className="px-3 py-2 font-medium">รูป</th>
                <th className="px-3 py-2 font-medium">ชื่อสินค้า</th>
                <th className="px-3 py-2 font-medium">หมวดหมู่</th>
                <th className="px-3 py-2 font-medium">ราคา</th>
                <th className="px-3 py-2 font-medium">สต็อก</th>
                <th className="px-3 py-2 font-medium">สถานะ</th>
                <th className="px-3 py-2 text-right font-medium">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {products.map((p) => (
                <tr
                  key={p.id}
                  className={clsx("hover:bg-slate-50", selectedIds.has(p.id) && "bg-primary-50/60")}
                >
                  <td className="px-3 py-1.5">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(p.id)}
                      onChange={() => toggleSelect(p.id)}
                      className="h-4 w-4"
                      aria-label={`เลือก ${p.name}`}
                    />
                  </td>
                  <td className="px-3 py-1.5">
                    <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-slate-50">
                      <Image
                        src={p.image ?? "/images/product-placeholder.svg"}
                        alt=""
                        fill
                        sizes="36px"
                        className="object-cover"
                      />
                    </div>
                  </td>
                  <td className="max-w-[240px] truncate px-3 py-1.5 font-medium text-slate-800">
                    {p.name}
                  </td>
                  <td className="px-3 py-1.5 text-slate-600">{p.category?.name ?? "ไม่มีหมวดหมู่"}</td>
                  <td className="px-3 py-1.5 whitespace-nowrap text-slate-800">
                    {formatCurrency(p.price)}
                  </td>
                  <td
                    className={clsx(
                      "px-3 py-1.5",
                      p.stock <= 5 ? "font-medium text-warning-500" : "text-slate-600"
                    )}
                  >
                    {p.stock}
                  </td>
                  <td className="px-3 py-1.5">
                    <span
                      className={clsx(
                        "rounded-full px-2 py-0.5 text-[10px] font-medium",
                        p.isActive
                          ? "bg-success-500/10 text-success-500"
                          : "bg-slate-200 text-slate-500"
                      )}
                    >
                      {p.isActive ? "เปิดขาย" : "ปิดขาย"}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-1.5 text-right">
                    <Link
                      href={`/admin/products/${p.id}`}
                      className="rounded-full px-2.5 py-1 text-xs font-medium text-primary-600 hover:bg-primary-50"
                    >
                      แก้ไข
                    </Link>
                    <button
                      onClick={() => handleDelete(p)}
                      className="rounded-full px-2.5 py-1 text-xs font-medium text-danger-500 hover:bg-danger-50"
                    >
                      ลบ
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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

      {selectedIds.size > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--color-border)] bg-white px-4 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.08)]">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-slate-700">
              เลือกอยู่ {selectedIds.size} รายการ
            </span>
            <select
              value={bulkCategoryId}
              onChange={(e) => setBulkCategoryId(e.target.value)}
              className="input w-auto min-w-[180px] flex-1"
            >
              <option value="">เลือกหมวดหมู่ปลายทาง</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <Button size="sm" onClick={handleBulkMove} disabled={!bulkCategoryId || bulkMoving}>
              {bulkMoving ? "กำลังย้าย..." : "ย้ายหมวดหมู่"}
            </Button>
            <button
              onClick={() => {
                setSelectedIds(new Set());
                setBulkCategoryId("");
              }}
              className="text-xs font-medium text-slate-500 hover:text-slate-700"
            >
              ยกเลิกการเลือก
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
