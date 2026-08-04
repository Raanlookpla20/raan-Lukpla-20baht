"use client";

import clsx from "clsx";

export interface CategoryOption {
  id: string;
  name: string;
  slug: string;
}

export function CategoryTabs({
  categories,
  selectedSlug,
  onSelect,
}: {
  categories: CategoryOption[];
  selectedSlug: string;
  onSelect: (slug: string) => void;
}) {
  return (
    <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-1 sm:px-0">
      <button
        onClick={() => onSelect("")}
        className={clsx(
          "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition",
          selectedSlug === ""
            ? "bg-primary-500 text-white shadow-sm"
            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
        )}
      >
        ทั้งหมด
      </button>
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.slug)}
          className={clsx(
            "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition",
            selectedSlug === cat.slug
              ? "bg-primary-500 text-white shadow-sm"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          )}
        >
          {cat.name}
        </button>
      ))}
    </div>
  );
}
