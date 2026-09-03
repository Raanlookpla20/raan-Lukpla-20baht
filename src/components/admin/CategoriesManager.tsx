"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToastStore } from "@/store/toast";

interface Category {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  productCount: number;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function CategoriesManager() {
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [editing, setEditing] = useState<Category | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const addToast = useToastStore((s) => s.addToast);

  async function load() {
    const res = await fetch("/api/admin/categories");
    const data = await res.json();
    setCategories(data.categories);
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setEditing(null);
    setName("");
    setSlug("");
    setSlugTouched(false);
    setShowForm(true);
  }

  function openEdit(cat: Category) {
    setEditing(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setSlugTouched(true);
    setShowForm(true);
  }

  async function handleSave() {
    if (!name.trim() || !slug.trim()) {
      addToast("กรุณากรอกชื่อและ slug", "error");
      return;
    }
    setSaving(true);
    try {
      const payload = { name: name.trim(), slug: slug.trim(), sortOrder: editing?.sortOrder ?? 0 };
      const res = await fetch(
        editing ? `/api/admin/categories/${editing.id}` : "/api/admin/categories",
        {
          method: editing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "บันทึกไม่สำเร็จ");
      addToast(editing ? "แก้ไขหมวดหมู่แล้ว" : "เพิ่มหมวดหมู่แล้ว");
      setShowForm(false);
      load();
    } catch (err) {
      addToast(err instanceof Error ? err.message : "บันทึกไม่สำเร็จ", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(cat: Category) {
    if (!confirm(`ลบหมวดหมู่ "${cat.name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/categories/${cat.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "ลบไม่สำเร็จ");
      addToast("ลบหมวดหมู่แล้ว");
      load();
    } catch (err) {
      addToast(err instanceof Error ? err.message : "ลบไม่สำเร็จ", "error");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-slate-900">หมวดหมู่สินค้า</h1>
        <Button size="sm" onClick={openCreate}>
          + เพิ่มหมวดหมู่
        </Button>
      </div>

      {showForm && (
        <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
          <p className="mb-3 text-sm font-semibold text-slate-700">
            {editing ? "แก้ไขหมวดหมู่" : "เพิ่มหมวดหมู่ใหม่"}
          </p>
          <div className="flex flex-col gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-slate-500">ชื่อหมวดหมู่</span>
              <input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!slugTouched) setSlug(slugify(e.target.value));
                }}
                className="input"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-slate-500">Slug</span>
              <input
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value);
                  setSlugTouched(true);
                }}
                className="input"
              />
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
        </div>
      )}

      {!categories ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center justify-between rounded-xl border border-[var(--color-border)] bg-white p-3"
            >
              <div>
                <p className="text-sm font-medium text-slate-800">{cat.name}</p>
                <p className="text-xs text-[var(--color-muted)]">
                  {cat.slug} · {cat.productCount} สินค้า
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => openEdit(cat)}
                  className="flex items-center justify-center rounded-full px-3 py-1 text-xs font-medium text-primary-600 hover:bg-primary-50 max-sm:min-h-11 max-sm:px-4"
                >
                  แก้ไข
                </button>
                <button
                  onClick={() => handleDelete(cat)}
                  className="flex items-center justify-center rounded-full px-3 py-1 text-xs font-medium text-danger-500 hover:bg-danger-50 max-sm:min-h-11 max-sm:px-4"
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
