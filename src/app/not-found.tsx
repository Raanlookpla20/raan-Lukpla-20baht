import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="text-5xl">🔍</div>
      <h1 className="text-lg font-semibold text-slate-900">ไม่พบหน้าที่คุณต้องการ</h1>
      <p className="max-w-sm text-sm text-[var(--color-muted)]">
        หน้านี้อาจถูกลบ หรือลิงก์ไม่ถูกต้อง
      </p>
      <Link
        href="/"
        className="rounded-full bg-primary-500 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-primary-600 active:scale-95"
      >
        กลับหน้าแรก
      </Link>
    </div>
  );
}
