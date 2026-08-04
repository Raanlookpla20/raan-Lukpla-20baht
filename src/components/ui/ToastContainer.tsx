"use client";

import clsx from "clsx";
import { useToastStore } from "@/store/toast";

const typeStyles = {
  success: "bg-slate-900 text-white",
  error: "bg-danger-600 text-white",
  info: "bg-slate-700 text-white",
};

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={clsx(
            "animate-fade-in pointer-events-auto max-w-sm rounded-full px-4 py-2.5 text-sm font-medium shadow-lg",
            typeStyles[toast.type]
          )}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
