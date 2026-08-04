import Image from "next/image";
import Link from "next/link";
import { getStoreSettings } from "@/lib/store-settings";
import { CartBadge } from "./CartBadge";

export async function Header() {
  const settings = await getStoreSettings();

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--color-border)] bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
        <Link href="/" className="flex min-w-0 items-center gap-2">
          <Image
            src={settings.logoUrl}
            alt={settings.storeName}
            width={40}
            height={40}
            className="h-10 w-10 shrink-0 rounded-full object-cover"
            priority
          />
          <span className="truncate text-base font-bold text-slate-900">{settings.storeName}</span>
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/order/lookup"
            className="hidden shrink-0 text-sm font-medium text-slate-600 hover:text-primary-600 sm:block"
          >
            ติดตามออเดอร์
          </Link>
          <CartBadge />
        </div>
      </div>
    </header>
  );
}
