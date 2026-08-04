// The shop operates in Thailand (Asia/Bangkok, UTC+7, no DST) — "today"
// and daily sales buckets must reflect the shop owner's local calendar day
// regardless of the server process's own timezone (dev machine vs Vercel's
// UTC runtime), so day boundaries are computed against a fixed +07:00
// offset rather than the host's local time.
const BANGKOK_OFFSET_MS = 7 * 60 * 60 * 1000;

/** Returns the Bangkok-local calendar date (YYYY-MM-DD) for a given instant. */
export function bangkokDateKey(date: Date): string {
  return new Date(date.getTime() + BANGKOK_OFFSET_MS).toISOString().slice(0, 10);
}

/** Returns the UTC instant corresponding to 00:00 Bangkok time on the given date's Bangkok calendar day. */
export function bangkokDayStart(date: Date): Date {
  return new Date(`${bangkokDateKey(date)}T00:00:00+07:00`);
}
