import { AdminNav } from "@/components/admin/AdminNav";
import { PushNotificationSetup } from "@/components/admin/PushNotificationSetup";
import { OrderPollingNotifier } from "@/components/admin/OrderPollingNotifier";

export const metadata = {
  title: { default: "แดชบอร์ด", template: "%s | Admin ร้านลูกปลา 20 บาท" },
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Admin ลูกปลา",
  },
};

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-1 flex-col bg-slate-50">
      <AdminNav />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 px-4 py-5">
        <PushNotificationSetup />
        {children}
      </main>
      <OrderPollingNotifier />
    </div>
  );
}
