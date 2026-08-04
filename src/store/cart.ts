"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItemOption {
  groupId: string;
  groupName: string;
  valueId: string;
  valueLabel: string;
  priceDelta: number;
}

export interface CartItem {
  /** Stable identity for a cart line = productId + sorted selected option value ids */
  lineId: string;
  productId: string;
  slug: string;
  name: string;
  image: string | null;
  basePrice: number;
  options: CartItemOption[];
  quantity: number;
  note: string;
  /** Stock available for this exact option combination, used to clamp quantity client-side */
  maxStock: number;
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "lineId">) => void;
  removeItem: (lineId: string) => void;
  updateQuantity: (lineId: string, quantity: number) => void;
  updateNote: (lineId: string, note: string) => void;
  clear: () => void;
}

export function buildLineId(productId: string, optionValueIds: string[]): string {
  return `${productId}::${[...optionValueIds].sort().join(",")}`;
}

export function itemUnitPrice(item: Pick<CartItem, "basePrice" | "options">): number {
  return item.basePrice + item.options.reduce((sum, o) => sum + o.priceDelta, 0);
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (newItem) => {
        const lineId = buildLineId(
          newItem.productId,
          newItem.options.map((o) => o.valueId)
        );
        const items = get().items;
        const existing = items.find((i) => i.lineId === lineId);

        if (existing) {
          const nextQuantity = Math.min(
            existing.quantity + newItem.quantity,
            existing.maxStock
          );
          set({
            items: items.map((i) =>
              i.lineId === lineId ? { ...i, quantity: nextQuantity } : i
            ),
          });
        } else {
          set({
            items: [
              ...items,
              { ...newItem, lineId, quantity: Math.min(newItem.quantity, newItem.maxStock) },
            ],
          });
        }
      },

      removeItem: (lineId) => {
        set({ items: get().items.filter((i) => i.lineId !== lineId) });
      },

      updateQuantity: (lineId, quantity) => {
        set({
          items: get().items.map((i) =>
            i.lineId === lineId
              ? { ...i, quantity: Math.max(1, Math.min(quantity, i.maxStock)) }
              : i
          ),
        });
      },

      updateNote: (lineId, note) => {
        set({
          items: get().items.map((i) => (i.lineId === lineId ? { ...i, note } : i)),
        });
      },

      clear: () => set({ items: [] }),
    }),
    { name: "shop-cart" }
  )
);
