import type { Prisma } from "@prisma/client";
import { formatOrderNumber } from "@/lib/format";

/**
 * Atomically increments the shared order sequence counter and returns the
 * next formatted order number (e.g. "ORD-000001"). Must be called from
 * within a Prisma `$transaction` so concurrent checkouts never collide —
 * the underlying UPDATE is a single atomic row mutation, and SQLite/Postgres
 * serialize writes to the same row within a transaction.
 */
export async function getNextOrderNumber(
  tx: Prisma.TransactionClient
): Promise<string> {
  const sequence = await tx.orderSequence.upsert({
    where: { id: 1 },
    create: { id: 1, lastNumber: 1 },
    update: { lastNumber: { increment: 1 } },
  });

  return formatOrderNumber(sequence.lastNumber);
}
