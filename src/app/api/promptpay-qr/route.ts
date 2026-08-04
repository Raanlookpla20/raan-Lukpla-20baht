import { NextRequest, NextResponse } from "next/server";
import { generatePromptPayQrDataUrl } from "@/lib/promptpay";
import { getStoreSettings } from "@/lib/store-settings";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const amount = Number(searchParams.get("amount"));

  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "จำนวนเงินไม่ถูกต้อง" }, { status: 400 });
  }

  const settings = await getStoreSettings();
  const dataUrl = await generatePromptPayQrDataUrl(settings.promptpayId, amount);

  return NextResponse.json({ dataUrl });
}
