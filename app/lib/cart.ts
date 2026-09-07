"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Product, Variant } from "./types/catalog";

export interface CartItem {
  id: string; // unique key e.g. `${product.id}-${variant.id}`
  product: Product;
  variant: Variant;
  quantity: number;
}

export interface Coupon {
  code: string;
  discountType: "percent" | "fixed";
  discountValue: number; // e.g. 10 for 10% or 50000 for 50k Toman
  minOrderAmount: number;
}

interface CartState {
  items: CartItem[];
  appliedCoupon: Coupon | null;
  addItem: (product: Product, variant: Variant, quantity?: number) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  applyCoupon: (code: string) => { success: boolean; message: string };
  removeCoupon: () => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getRawSubtotal: () => number; // Sum of base or sale prices
  getDiscountAmount: () => number;
  getFinalTotal: () => number;
}

const MOCK_COUPONS: Coupon[] = [
  { code: "MINI10", discountType: "percent", discountValue: 10, minOrderAmount: 200000 },
  { code: "ROYAL50", discountType: "fixed", discountValue: 50000, minOrderAmount: 400000 },
  { code: "WELCOME", discountType: "percent", discountValue: 15, minOrderAmount: 0 },
];

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      appliedCoupon: null,

      addItem: (product, variant, quantity = 1) => {
        if (quantity <= 0 || variant.stock <= 0) return;
        const itemId = `${product.id}-${variant.id}`;
        const existingItems = get().items;
        const existingIndex = existingItems.findIndex((i) => i.id === itemId);
        const currentQuantity = existingIndex > -1 ? existingItems[existingIndex].quantity : 0;
        const nextQuantity = Math.min(variant.stock, currentQuantity + quantity);
        if (nextQuantity <= currentQuantity) return;

        if (existingIndex > -1) {
          const updated = [...existingItems];
          updated[existingIndex] = { ...updated[existingIndex], quantity: nextQuantity };
          set({ items: updated });
        } else {
          set({
            items: [...existingItems, { id: itemId, product, variant, quantity: nextQuantity }],
          });
        }
      },

      removeItem: (itemId) => {
        set({ items: get().items.filter((i) => i.id !== itemId) });
      },

      updateQuantity: (itemId, quantity) => {
        const item = get().items.find((entry) => entry.id === itemId);
        if (!item || quantity <= 0) {
          get().removeItem(itemId);
          return;
        }
        set({
          items: get().items.map((i) => (i.id === itemId ? { ...i, quantity: Math.min(quantity, i.variant.stock) } : i)),
        });
      },

      applyCoupon: (code) => {
        const cleanCode = code.trim().toUpperCase();
        const found = MOCK_COUPONS.find((c) => c.code === cleanCode);

        if (!found) {
          return { success: false, message: "کد تخفیف وارد شده معتبر نیست." };
        }

        const subtotal = get().getRawSubtotal();
        if (subtotal < found.minOrderAmount) {
          return {
            success: false,
            message: `حداقل مبلغ سفارش برای این کد ${found.minOrderAmount.toLocaleString("fa-IR")} تومان است.`,
          };
        }

        set({ appliedCoupon: found });
        return { success: true, message: "کد تخفیف با موفقیت اعمال شد! 🎉" };
      },

      removeCoupon: () => set({ appliedCoupon: null }),

      clearCart: () => set({ items: [], appliedCoupon: null }),

      getTotalItems: () => get().items.reduce((sum, item) => sum + item.quantity, 0),

      getRawSubtotal: () =>
        get().items.reduce((sum, item) => {
          const unitPrice = item.product.salePrice ?? item.product.basePrice;
          return sum + (unitPrice + item.variant.priceAdjustment) * item.quantity;
        }, 0),

      getDiscountAmount: () => {
        const subtotal = get().getRawSubtotal();
        const coupon = get().appliedCoupon;
        if (!coupon) return 0;

        if (coupon.discountType === "percent") {
          return Math.round((subtotal * coupon.discountValue) / 100);
        } else {
          return Math.min(subtotal, coupon.discountValue);
        }
      },

      getFinalTotal: () => {
        const subtotal = get().getRawSubtotal();
        const discount = get().getDiscountAmount();
        return Math.max(0, subtotal - discount);
      },
    }),
    {
      name: "miniroyal-cart-storage",
    }
  )
);
