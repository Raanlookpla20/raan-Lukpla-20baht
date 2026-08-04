"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";

const NAV_ITEMS = [
  { href: "/admin", label: "แดชบอร์ด", exact: true },
  { href: "/admin/orders", label: "ออเดอร์" },
  { href: "/admin/products", label: "สินค้า" },
  { href: "/admin/categories", label: "หมวดหมู่" },
  { href: "/admin/promotions", label: "โปรโมชั่น" },
  { href: "/admin/settings", label: "ตั้งค่า" },
];

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--color-border)] bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <span className="text-sm font-bold text-slate-900">ระบบหลังบ้าน · ร้านลูกปลา 20 บาท</span>
        <button
          onClick={handleLogout}
          className="rounded-full px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100"
        >
          ออกจากระบบ
        </button>
      </div>
      <nav className="no-scrollbar mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4 pb-2">
        {NAV_ITEMS.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition",
                active ? "bg-primary-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
