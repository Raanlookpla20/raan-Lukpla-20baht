import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-[var(--color-border)] bg-white py-6">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-2 px-4 text-center text-xs text-[var(--color-muted)]">
        <p>© {new Date().getFullYear()} ร้านลูกปลา 20 บาท</p>
        <Link href="/order/lookup" className="text-primary-600 hover:underline">
          ตรวจสอบสถานะออเดอร์
        </Link>
      </div>
    </footer>
  );
}
