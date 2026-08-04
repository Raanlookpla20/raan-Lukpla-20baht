"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { useCartStore } from "@/store/cart";
import { useToastStore } from "@/store/toast";

interface OptionValue {
  id: string;
  label: string;
  priceDelta: number;
  stock: number;
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
  image: string | null;
  optionGroups: OptionGroup[];
}

const LOW_STOCK_THRESHOLD = 5;

export function ProductDetailClient({ product }: { product: ProductDetailData }) {
  const [selected, setSelected] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const group of product.optionGroups) {
      if (group.values.length > 0) initial[group.id] = group.values[0].id;
    }
    return initial;
  });
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("");

  const addItem = useCartStore((s) => s.addItem);
  const addToast = useToastStore((s) => s.addToast);

  const selectedValues = useMemo(() => {
    return product.optionGroups
      .map((group) => {
        const valueId = selected[group.id];
        const value = group.values.find((v) => v.id === valueId);
        return value ? { group, value } : null;
      })
      .filter((x): x is { group: OptionGroup; value: OptionValue } => x !== null);
  }, [selected, product.optionGroups]);

  const availableStock = useMemo(() => {
    if (selectedValues.length === 0) return product.stock;
    return Math.min(...selectedValues.map((sv) => sv.value.stock));
  }, [selectedValues, product.stock]);

  const unitPrice = useMemo(() => {
    return product.price + selectedValues.reduce((sum, sv) => sum + sv.value.priceDelta, 0);
  }, [product.price, selectedValues]);

  const soldOut = availableStock <= 0;

  function handleSelectOption(groupId: string, valueId: string) {
    setSelected((prev) => ({ ...prev, [groupId]: valueId }));
    setQuantity(1);
  }

  function handleAddToCart() {
    if (soldOut) return;
    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: product.image,
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

  return (
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
        {soldOut ? (
          <p className="mt-1 text-sm font-medium text-danger-600">สินค้าหมด</p>
        ) : availableStock <= LOW_STOCK_THRESHOLD ? (
          <p className="mt-1 text-sm font-medium text-warning-500">เหลือ {availableStock} ชิ้น</p>
        ) : (
          <p className="mt-1 text-sm text-[var(--color-muted)]">พร้อมส่ง</p>
        )}
      </div>

      {product.optionGroups.map((group) => (
        <div key={group.id}>
          <p className="mb-2 text-sm font-semibold text-slate-700">{group.name}</p>
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
            disabled={soldOut}
            className="flex h-10 w-10 items-center justify-center text-lg text-slate-600 disabled:opacity-40"
          >
            −
          </button>
          <span className="w-10 text-center text-sm font-medium">{quantity}</span>
          <button
            onClick={() => setQuantity((q) => Math.min(availableStock, q + 1))}
            disabled={soldOut || quantity >= availableStock}
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

      <Button size="lg" fullWidth disabled={soldOut} onClick={handleAddToCart}>
        {soldOut ? "สินค้าหมด" : `เพิ่มลงตะกร้า · ${formatCurrency(unitPrice * quantity)}`}
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
  );
}
