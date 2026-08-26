"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useToastStore } from "@/store/toast";

interface OptionValueForm {
  label: string;
  priceDelta: number;
  stock: number;
  imageUrl?: string | null;
}
interface OptionGroupForm {
  name: string;
  useMainPrice: boolean;
  values: OptionValueForm[];
}
interface ImageForm {
  url: string;
}

interface ProductFormData {
  id?: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  categoryId: string;
  isActive: boolean;
  sortOrder: number;
  images: ImageForm[];
  optionGroups: OptionGroupForm[];
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

const emptyForm: ProductFormData = {
  name: "",
  slug: "",
  description: "",
  price: 0,
  compareAtPrice: null,
  stock: 0,
  categoryId: "",
  isActive: true,
  sortOrder: 0,
  images: [],
  optionGroups: [],
};

export function ProductForm({ initial }: { initial?: ProductFormData }) {
  const router = useRouter();
  const addToast = useToastStore((s) => s.addToast);
  const isEdit = Boolean(initial?.id);

  const [form, setForm] = useState<ProductFormData>(initial ?? emptyForm);
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [optionImageUploadingKey, setOptionImageUploadingKey] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then((data) => setCategories(data.categories));
  }, []);

  function update<K extends keyof ProductFormData>(key: K, value: ProductFormData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("folder", "products");
        const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "อัปโหลดไม่สำเร็จ");
        setForm((f) => ({ ...f, images: [...f.images, { url: data.url }] }));
      }
    } catch (err) {
      addToast(err instanceof Error ? err.message : "อัปโหลดไม่สำเร็จ", "error");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function removeImage(index: number) {
    setForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== index) }));
  }

  async function handleOptionImageUpload(gi: number, vi: number, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const key = `${gi}-${vi}`;
    setOptionImageUploadingKey(key);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "products");
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "อัปโหลดไม่สำเร็จ");
      updateOptionValue(gi, vi, { imageUrl: data.url });
    } catch (err) {
      addToast(err instanceof Error ? err.message : "อัปโหลดไม่สำเร็จ", "error");
    } finally {
      setOptionImageUploadingKey(null);
      e.target.value = "";
    }
  }

  function addOptionGroup() {
    setForm((f) => ({
      ...f,
      optionGroups: [
        ...f.optionGroups,
        {
          name: "",
          useMainPrice: true,
          values: [{ label: "", priceDelta: 0, stock: 0, imageUrl: null }],
        },
      ],
    }));
  }

  function removeOptionGroup(gi: number) {
    setForm((f) => ({ ...f, optionGroups: f.optionGroups.filter((_, i) => i !== gi) }));
  }

  function updateGroupName(gi: number, name: string) {
    setForm((f) => ({
      ...f,
      optionGroups: f.optionGroups.map((g, i) => (i === gi ? { ...g, name } : g)),
    }));
  }

  function updateGroupUseMainPrice(gi: number, useMainPrice: boolean) {
    setForm((f) => ({
      ...f,
      optionGroups: f.optionGroups.map((g, i) => (i === gi ? { ...g, useMainPrice } : g)),
    }));
  }

  function addOptionValue(gi: number) {
    setForm((f) => ({
      ...f,
      optionGroups: f.optionGroups.map((g, i) =>
        i === gi
          ? { ...g, values: [...g.values, { label: "", priceDelta: 0, stock: 0, imageUrl: null }] }
          : g
      ),
    }));
  }

  function removeOptionValue(gi: number, vi: number) {
    setForm((f) => ({
      ...f,
      optionGroups: f.optionGroups.map((g, i) =>
        i === gi ? { ...g, values: g.values.filter((_, j) => j !== vi) } : g
      ),
    }));
  }

  function updateOptionValue(gi: number, vi: number, patch: Partial<OptionValueForm>) {
    setForm((f) => ({
      ...f,
      optionGroups: f.optionGroups.map((g, i) =>
        i === gi
          ? { ...g, values: g.values.map((v, j) => (j === vi ? { ...v, ...patch } : v)) }
          : g
      ),
    }));
  }

  async function handleSubmit() {
    if (!form.name.trim() || !form.slug.trim() || !form.categoryId) {
      addToast("กรุณากรอกชื่อ, slug และเลือกหมวดหมู่", "error");
      return;
    }
    if (form.optionGroups.some((g) => !g.name.trim() || g.values.some((v) => !v.label.trim()))) {
      addToast("กรุณากรอกชื่อกลุ่มตัวเลือกและตัวเลือกให้ครบ", "error");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        images: form.images.map((img, i) => ({ url: img.url, sortOrder: i })),
      };
      const res = await fetch(isEdit ? `/api/admin/products/${form.id}` : "/api/admin/products", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "บันทึกไม่สำเร็จ");
      if (isEdit) {
        // Stay on the edit page so the admin can keep working on the same
        // product — only a fresh "new product" has nothing left to do here
        // and should land back on the list.
        addToast("บันทึกสำเร็จ");
      } else {
        addToast("เพิ่มสินค้าแล้ว");
        router.push("/admin/products");
        router.refresh();
      }
    } catch (err) {
      addToast(err instanceof Error ? err.message : "บันทึกไม่สำเร็จ", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-5 pb-10">
      <div className="flex flex-col gap-3 rounded-2xl border border-[var(--color-border)] bg-white p-4">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-slate-500">ชื่อสินค้า</span>
          <input
            value={form.name}
            onChange={(e) => {
              update("name", e.target.value);
              if (!slugTouched) update("slug", slugify(e.target.value));
            }}
            className="input"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-slate-500">Slug</span>
          <input
            value={form.slug}
            onChange={(e) => {
              update("slug", e.target.value);
              setSlugTouched(true);
            }}
            className="input"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-slate-500">รายละเอียดสินค้า</span>
          <textarea
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            className="input resize-none"
            rows={3}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-slate-500">หมวดหมู่</span>
          <select
            value={form.categoryId}
            onChange={(e) => update("categoryId", e.target.value)}
            className="input"
          >
            <option value="">เลือกหมวดหมู่</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-500">ราคา (บาท)</span>
            <input
              type="number"
              value={form.price}
              onChange={(e) => update("price", Number(e.target.value))}
              className="input"
              min={0}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-500">ราคาก่อนลด (ถ้ามี)</span>
            <input
              type="number"
              value={form.compareAtPrice ?? ""}
              onChange={(e) =>
                update("compareAtPrice", e.target.value === "" ? null : Number(e.target.value))
              }
              className="input"
              min={0}
            />
          </label>
        </div>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-slate-500">
            สต๊อก {form.optionGroups.length > 0 && "(ไม่ใช้ถ้ามีตัวเลือกสินค้า)"}
          </span>
          <input
            type="number"
            value={form.stock}
            onChange={(e) => update("stock", Number(e.target.value))}
            className="input"
            min={0}
            disabled={form.optionGroups.length > 0}
          />
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => update("isActive", e.target.checked)}
            className="h-4 w-4"
          />
          <span className="text-sm text-slate-700">เปิดขาย (แสดงในหน้าร้าน)</span>
        </label>
      </div>

      <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
        <p className="mb-3 text-sm font-semibold text-slate-700">รูปภาพสินค้า</p>
        <div className="flex flex-wrap gap-2">
          {form.images.map((img, i) => (
            <div key={img.url + i} className="relative h-20 w-20 overflow-hidden rounded-lg border">
              <Image src={img.url} alt="" fill sizes="80px" className="object-cover" />
              <button
                onClick={() => removeImage(i)}
                className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-xs text-white"
              >
                ✕
              </button>
            </div>
          ))}
          <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-[var(--color-border)] text-xs text-[var(--color-muted)]">
            {uploading ? "..." : "+ เพิ่มรูป"}
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleImageUpload}
            />
          </label>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-700">ตัวเลือกสินค้า (ถ้ามี)</p>
          <Button size="sm" variant="outline" onClick={addOptionGroup}>
            + เพิ่มกลุ่มตัวเลือก
          </Button>
        </div>
        <div className="flex flex-col gap-4">
          {form.optionGroups.map((group, gi) => (
            <div key={gi} className="rounded-xl border border-[var(--color-border)] p-3">
              <div className="mb-2 flex items-center gap-2">
                <input
                  value={group.name}
                  onChange={(e) => updateGroupName(gi, e.target.value)}
                  placeholder="ชื่อกลุ่ม เช่น สี, ไซซ์"
                  className="input flex-1"
                />
                <button onClick={() => removeOptionGroup(gi)} className="text-xs text-danger-500">
                  ลบกลุ่ม
                </button>
              </div>
              <label className="mb-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={group.useMainPrice}
                  onChange={(e) => updateGroupUseMainPrice(gi, e.target.checked)}
                  className="h-4 w-4"
                />
                <span className="text-xs text-slate-600">
                  ทุกตัวเลือกราคาเท่ากับราคาสินค้าหลัก
                </span>
              </label>
              <div className="flex flex-col gap-3">
                {group.values.map((value, vi) => (
                  <div key={vi} className="flex flex-col gap-2 rounded-lg border border-[var(--color-border)] p-2">
                    <div className="flex items-end gap-2">
                      <label className="flex flex-1 flex-col gap-1">
                        <span className="text-xs font-medium text-slate-500">ชื่อสี/ตัวเลือก</span>
                        <input
                          type="text"
                          value={value.label}
                          onChange={(e) => updateOptionValue(gi, vi, { label: e.target.value })}
                          placeholder="เช่น แดง"
                          className="input"
                        />
                      </label>
                      <label className="flex w-28 flex-col gap-1">
                        <span className="text-xs font-medium text-slate-500">จำนวนสต๊อก</span>
                        <input
                          type="number"
                          value={value.stock}
                          onChange={(e) => updateOptionValue(gi, vi, { stock: Number(e.target.value) })}
                          placeholder="เช่น 3"
                          className="input"
                          min={0}
                        />
                      </label>
                      {!group.useMainPrice && (
                        <label className="flex w-28 flex-col gap-1">
                          <span className="text-xs font-medium text-slate-500">ราคา (บาท)</span>
                          <input
                            type="number"
                            value={form.price + value.priceDelta}
                            onChange={(e) =>
                              updateOptionValue(gi, vi, {
                                priceDelta: Number(e.target.value) - form.price,
                              })
                            }
                            placeholder="เช่น 150"
                            className="input"
                            min={0}
                          />
                        </label>
                      )}
                      <button
                        onClick={() => removeOptionValue(gi, vi)}
                        className="mb-2.5 text-xs text-danger-500"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      {value.imageUrl ? (
                        <div className="relative h-12 w-12 overflow-hidden rounded-lg border">
                          <Image src={value.imageUrl} alt="" fill sizes="48px" className="object-cover" />
                          <button
                            onClick={() => updateOptionValue(gi, vi, { imageUrl: null })}
                            className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-full bg-black/60 text-[10px] text-white"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <label className="flex h-12 w-12 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-[var(--color-border)] text-center text-[9px] leading-tight text-[var(--color-muted)]">
                          {optionImageUploadingKey === `${gi}-${vi}` ? "..." : "+ รูป"}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleOptionImageUpload(gi, vi, e)}
                          />
                        </label>
                      )}
                      <span className="text-xs text-[var(--color-muted)]">
                        รูปเฉพาะตัวเลือกนี้ (ไม่บังคับ ถ้าไม่ใส่จะใช้รูปสินค้าปกติ)
                      </span>
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => addOptionValue(gi)}
                  className="self-start text-xs text-primary-600"
                >
                  + เพิ่มตัวเลือก
                </button>
              </div>
            </div>
          ))}
          {form.optionGroups.length === 0 && (
            <p className="text-xs text-[var(--color-muted)]">ไม่มีตัวเลือกสินค้า (ใช้สต๊อกรวมด้านบน)</p>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <Button fullWidth onClick={handleSubmit} disabled={saving || uploading}>
          {saving ? "กำลังบันทึก..." : "บันทึกสินค้า"}
        </Button>
      </div>
    </div>
  );
}
