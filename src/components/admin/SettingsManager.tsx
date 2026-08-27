"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToastStore } from "@/store/toast";
import type { StoreSettingsData } from "@/lib/store-settings";

export function SettingsManager() {
  const [settings, setSettings] = useState<StoreSettingsData | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const addToast = useToastStore((s) => s.addToast);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data) => setSettings(data.settings));
  }, []);

  function update<K extends keyof StoreSettingsData>(key: K, value: StoreSettingsData[K]) {
    setSettings((s) => (s ? { ...s, [key]: value } : s));
  }

  async function uploadFile(file: File): Promise<string> {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", "store");
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "อัปโหลดไม่สำเร็จ");
    return data.url;
  }

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const url = await uploadFile(file);
      update("logoUrl", url);
    } catch (err) {
      addToast(err instanceof Error ? err.message : "อัปโหลดไม่สำเร็จ", "error");
    } finally {
      setUploadingLogo(false);
      e.target.value = "";
    }
  }

  async function handleBannerAdd(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0 || !settings) return;
    setUploadingBanner(true);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        urls.push(await uploadFile(file));
      }
      update("bannerUrls", [...settings.bannerUrls, ...urls]);
    } catch (err) {
      addToast(err instanceof Error ? err.message : "อัปโหลดไม่สำเร็จ", "error");
    } finally {
      setUploadingBanner(false);
      e.target.value = "";
    }
  }

  function removeBanner(index: number) {
    if (!settings) return;
    update(
      "bannerUrls",
      settings.bannerUrls.filter((_, i) => i !== index)
    );
  }

  async function handleSave() {
    if (!settings) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "บันทึกไม่สำเร็จ");
      addToast("บันทึกการตั้งค่าแล้ว");
    } catch (err) {
      addToast(err instanceof Error ? err.message : "บันทึกไม่สำเร็จ", "error");
    } finally {
      setSaving(false);
    }
  }

  if (!settings) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 pb-10">
      <h1 className="text-lg font-bold text-slate-900">ตั้งค่าร้านค้า</h1>

      <div className="flex flex-col gap-3 rounded-2xl border border-[var(--color-border)] bg-white p-4">
        <p className="text-sm font-semibold text-slate-700">ข้อมูลร้านค้า</p>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-slate-500">ชื่อร้าน</span>
          <input
            value={settings.storeName}
            onChange={(e) => update("storeName", e.target.value)}
            className="input"
          />
        </label>

        <div>
          <span className="text-xs font-medium text-slate-500">โลโก้ร้าน</span>
          <div className="mt-1 flex items-center gap-3">
            <div className="relative h-16 w-16 overflow-hidden rounded-full border bg-slate-50">
              <Image src={settings.logoUrl} alt="โลโก้" fill className="object-cover" />
            </div>
            <label className="cursor-pointer rounded-full border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium text-slate-600">
              {uploadingLogo ? "กำลังอัปโหลด..." : "เปลี่ยนโลโก้"}
              <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
            </label>
          </div>
        </div>

        <div>
          <span className="text-xs font-medium text-slate-500">แบนเนอร์ (สไลด์ได้หลายรูป)</span>
          <div className="mt-1 flex flex-wrap gap-2">
            {settings.bannerUrls.map((url, i) => (
              <div key={url + i} className="relative h-16 w-28 overflow-hidden rounded-lg border">
                <Image src={url} alt="" fill className="object-cover" />
                <button
                  onClick={() => removeBanner(i)}
                  className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-xs text-white"
                >
                  ✕
                </button>
              </div>
            ))}
            <label className="flex h-16 w-28 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-[var(--color-border)] text-xs text-[var(--color-muted)]">
              {uploadingBanner ? "..." : "+ เพิ่มแบนเนอร์"}
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleBannerAdd}
              />
            </label>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-[var(--color-border)] bg-white p-4">
        <p className="text-sm font-semibold text-slate-700">การชำระเงิน</p>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-slate-500">เลขพร้อมเพย์</span>
          <input
            value={settings.promptpayId}
            onChange={(e) => update("promptpayId", e.target.value)}
            className="input"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-slate-500">ธนาคาร</span>
          <input
            value={settings.bankName}
            onChange={(e) => update("bankName", e.target.value)}
            className="input"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-slate-500">เลขบัญชี</span>
          <input
            value={settings.bankAccountNumber}
            onChange={(e) => update("bankAccountNumber", e.target.value)}
            className="input"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-slate-500">ชื่อบัญชี</span>
          <input
            value={settings.bankAccountName}
            onChange={(e) => update("bankAccountName", e.target.value)}
            className="input"
          />
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={settings.codEnabled}
            onChange={(e) => update("codEnabled", e.target.checked)}
            className="h-4 w-4"
          />
          <span className="text-sm text-slate-700">เปิดรับเก็บเงินปลายทาง (COD)</span>
        </label>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-[var(--color-border)] bg-white p-4">
        <p className="text-sm font-semibold text-slate-700">ค่าจัดส่ง</p>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-slate-500">ค่าจัดส่งแบบคงที่ (บาท)</span>
          <input
            type="number"
            value={settings.shippingFlatRate}
            onChange={(e) => update("shippingFlatRate", Number(e.target.value))}
            className="input"
            min={0}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-slate-500">ยอดซื้อขั้นต่ำเพื่อส่งฟรี (เว้นว่างถ้าไม่มี)</span>
          <input
            type="number"
            value={settings.freeShippingThreshold ?? ""}
            onChange={(e) =>
              update("freeShippingThreshold", e.target.value === "" ? null : Number(e.target.value))
            }
            className="input"
            min={0}
          />
        </label>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-[var(--color-border)] bg-white p-4">
        <p className="text-sm font-semibold text-slate-700">ส่งฟรีตามระยะทางจากร้าน</p>
        <p className="text-xs text-[var(--color-muted)]">
          เมื่อลูกค้าปักหมุดที่อยู่จัดส่งในหน้า checkout แล้วอยู่ในรัศมีนี้จากร้าน ระบบจะคิดค่าส่งเป็น 0 บาทให้อัตโนมัติ
          ไม่ว่ายอดสั่งซื้อจะเท่าไหร่
        </p>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-500">ละติจูดร้าน</span>
            <input
              type="number"
              step="any"
              value={settings.storeLatitude}
              onChange={(e) => update("storeLatitude", Number(e.target.value))}
              className="input"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-500">ลองจิจูดร้าน</span>
            <input
              type="number"
              step="any"
              value={settings.storeLongitude}
              onChange={(e) => update("storeLongitude", Number(e.target.value))}
              className="input"
            />
          </label>
        </div>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-slate-500">รัศมีส่งฟรี (กิโลเมตร)</span>
          <input
            type="number"
            step="any"
            value={settings.freeDeliveryRadiusKm}
            onChange={(e) => update("freeDeliveryRadiusKm", Number(e.target.value))}
            className="input"
            min={0}
          />
        </label>
      </div>

      <Button fullWidth onClick={handleSave} disabled={saving}>
        {saving ? "กำลังบันทึก..." : "บันทึกการตั้งค่า"}
      </Button>
    </div>
  );
}
