"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCartStore, itemUnitPrice } from "@/store/cart";
import { useToastStore } from "@/store/toast";
import { useLiff } from "@/hooks/useLiff";
import { formatCurrency } from "@/lib/format";
import { haversineDistanceKm } from "@/lib/geo";
import { Button } from "@/components/ui/Button";
import type { StoreSettingsData } from "@/lib/store-settings";
import type { LatLng } from "@/components/storefront/LocationMapPicker";

// Leaflet touches `window` at module load — it must never be evaluated
// during SSR, so the map picker is loaded client-only.
const LocationMapPicker = dynamic(
  () => import("@/components/storefront/LocationMapPicker").then((m) => m.LocationMapPicker),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-64 w-full items-center justify-center rounded-xl border border-[var(--color-border)] bg-slate-50 text-sm text-[var(--color-muted)] sm:h-80">
        กำลังโหลดแผนที่...
      </div>
    ),
  }
);

type PaymentMethod = "PROMPTPAY" | "BANK_TRANSFER" | "COD";

export function CheckoutContent({ settings }: { settings: StoreSettingsData }) {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clear);
  const addToast = useToastStore((s) => s.addToast);
  const liff = useLiff();

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [pinLocation, setPinLocation] = useState<LatLng | null>(null);
  const [mapAddressDetail, setMapAddressDetail] = useState("");
  const [orderNote, setOrderNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("PROMPTPAY");

  const [couponInput, setCouponInput] = useState("");
  const [couponApplied, setCouponApplied] = useState<{ code: string; discount: number } | null>(
    null
  );
  const [couponMessage, setCouponMessage] = useState<string | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  const [slipPreview, setSlipPreview] = useState<string | null>(null);
  const [slipUrl, setSlipUrl] = useState<string | null>(null);
  const [slipUploading, setSlipUploading] = useState(false);

  const [promptPayQr, setPromptPayQr] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Prefill from LINE profile once available, without clobbering user edits
  useEffect(() => {
    if (liff.profile?.displayName && !customerName) {
      setCustomerName(liff.profile.displayName);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liff.profile]);

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + itemUnitPrice(i) * i.quantity, 0),
    [items]
  );
  const discount = couponApplied?.discount ?? 0;

  // Distance-based free delivery only ever applies when the customer has
  // pinned a location — no pin means no distance check, checkout behaves
  // exactly as before.
  const distanceFromStoreKm = pinLocation
    ? haversineDistanceKm(
        { lat: settings.storeLatitude, lng: settings.storeLongitude },
        pinLocation
      )
    : null;
  const isWithinFreeDeliveryRadius =
    distanceFromStoreKm != null && distanceFromStoreKm <= settings.freeDeliveryRadiusKm;

  const shippingFee = isWithinFreeDeliveryRadius
    ? 0
    : settings.freeShippingThreshold != null && subtotal >= settings.freeShippingThreshold
      ? 0
      : settings.shippingFlatRate;
  const total = Math.max(0, subtotal - discount + shippingFee);

  useEffect(() => {
    if (paymentMethod !== "PROMPTPAY" || total <= 0) {
      setPromptPayQr(null);
      return;
    }
    let cancelled = false;
    fetch(`/api/promptpay-qr?amount=${total}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setPromptPayQr(data.dataUrl ?? null);
      })
      .catch(() => {
        if (!cancelled) setPromptPayQr(null);
      });
    return () => {
      cancelled = true;
    };
  }, [paymentMethod, total]);

  async function handleApplyCoupon() {
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    setCouponMessage(null);
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponInput.trim(), subtotal }),
      });
      const data = await res.json();
      if (data.valid) {
        setCouponApplied({ code: couponInput.trim().toUpperCase(), discount: data.discount });
      } else {
        setCouponApplied(null);
      }
      setCouponMessage(data.message);
    } catch {
      setCouponMessage("ตรวจสอบโค้ดไม่สำเร็จ ลองใหม่อีกครั้ง");
    } finally {
      setCouponLoading(false);
    }
  }

  async function handleSlipChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setSlipPreview(URL.createObjectURL(file));
    setSlipUploading(true);
    setSlipUrl(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload/slip", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "อัปโหลดสลิปไม่สำเร็จ");
      setSlipUrl(data.url);
    } catch (err) {
      addToast(err instanceof Error ? err.message : "อัปโหลดสลิปไม่สำเร็จ", "error");
      setSlipPreview(null);
    } finally {
      setSlipUploading(false);
    }
  }

  async function handleSubmit() {
    setFormError(null);

    if (!customerName.trim() || !phone.trim() || !address.trim()) {
      setFormError("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }
    if (paymentMethod === "BANK_TRANSFER" && !slipUrl) {
      setFormError("กรุณาอัปโหลดสลิปการโอนเงิน");
      return;
    }
    if (items.length === 0) {
      setFormError("ตะกร้าสินค้าว่างเปล่า");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: customerName.trim(),
          phone: phone.trim(),
          address: address.trim(),
          latitude: pinLocation?.lat ?? null,
          longitude: pinLocation?.lng ?? null,
          mapAddressDetail: mapAddressDetail.trim() || null,
          note: orderNote.trim(),
          lineUserId: liff.profile?.userId ?? null,
          paymentMethod,
          paymentSlipUrl: slipUrl,
          couponCode: couponApplied?.code ?? null,
          items: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            selectedOptionValueIds: item.options.map((o) => o.valueId),
            note: item.note,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "สั่งซื้อไม่สำเร็จ");

      clearCart();
      router.push(`/order/success/${data.order.orderNumber}?phone=${encodeURIComponent(phone.trim())}`);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "สั่งซื้อไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      setSubmitting(false);
    }
  }

  if (!mounted) return null;

  if (items.length === 0) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-6 py-20 text-center">
        <p className="text-sm text-[var(--color-muted)]">ตะกร้าสินค้าว่างเปล่า</p>
        <Button onClick={() => router.push("/")}>เลือกซื้อสินค้า</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-4 py-4">
      <h1 className="text-lg font-bold text-slate-900">ข้อมูลจัดส่ง</h1>

      <div className="flex flex-col gap-3 rounded-2xl border border-[var(--color-border)] bg-white p-4">
        <Field label="ชื่อ-นามสกุล">
          <input
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="input"
            placeholder="ชื่อผู้รับสินค้า"
          />
        </Field>
        <Field label="เบอร์โทรศัพท์">
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="input"
            placeholder="08XXXXXXXX"
            inputMode="tel"
          />
        </Field>
        <Field label="ที่อยู่จัดส่ง">
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="input resize-none"
            rows={3}
            placeholder="บ้านเลขที่ ถนน ตำบล/แขวง อำเภอ/เขต จังหวัด รหัสไปรษณีย์"
          />
        </Field>
        <Field label="ปักหมุดตำแหน่งจัดส่ง (ถ้ามี)">
          <LocationMapPicker value={pinLocation} onChange={setPinLocation} />
          {distanceFromStoreKm != null && (
            <p
              className={`mt-1 text-sm font-medium ${
                isWithinFreeDeliveryRadius ? "text-success-500" : "text-slate-600"
              }`}
            >
              {isWithinFreeDeliveryRadius
                ? `🎉 อยู่ในเขตส่งฟรี! (ห่างจากร้าน ${distanceFromStoreKm.toFixed(1)} กม.)`
                : `ห่างจากร้าน ${distanceFromStoreKm.toFixed(1)} กม. (อยู่นอกเขตส่งฟรี)`}
            </p>
          )}
        </Field>
        <Field label="รายละเอียดเพิ่มเติมสำหรับตำแหน่งที่ปักหมุด (ถ้ามี)">
          <input
            value={mapAddressDetail}
            onChange={(e) => setMapAddressDetail(e.target.value)}
            className="input"
            placeholder="เช่น ชั้น 3 ห้อง 304, ประตูสีเขียว, ตึกด้านหลัง"
          />
        </Field>
        <Field label="หมายเหตุ (ถ้ามี)">
          <textarea
            value={orderNote}
            onChange={(e) => setOrderNote(e.target.value)}
            className="input resize-none"
            rows={2}
            placeholder="ระบุจุดสังเกต หรือคำแนะนำในการจัดส่ง"
          />
        </Field>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-slate-700">โค้ดส่วนลด</p>
        <div className="flex gap-2">
          <input
            value={couponInput}
            onChange={(e) => setCouponInput(e.target.value)}
            className="input flex-1"
            placeholder="กรอกโค้ดส่วนลด"
          />
          <Button variant="outline" onClick={handleApplyCoupon} disabled={couponLoading}>
            ใช้โค้ด
          </Button>
        </div>
        {couponMessage && (
          <p className={`mt-1 text-xs ${couponApplied ? "text-success-500" : "text-danger-500"}`}>
            {couponMessage}
          </p>
        )}
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-slate-700">วิธีชำระเงิน</p>
        <div className="flex flex-col gap-2">
          <PaymentOption
            id="PROMPTPAY"
            label="พร้อมเพย์ (สแกน QR)"
            selected={paymentMethod === "PROMPTPAY"}
            onSelect={() => setPaymentMethod("PROMPTPAY")}
          />
          <PaymentOption
            id="BANK_TRANSFER"
            label="โอนเข้าบัญชีธนาคาร"
            selected={paymentMethod === "BANK_TRANSFER"}
            onSelect={() => setPaymentMethod("BANK_TRANSFER")}
          />
          {settings.codEnabled && (
            <PaymentOption
              id="COD"
              label="เก็บเงินปลายทาง"
              selected={paymentMethod === "COD"}
              onSelect={() => setPaymentMethod("COD")}
            />
          )}
        </div>
      </div>

      {paymentMethod === "PROMPTPAY" && (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-white p-4">
          <p className="text-sm text-slate-600">สแกน QR เพื่อชำระเงิน {formatCurrency(total)}</p>
          {promptPayQr ? (
            <Image src={promptPayQr} alt="PromptPay QR" width={220} height={220} />
          ) : (
            <div className="flex h-[220px] w-[220px] items-center justify-center text-xs text-[var(--color-muted)]">
              กำลังสร้าง QR...
            </div>
          )}
          <p className="text-xs text-[var(--color-muted)]">
            พร้อมเพย์: {settings.promptpayId}
          </p>
        </div>
      )}

      {paymentMethod === "BANK_TRANSFER" && (
        <div className="flex flex-col gap-3 rounded-2xl border border-[var(--color-border)] bg-white p-4">
          <div className="text-sm text-slate-700">
            <p>ธนาคาร: {settings.bankName}</p>
            <p>เลขบัญชี: {settings.bankAccountNumber}</p>
            <p>ชื่อบัญชี: {settings.bankAccountName}</p>
            <p className="mt-1 font-semibold text-primary-600">
              ยอดโอน {formatCurrency(total)}
            </p>
          </div>
          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-[var(--color-border)] p-4 text-center">
            {slipPreview ? (
              <div className="relative h-40 w-full overflow-hidden rounded-lg">
                <Image src={slipPreview} alt="สลิปการโอนเงิน" fill className="object-contain" />
              </div>
            ) : (
              <span className="text-sm text-[var(--color-muted)]">แตะเพื่ออัปโหลดสลิปการโอนเงิน</span>
            )}
            <input type="file" accept="image/*" className="hidden" onChange={handleSlipChange} />
            {slipUploading && <span className="text-xs text-primary-500">กำลังอัปโหลด...</span>}
            {slipUrl && <span className="text-xs text-success-500">อัปโหลดสำเร็จ</span>}
          </label>
        </div>
      )}

      <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
        <div className="flex justify-between text-sm text-slate-600">
          <span>ยอดรวมสินค้า</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        {discount > 0 && (
          <div className="mt-1 flex justify-between text-sm text-success-500">
            <span>ส่วนลด</span>
            <span>-{formatCurrency(discount)}</span>
          </div>
        )}
        <div className="mt-1 flex justify-between text-sm text-slate-600">
          <span>ค่าจัดส่ง</span>
          <span>{shippingFee === 0 ? "ฟรี" : formatCurrency(shippingFee)}</span>
        </div>
        <div className="mt-2 flex justify-between border-t border-[var(--color-border)] pt-2 text-base font-bold text-slate-900">
          <span>ยอดรวมทั้งหมด</span>
          <span className="text-primary-600">{formatCurrency(total)}</span>
        </div>
      </div>

      {formError && (
        <p className="rounded-xl bg-danger-50 px-3 py-2 text-center text-sm text-danger-600">
          {formError}
        </p>
      )}

      <Button size="lg" fullWidth onClick={handleSubmit} disabled={submitting || slipUploading}>
        {submitting ? "กำลังสั่งซื้อ..." : "ยืนยันสั่งซื้อ"}
      </Button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      {children}
    </label>
  );
}

function PaymentOption({
  id,
  label,
  selected,
  onSelect,
}: {
  id: string;
  label: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex items-center gap-3 rounded-xl border p-3 text-left text-sm font-medium transition ${
        selected
          ? "border-primary-500 bg-primary-50 text-primary-700"
          : "border-[var(--color-border)] bg-white text-slate-600"
      }`}
    >
      <span
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
          selected ? "border-primary-500" : "border-slate-300"
        }`}
      >
        {selected && <span className="h-2 w-2 rounded-full bg-primary-500" />}
      </span>
      {label}
      <input type="radio" name="paymentMethod" checked={selected} readOnly className="hidden" id={id} />
    </button>
  );
}
