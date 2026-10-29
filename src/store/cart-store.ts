"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { moneyToCents } from "@/lib/money";
import type { BigIntId, Money, ProductType } from "@/types/domain";

export interface CartAdditional {
  id: BigIntId;
  nome: string;
  preco: Money;
  quantidade: number;
}

export interface CartItem {
  key: string;
  produtoId: BigIntId;
  nome: string;
  tipo: ProductType;
  precoBase: Money;
  quantidade: number;
  pao?: { id: BigIntId; nome: string; acrescimo: Money } | null;
  adicionais: CartAdditional[];
  observacoes?: string;
}

function itemKey(item: Omit<CartItem, "key" | "quantidade">) {
  const additions = [...item.adicionais].sort((a, b) => a.id.localeCompare(b.id)).map((a) => `${a.id}:${a.quantidade}`).join("|");
  return [item.produtoId, item.pao?.id || "sem-pao", additions, item.observacoes?.trim() || ""].join("::");
}

interface CartState {
  items: CartItem[];
  hydrated: boolean;
  addItem: (item: Omit<CartItem, "key">) => void;
  updateQuantity: (key: string, quantity: number) => void;
  removeItem: (key: string) => void;
  clear: () => void;
  setHydrated: (hydrated: boolean) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      hydrated: false,
      addItem: (item) =>
        set((state) => {
          const key = itemKey(item);
          const existing = state.items.find((entry) => entry.key === key);
          if (existing) {
            return { items: state.items.map((entry) => entry.key === key ? { ...entry, quantidade: Math.min(50, entry.quantidade + item.quantidade) } : entry) };
          }
          return { items: [...state.items, { ...item, key }] };
        }),
      updateQuantity: (key, quantity) => set((state) => ({
        items: quantity <= 0 ? state.items.filter((item) => item.key !== key) : state.items.map((item) => item.key === key ? { ...item, quantidade: Math.min(50, quantity) } : item),
      })),
      removeItem: (key) => set((state) => ({ items: state.items.filter((item) => item.key !== key) })),
      clear: () => set({ items: [] }),
      setHydrated: (hydrated) => set({ hydrated }),
    }),
    {
      name: "shirley.cart.v1",
      partialize: (state) => ({ items: state.items }),
      onRehydrateStorage: () => (state) => state?.setHydrated(true),
    },
  ),
);

export function cartItemUnitCents(item: CartItem) {
  return moneyToCents(item.precoBase) + moneyToCents(item.pao?.acrescimo) + item.adicionais.reduce((sum, additional) => sum + moneyToCents(additional.preco) * additional.quantidade, 0);
}

export function cartTotalCents(items: CartItem[]) {
  return items.reduce((sum, item) => sum + cartItemUnitCents(item) * item.quantidade, 0);
}

