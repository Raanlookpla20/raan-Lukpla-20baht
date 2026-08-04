"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useToastStore } from "@/store/toast";

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const array = new Uint8Array(new ArrayBuffer(rawData.length));
  for (let i = 0; i < rawData.length; i++) {
    array[i] = rawData.charCodeAt(i);
  }
  return array;
}

type PermissionState = "unsupported" | "default" | "granted" | "denied";

export function PushNotificationSetup() {
  const [permission, setPermission] = useState<PermissionState>("default");
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const addToast = useToastStore((s) => s.addToast);

  useEffect(() => {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setPermission("unsupported");
      return;
    }
    setPermission(Notification.permission as PermissionState);

    navigator.serviceWorker.register("/sw.js").then(async (registration) => {
      const existing = await registration.pushManager.getSubscription();
      setSubscribed(Boolean(existing));
    });
  }, []);

  async function handleEnable() {
    if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
      addToast("ยังไม่ได้ตั้งค่า VAPID key กรุณาตั้งค่าก่อนใช้งาน", "error");
      return;
    }

    setBusy(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result as PermissionState);
      if (result !== "granted") return;

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY),
      });

      const json = subscription.toJSON();
      await fetch("/api/admin/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
      });

      setSubscribed(true);
      addToast("เปิดการแจ้งเตือนสำเร็จ");
    } catch (err) {
      addToast(err instanceof Error ? err.message : "เปิดการแจ้งเตือนไม่สำเร็จ", "error");
    } finally {
      setBusy(false);
    }
  }

  async function handleTest() {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/push/test", { method: "POST" });
      if (!res.ok) throw new Error("ส่งการแจ้งเตือนทดสอบไม่สำเร็จ");
      addToast("ส่งการแจ้งเตือนทดสอบแล้ว");
    } catch (err) {
      addToast(err instanceof Error ? err.message : "ส่งการแจ้งเตือนทดสอบไม่สำเร็จ", "error");
    } finally {
      setBusy(false);
    }
  }

  if (permission === "unsupported") return null;

  if (permission === "default") {
    return (
      <div className="flex flex-col gap-2 rounded-2xl border border-primary-200 bg-primary-50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-800">เปิดการแจ้งเตือนออเดอร์ใหม่</p>
          <p className="text-xs text-[var(--color-muted)]">
            รับแจ้งเตือนทันทีเมื่อมีลูกค้าสั่งซื้อ แม้ไม่ได้เปิดหน้านี้ค้างไว้
          </p>
        </div>
        <Button size="sm" onClick={handleEnable} disabled={busy}>
          อนุญาตการแจ้งเตือน
        </Button>
      </div>
    );
  }

  if (permission === "denied") {
    return (
      <div className="rounded-2xl border border-warning-500/30 bg-warning-500/10 p-4 text-sm text-warning-500">
        การแจ้งเตือนถูกปิดกั้น กรุณาเปิดใช้งานผ่านการตั้งค่าเบราว์เซอร์เพื่อรับแจ้งเตือนออเดอร์ใหม่
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between rounded-2xl border border-[var(--color-border)] bg-white p-4">
      <p className="text-sm text-slate-600">
        {subscribed ? "เปิดการแจ้งเตือนอยู่" : "อนุญาตแล้ว กำลังเชื่อมต่อ..."}
      </p>
      <Button size="sm" variant="outline" onClick={handleTest} disabled={busy}>
        ทดสอบส่งการแจ้งเตือน
      </Button>
    </div>
  );
}
