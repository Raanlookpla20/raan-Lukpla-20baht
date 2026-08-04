import { NextResponse } from "next/server";
import { sendPushToAllSubscribers } from "@/lib/push";

export async function POST() {
  try {
    await sendPushToAllSubscribers({
      title: "ทดสอบการแจ้งเตือน",
      body: "ระบบแจ้งเตือนทำงานปกติ 🎉",
      url: "/admin",
      tag: "test",
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Test push failed:", err);
    return NextResponse.json({ error: "ส่งการแจ้งเตือนไม่สำเร็จ" }, { status: 500 });
  }
}
