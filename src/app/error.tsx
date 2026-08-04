"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="text-5xl">😵</div>
      <h1 className="text-lg font-semibold text-slate-900">เกิดข้อผิดพลาดบางอย่าง</h1>
      <p className="max-w-sm text-sm text-[var(--color-muted)]">
        ขออภัยในความไม่สะดวก ลองรีเฟรชหน้านี้อีกครั้ง หากยังพบปัญหากรุณาติดต่อร้านค้า
      </p>
      <button
        onClick={reset}
        className="rounded-full bg-primary-500 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-primary-600 active:scale-95"
      >
        ลองอีกครั้ง
      </button>
    </div>
  );
}
