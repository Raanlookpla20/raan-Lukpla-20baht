"use client";

import { useEffect, useRef, useState } from "react";
import { SearchBar } from "./SearchBar";
import { CategorySidebar, CategoryOption } from "./CategorySidebar";
import { ProductGrid } from "./ProductGrid";
import { BannerCarousel } from "./BannerCarousel";

const SIDEBAR_WIDTH = 96;
// Fallback used for the very first paint, before we can measure the real
// site header height on mount — keeps the search bar and sidebar roughly
// aligned instead of jumping from 0.
const FALLBACK_HEADER_HEIGHT = 64;

export function HomeContent({
  categories,
  banners,
}: {
  categories: CategoryOption[];
  banners: string[];
}) {
  const [query, setQuery] = useState("");
  const [categorySlug, setCategorySlug] = useState("");
  const searchBarRef = useRef<HTMLDivElement>(null);
  const [headerHeight, setHeaderHeight] = useState(FALLBACK_HEADER_HEIGHT);
  const [searchBarHeight, setSearchBarHeight] = useState(0);

  // The search bar sticks right below the sticky site header, and the sidebar
  // sticks right below both. Header height can vary with font rendering, so
  // measure it instead of hardcoding a pixel value — keeps the two sticky
  // offsets pixel-perfect and gap-free.
  useEffect(() => {
    function measure() {
      setHeaderHeight(document.querySelector("header")?.getBoundingClientRect().height ?? FALLBACK_HEADER_HEIGHT);
      setSearchBarHeight(searchBarRef.current?.getBoundingClientRect().height ?? 0);
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const stickyOffset = Math.round(headerHeight + searchBarHeight);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col">
      <div className="px-4 pt-4">
        <BannerCarousel banners={banners} />
      </div>

      <div
        ref={searchBarRef}
        className="sticky z-20 bg-[var(--background)] px-4 py-3"
        style={{ top: headerHeight }}
      >
        <SearchBar onSearch={setQuery} />
      </div>

      <div className="flex items-start">
        <aside
          className="no-scrollbar sticky shrink-0 self-start overflow-y-auto"
          style={{
            top: stickyOffset,
            width: SIDEBAR_WIDTH,
            maxHeight: `calc(100vh - ${stickyOffset}px)`,
          }}
        >
          <CategorySidebar categories={categories} selectedSlug={categorySlug} onSelect={setCategorySlug} />
        </aside>

        <div className="min-w-0 flex-1 px-3 py-3">
          <ProductGrid query={query} categorySlug={categorySlug} />
        </div>
      </div>
    </div>
  );
}
