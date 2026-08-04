import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** Lightweight product list for admin select dropdowns (promotions, etc). */
export async function GET() {
  const products = await prisma.product.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
  return NextResponse.json({ products });
}
