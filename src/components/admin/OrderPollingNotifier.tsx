"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useToastStore } from "@/store/toast";
import { formatCurrency } from "@/lib/format";

const POLL_INTERVAL_MS = 15_000;

function playBeep() {
  try {
    const AudioContextCtor =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioContextCtor();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = 880;
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.4);
    oscillator.onended = () => ctx.close();
  } catch {
    // Audio not available (e.g. autoplay restrictions before first user interaction) — ignore
  }
}

/** Polls for new orders while any admin page is open and surfaces a toast + sound. */
export function OrderPollingNotifier() {
  const addToast = useToastStore((s) => s.addToast);
  const router = useRouter();
  const cursorRef = useRef<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const params = new URLSearchParams();
        if (cursorRef.current) params.set("since", cursorRef.current);
        const res = await fetch(`/api/admin/orders/poll?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) {
            if (cursorRef.current && data.orders.length > 0) {
              for (const order of data.orders) {
                addToast(`ออเดอร์ใหม่ ${order.orderNumber} · ${formatCurrency(order.total)}`, "info");
              }
              playBeep();
              router.refresh();
            }
            cursorRef.current = data.serverTime;
          }
        }
      } catch {
        // network hiccup — try again next interval
      }
      if (!cancelled) {
        timerRef.current = setTimeout(poll, POLL_INTERVAL_MS);
      }
    }

    poll();

    return () => {
      cancelled = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
