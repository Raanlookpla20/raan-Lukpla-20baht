import type { Metadata } from "next";
import { Noto_Sans_Thai } from "next/font/google";
import "./globals.css";
import { ToastContainer } from "@/components/ui/ToastContainer";

const notoSansThai = Noto_Sans_Thai({
  variable: "--font-geist-sans",
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "ร้านลูกปลา 20 บาท",
  description: "ร้านลูกปลา 20 บาท - ของใช้ในบ้าน เครื่องครัว เครื่องเขียน และของเบ็ดเตล็ด ราคาคุ้มค่า สั่งซื้อออนไลน์ง่ายๆ",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="th" className={`${notoSansThai.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[var(--background)]">
        {children}
        <ToastContainer />
      </body>
    </html>
  );
}
