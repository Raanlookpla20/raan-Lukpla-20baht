"use client";

import { useState } from "react";
import { SearchBar } from "./SearchBar";
import { CategoryTabs, CategoryOption } from "./CategoryTabs";
import { ProductGrid } from "./ProductGrid";
import { BannerCarousel } from "./BannerCarousel";

export function HomeContent({
  categories,
  banners,
}: {
  categories: CategoryOption[];
  banners: string[];
}) {
  const [query, setQuery] = useState("");
  const [categorySlug, setCategorySlug] = useState("");

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-5 px-4 py-4">
      <BannerCarousel banners={banners} />
      <SearchBar onSearch={setQuery} />
      <CategoryTabs
        categories={categories}
        selectedSlug={categorySlug}
        onSelect={setCategorySlug}
      />
      <ProductGrid query={query} categorySlug={categorySlug} />
    </div>
  );
}
