"use client";

import { useEffect, useState } from "react";

export interface LiffProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
}

interface LiffState {
  isReady: boolean;
  isInClient: boolean;
  isLoggedIn: boolean;
  profile: LiffProfile | null;
  error: string | null;
}

/**
 * Initializes LINE LIFF (if NEXT_PUBLIC_LIFF_ID is configured) to fetch the
 * customer's LINE profile for prefilling checkout. Safe to use outside LINE
 * (regular browser) or with no LIFF ID configured — it just resolves with an
 * empty profile in those cases so the rest of the app works unaffected.
 */
export function useLiff(): LiffState {
  const [state, setState] = useState<LiffState>({
    isReady: false,
    isInClient: false,
    isLoggedIn: false,
    profile: null,
    error: null,
  });

  useEffect(() => {
    const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
    if (!liffId) {
      setState((s) => ({ ...s, isReady: true }));
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const liffModule = await import("@line/liff");
        const liff = liffModule.default;
        await liff.init({ liffId });
        if (cancelled) return;

        const isInClient = liff.isInClient();
        const isLoggedIn = liff.isLoggedIn();
        let profile: LiffProfile | null = null;

        if (isLoggedIn) {
          const p = await liff.getProfile();
          profile = { userId: p.userId, displayName: p.displayName, pictureUrl: p.pictureUrl };
        }

        if (!cancelled) {
          setState({ isReady: true, isInClient, isLoggedIn, profile, error: null });
        }
      } catch (err) {
        if (!cancelled) {
          setState((s) => ({ ...s, isReady: true, error: (err as Error).message }));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
