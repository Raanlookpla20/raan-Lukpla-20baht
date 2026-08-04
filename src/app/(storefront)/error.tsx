"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

export default function StorefrontError({
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
    <div className="mx-auto flex max-w-5xl flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <div className="text-5xl">😵</div>
      <h1 className="text-lg font-semibold text-slate-900">โหลดข้อมูลไม่สำเร็จ</h1>
      <p className="max-w-sm text-sm text-[var(--color-muted)]">
        เกิดข้อผิดพลาดระหว่างโหลดข้อมูล กรุณาลองใหม่อีกครั้ง
      </p>
      <Button onClick={reset}>ลองอีกครั้ง</Button>
    </div>
  );
}
