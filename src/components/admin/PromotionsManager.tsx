"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToastStore } from "@/store/toast";
import { formatCurrency, formatDate } from "@/lib/format";

interface Promotion {
  id: string;
  type: "PRODUCT_DISCOUNT" | "COUPON";
  code: string | null;
  discountType: "PERCENT" | "FIXED";
  value: number;
  minOrderAmount: number | null;
  maxUses: number | null;
  usedCount: number;
  expiresAt: string | null;
  isActive: boolean;
  productId: string | null;
  product: { id: string; name: string } | null;
}

interface FormState {
  id?: string;
  type: "PRODUCT_DISCOUNT" | "COUPON";
  code: string;
  discountType: "PERCENT" | "FIXED";
  value: number;
  minOrderAmount: string;
  maxUses: string;
  expiresAt: string;
  isActive: boolean;
  productId: string;
}

const emptyForm: FormState = {
  type: "COUPON",
  code: "",
  discountType: "PERCENT",
  value: 10,
  minOrderAmount: "",
  maxUses: "",
  expiresAt: "",
  isActive: true,
  productId: "",
};

export function PromotionsManager() {
  const [promotions, setPromotions] = useState<Promotion[] | null>(null);
  const [products, setProducts] = useState<{ id: string; name: string }[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const addToast = useToastStore((s) => s.addToast);

  async function load() {
    const res = await fetch("/api/admin/promotions");
    const data = await res.json();
    setPromotions(data.promotions);
  }

  useEffect(() => {
    load();
    fetch("/api/admin/products/lookup")
      .then((r) => r.json())
      .then((data) => setProducts(data.products));
  }, []);

  function openCreate() {
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEdit(promo: Promotion) {
    setForm({
      id: promo.id,
      type: promo.type,
      code: promo.code ?? "",
      discountType: promo.discountType,
      value: promo.value,
      minOrderAmount: promo.minOrderAmount != null ? String(promo.minOrderAmount) : "",
      maxUses: promo.maxUses != null ? String(promo.maxUses) : "",
      expiresAt: promo.expiresAt ? promo.expiresAt.slice(0, 10) : "",
      isActive: promo.isActive,
      productId: promo.productId ?? "",
    });
    setShowForm(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload = {
        type: form.type,
        code: form.type === "COUPON" ? form.code.trim() || null : null,
        discountType: form.discountType,
        value: form.value,
        minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : null,
        maxUses: form.maxUses ? Number(form.maxUses) : null,
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
        isActive: form.isActive,
        productId: form.type === "PRODUCT_DISCOUNT" ? form.productId || null : null,
      };
      const res = await fetch(
        form.id ? `/api/admin/promotions/${form.id}` : "/api/admin/promotions",
        {
          method: form.id ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "บันทึกไม่สำเร็จ");
      addToast(form.id ? "แก้ไขโปรโมชั่นแล้ว" : "เพิ่มโปรโมชั่นแล้ว");
      setShowForm(false);
      load();
    } catch (err) {
      addToast(err instanceof Error ? err.message : "บันทึกไม่สำเร็จ", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(promo: Promotion) {
    if (!confirm("ลบโปรโมชั่นนี้?")) return;
    try {
      const res = await fetch(`/api/admin/promotions/${promo.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      addToast("ลบโปรโมชั่นแล้ว");
      load();
    } catch {
      addToast("ลบไม่สำเร็จ", "error");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-slate-900">โปรโมชั่น</h1>
        <Button size="sm" onClick={openCreate}>
          + เพิ่มโปรโมชั่น
        </Button>
      </div>

      {showForm && (
        <div className="flex flex-col gap-3 rounded-2xl border border-[var(--color-border)] bg-white p-4">
          <div className="flex gap-2">
            {(["COUPON", "PRODUCT_DISCOUNT"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setForm((f) => ({ ...f, type: t }))}
                className={clsx(
                  "flex-1 rounded-full py-2 text-sm font-medium",
                  form.type === t ? "bg-primary-500 text-white" : "bg-slate-100 text-slate-600"
                )}
              >
                {t === "COUPON" ? "โค้ดส่วนลด" : "ลดราคาสินค้า"}
              </button>
            ))}
          </div>

          {form.type === "COUPON" ? (
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-slate-500">โค้ดส่วนลด</span>
              <input
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                className="input"
                placeholder="เช่น SAVE20"
              />
            </label>
          ) : (
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-slate-500">สินค้า</span>
              <select
                value={form.productId}
                onChange={(e) => setForm((f) => ({ ...f, productId: e.target.value }))}
                className="input"
              >
                <option value="">เลือกสินค้า</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-slate-500">ประเภทส่วนลด</span>
              <select
                value={form.discountType}
                onChange={(e) =>
                  setForm((f) => ({ ...f, discountType: e.target.value as "PERCENT" | "FIXED" }))
                }
                className="input"
              >
                <option value="PERCENT">เปอร์เซ็นต์ (%)</option>
                <option value="FIXED">จำนวนเงิน (บาท)</option>
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-slate-500">มูลค่าส่วนลด</span>
              <input
                type="number"
                value={form.value}
                onChange={(e) => setForm((f) => ({ ...f, value: Number(e.target.value) }))}
                className="input"
                min={0}
              />
            </label>
          </div>

          {form.type === "COUPON" && (
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-slate-500">ยอดขั้นต่ำ (ถ้ามี)</span>
                <input
                  type="number"
                  value={form.minOrderAmount}
                  onChange={(e) => setForm((f) => ({ ...f, minOrderAmount: e.target.value }))}
                  className="input"
                  min={0}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-slate-500">จำนวนครั้งที่ใช้ได้ (ถ้ามี)</span>
                <input
                  type="number"
                  value={form.maxUses}
                  onChange={(e) => setForm((f) => ({ ...f, maxUses: e.target.value }))}
                  className="input"
                  min={0}
                />
              </label>
            </div>
          )}

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-500">วันหมดอายุ (ถ้ามี)</span>
            <input
              type="date"
              value={form.expiresAt}
              onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
              className="input"
            />
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
              className="h-4 w-4"
            />
            <span className="text-sm text-slate-700">เปิดใช้งาน</span>
          </label>

          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving}>
              บันทึก
            </Button>
            <Button variant="outline" onClick={() => setShowForm(false)}>
              ยกเลิก
            </Button>
          </div>
        </div>
      )}

      {!promotions ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : promotions.length === 0 ? (
        <p className="py-10 text-center text-sm text-[var(--color-muted)]">ยังไม่มีโปรโมชั่น</p>
      ) : (
        <div className="flex flex-col gap-2">
          {promotions.map((promo) => (
            <div
              key={promo.id}
              className="flex items-center justify-between rounded-xl border border-[var(--color-border)] bg-white p-3"
            >
              <div>
                <p className="text-sm font-medium text-slate-800">
                  {promo.type === "COUPON" ? promo.code : promo.product?.name ?? "สินค้าถูกลบแล้ว"}
                </p>
                <p className="text-xs text-[var(--color-muted)]">
                  ลด {promo.discountType === "PERCENT" ? `${promo.value}%` : formatCurrency(promo.value)}
                  {promo.type === "COUPON" && promo.maxUses != null && (
                    <> · ใช้แล้ว {promo.usedCount}/{promo.maxUses}</>
                  )}
                  {promo.expiresAt && <> · หมดอายุ {formatDate(promo.expiresAt)}</>}
                </p>
                <span
                  className={clsx(
                    "mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium",
                    promo.isActive ? "bg-success-500/10 text-success-500" : "bg-slate-200 text-slate-500"
                  )}
                >
                  {promo.isActive ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                </span>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  onClick={() => openEdit(promo)}
                  className="rounded-full px-3 py-1 text-xs font-medium text-primary-600 hover:bg-primary-50"
                >
                  แก้ไข
                </button>
                <button
                  onClick={() => handleDelete(promo)}
                  className="rounded-full px-3 py-1 text-xs font-medium text-danger-500 hover:bg-danger-50"
                >
                  ลบ
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
