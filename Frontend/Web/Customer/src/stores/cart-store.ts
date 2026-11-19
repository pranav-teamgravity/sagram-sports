import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Size } from "@/lib/catalog";

export interface CartItem {
  productId: string;
  size: Size;
  quantity: number;
  /** Optional name and number print */
  printName?: string;
  printNumber?: string;
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (key: string) => void;
}

export const cartItemKey = (i: Omit<CartItem, "quantity">) =>
  [i.productId, i.size, i.printName ?? "", i.printNumber ?? ""].join("|");

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item) =>
        set((state) => {
          const key = cartItemKey(item);
          const existing = state.items.find((i) => cartItemKey(i) === key);
          if (existing) {
            return {
              items: state.items.map((i) =>
                cartItemKey(i) === key ? { ...i, quantity: Math.min(i.quantity + 1, 10) } : i,
              ),
            };
          }
          return { items: [...state.items, { ...item, quantity: 1 }] };
        }),
      removeItem: (key) =>
        set((state) => ({ items: state.items.filter((i) => cartItemKey(i) !== key) })),
    }),
    { name: "sagram-cart", version: 1 },
  ),
);

export const selectCartCount = (s: CartState) =>
  s.items.reduce((sum, i) => sum + i.quantity, 0);
