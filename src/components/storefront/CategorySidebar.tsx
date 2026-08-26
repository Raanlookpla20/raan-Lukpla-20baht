"use client";

import clsx from "clsx";

export interface CategoryOption {
  id: string;
  name: string;
  slug: string;
}

export function CategorySidebar({
  categories,
  selectedSlug,
  onSelect,
}: {
  categories: CategoryOption[];
  selectedSlug: string;
  onSelect: (slug: string) => void;
}) {
  return (
    <nav className="flex flex-col divide-y divide-[var(--color-border)] bg-slate-50">
      <SidebarItem label="ทั้งหมด" active={selectedSlug === ""} onClick={() => onSelect("")} />
      {categories.map((cat) => (
        <SidebarItem
          key={cat.id}
          label={cat.name}
          active={selectedSlug === cat.slug}
          onClick={() => onSelect(cat.slug)}
        />
      ))}
    </nav>
  );
}

function SidebarItem({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "relative px-2 py-3 text-center text-xs font-medium leading-snug transition",
        active ? "bg-white text-primary-600 font-semibold" : "text-slate-600 hover:bg-slate-100"
      )}
    >
      {active && (
        <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary-500" />
      )}
      {label}
    </button>
  );
}
