"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { useCartStore } from "@/store/cart";
import { useToastStore } from "@/store/toast";
import { ProductGallery } from "@/components/storefront/ProductGallery";

interface OptionValue {
  id: string;
  label: string;
  priceDelta: number;
  stock: number;
  imageUrl: string | null;
}

interface OptionGroup {
  id: string;
  name: string;
  values: OptionValue[];
}

export interface ProductDetailData {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  images: { id: string; url: string }[];
  optionGroups: OptionGroup[];
}

const LOW_STOCK_THRESHOLD = 5;

export function ProductDetailClient({ product }: { product: ProductDetailData }) {
  // No group starts pre-selected: the customer must actively choose every
  // group before the price/stock/add-to-cart button reflect a real variant.
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [lastChangedGroupId, setLastChangedGroupId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("");

  const addItem = useCartStore((s) => s.addItem);
  const addToast = useToastStore((s) => s.addToast);

  const groupsWithValues = useMemo(
    () => product.optionGroups.filter((g) => g.values.length > 0),
    [product.optionGroups]
  );

  const selectedValues = useMemo(() => {
    return groupsWithValues
      .map((group) => {
        const valueId = selected[group.id];
        const value = group.values.find((v) => v.id === valueId);
        return value ? { group, value } : null;
      })
      .filter((x): x is { group: OptionGroup; value: OptionValue } => x !== null);
  }, [selected, groupsWithValues]);

  const missingGroups = useMemo(
    () => groupsWithValues.filter((g) => !selected[g.id]),
    [groupsWithValues, selected]
  );
  const allSelected = missingGroups.length === 0;

  const availableStock = useMemo(() => {
    if (groupsWithValues.length === 0) return product.stock;
    if (!allSelected) return 0;
    return Math.min(...selectedValues.map((sv) => sv.value.stock));
  }, [groupsWithValues.length, allSelected, selectedValues, product.stock]);

  const unitPrice = useMemo(() => {
    return product.price + selectedValues.reduce((sum, sv) => sum + sv.value.priceDelta, 0);
  }, [product.price, selectedValues]);

  const soldOut = allSelected && availableStock <= 0;

  const activeOptionImage = useMemo(() => {
    if (lastChangedGroupId) {
      const lastChanged = selectedValues.find((sv) => sv.group.id === lastChangedGroupId);
      if (lastChanged?.value.imageUrl) return lastChanged.value.imageUrl;
    }
    const withImage = selectedValues.find((sv) => sv.value.imageUrl);
    return withImage?.value.imageUrl ?? null;
  }, [selectedValues, lastChangedGroupId]);

  function handleSelectOption(groupId: string, valueId: string) {
    setSelected((prev) => ({ ...prev, [groupId]: valueId }));
    setLastChangedGroupId(groupId);
    setQuantity(1);
  }

  function handleAddToCart() {
    if (!allSelected || soldOut) return;
    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: product.images[0]?.url ?? null,
      basePrice: product.price,
      options: selectedValues.map((sv) => ({
        groupId: sv.group.id,
        groupName: sv.group.name,
        valueId: sv.value.id,
        valueLabel: sv.value.label,
        priceDelta: sv.value.priceDelta,
      })),
      quantity,
      note,
      maxStock: availableStock,
    });
    addToast(`เพิ่ม "${product.name}" ลงตะกร้าแล้ว`);
    setQuantity(1);
    setNote("");
  }

  const addToCartLabel = !allSelected
    ? `กรุณาเลือก ${missingGroups.map((g) => g.name).join(", ")}`
    : soldOut
      ? "สินค้าหมด"
      : `เพิ่มลงตะกร้า · ${formatCurrency(unitPrice * quantity)}`;

  return (
    <div className="mx-auto grid max-w-5xl gap-6 px-4 py-4 sm:grid-cols-2">
      <ProductGallery images={product.images} productName={product.name} overrideUrl={activeOptionImage} />

      <div className="flex flex-col gap-5">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{product.name}</h1>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-primary-600">{formatCurrency(unitPrice)}</span>
            {product.compareAtPrice && (
              <span className="text-sm text-slate-400 line-through">
                {formatCurrency(product.compareAtPrice)}
              </span>
            )}
          </div>
          {!allSelected ? (
            <p className="mt-1 text-sm text-[var(--color-muted)]">เลือกตัวเลือกเพื่อดูราคาและสต๊อกที่แน่นอน</p>
          ) : soldOut ? (
            <p className="mt-1 text-sm font-medium text-danger-600">สินค้าหมด</p>
          ) : availableStock <= LOW_STOCK_THRESHOLD ? (
            <p className="mt-1 text-sm font-medium text-warning-500">เหลือ {availableStock} ชิ้น</p>
          ) : (
            <p className="mt-1 text-sm text-[var(--color-muted)]">พร้อมส่ง</p>
          )}
        </div>

        {groupsWithValues.map((group) => (
          <div key={group.id}>
            <p className="mb-2 text-sm font-semibold text-slate-700">
              {group.name}
              {!selected[group.id] && <span className="ml-1 text-xs font-normal text-danger-500">* ยังไม่ได้เลือก</span>}
            </p>
            <div className="flex flex-wrap gap-2">
              {group.values.map((value) => {
                const isSelected = selected[group.id] === value.id;
                const isOut = value.stock <= 0;
                return (
                  <button
                    key={value.id}
                    disabled={isOut}
                    onClick={() => handleSelectOption(group.id, value.id)}
                    className={clsx(
                      "rounded-full border px-4 py-2 text-sm font-medium transition",
                      isOut && "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300 line-through",
                      !isOut &&
                        isSelected &&
                        "border-primary-500 bg-primary-50 text-primary-700",
                      !isOut &&
                        !isSelected &&
                        "border-[var(--color-border)] bg-white text-slate-600 hover:border-primary-300"
                    )}
                  >
                    {value.label}
                    {value.priceDelta > 0 && ` (+${formatCurrency(value.priceDelta)})`}
                    {isOut && " (หมด)"}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        <div>
          <p className="mb-2 text-sm font-semibold text-slate-700">จำนวน</p>
          <div className="flex w-fit items-center rounded-full border border-[var(--color-border)]">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={!allSelected || soldOut}
              className="flex h-10 w-10 items-center justify-center text-lg text-slate-600 disabled:opacity-40"
            >
              −
            </button>
            <span className="w-10 text-center text-sm font-medium">{quantity}</span>
            <button
              onClick={() => setQuantity((q) => Math.min(availableStock, q + 1))}
              disabled={!allSelected || soldOut || quantity >= availableStock}
              className="flex h-10 w-10 items-center justify-center text-lg text-slate-600 disabled:opacity-40"
            >
              +
            </button>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            หมายเหตุเพิ่มเติม (ถ้ามี)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={300}
            rows={2}
            placeholder="เช่น ต้องการสีเข้มหน่อย, ห่อของขวัญ"
            className="w-full resize-none rounded-xl border border-[var(--color-border)] p-3 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
          />
        </div>

        <Button size="lg" fullWidth disabled={!allSelected || soldOut} onClick={handleAddToCart}>
          {addToCartLabel}
        </Button>

        {product.description && (
          <div>
            <p className="mb-1 text-sm font-semibold text-slate-700">รายละเอียดสินค้า</p>
            <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600">
              {product.description}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
