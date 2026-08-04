"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ProductCard, ProductCardData } from "./ProductCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";

interface ProductsResponse {
  products: ProductCardData[];
  page: number;
  hasMore: boolean;
}

export function ProductGrid({ query, categorySlug }: { query: string; categorySlug: string }) {
  const [products, setProducts] = useState<ProductCardData[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const fetchPage = useCallback(
    async (targetPage: number, replace: boolean) => {
      setLoading(true);
      setError(false);
      try {
        const params = new URLSearchParams({ page: String(targetPage) });
        if (query) params.set("q", query);
        if (categorySlug) params.set("category", categorySlug);

        const res = await fetch(`/api/products?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to fetch products");
        const data: ProductsResponse = await res.json();

        setProducts((prev) => (replace ? data.products : [...prev, ...data.products]));
        setPage(data.page);
        setHasMore(data.hasMore);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    },
    [query, categorySlug]
  );

  // Reset & refetch whenever search/category changes
  useEffect(() => {
    fetchPage(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, categorySlug]);

  // Infinite scroll sentinel
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          fetchPage(page + 1, false);
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loading, page, fetchPage]);

  if (error && products.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <p className="text-sm text-[var(--color-muted)]">โหลดสินค้าไม่สำเร็จ ลองอีกครั้ง</p>
        <Button size="sm" onClick={() => fetchPage(1, true)}>
          ลองใหม่
        </Button>
      </div>
    );
  }

  if (!loading && products.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-16 text-center">
        <div className="text-4xl">🔎</div>
        <p className="text-sm text-[var(--color-muted)]">ไม่พบสินค้าที่ค้นหา</p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
        {loading &&
          Array.from({ length: products.length === 0 ? 8 : 4 }).map((_, i) => (
            <div key={`skeleton-${i}`} className="flex flex-col gap-2">
              <Skeleton className="aspect-square w-full rounded-2xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
      </div>
      <div ref={sentinelRef} className="h-1" />
      {!hasMore && products.length > 0 && (
        <p className="py-6 text-center text-xs text-[var(--color-muted)]">
          — แสดงสินค้าครบทั้งหมดแล้ว —
        </p>
      )}
    </div>
  );
}
