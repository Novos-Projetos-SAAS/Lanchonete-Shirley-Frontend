"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { BrandMark } from "@/components/shared/brand-mark";
import { centsToMoney, formatCurrency } from "@/lib/money";
import { cartTotalCents, useCartStore } from "@/store/cart-store";

export function PublicShell({ children }: { children: React.ReactNode }) {
  const items = useCartStore((state) => state.items);
  const count = items.reduce((sum, item) => sum + item.quantidade, 0);
  const subtotal = formatCurrency(centsToMoney(cartTotalCents(items)));

  return (
    <div className="site-shell">
      <header className="site-header">
        <div className="container site-header__inner">
          <BrandMark />
          <nav aria-label="Navegação principal">
            <Link href="/">Cardápio</Link>
            <Link href="/acompanhar">Acompanhar</Link>
            <Link className="cart-link" href="/carrinho">
              <ShoppingBag aria-hidden />
              <span className="cart-link__label">Carrinho</span>
              {count > 0 && <><span className="cart-link__subtotal">{subtotal}</span><strong aria-label={`${count} ${count === 1 ? "item" : "itens"}`}>{count}</strong></>}
            </Link>
          </nav>
        </div>
      </header>
      {children}
      <footer className="site-footer">
        <div className="container">
          <BrandMark compact />
          <p>Feito na hora, do seu jeito.</p>
          <Link href="/admin/login">Área da equipe</Link>
        </div>
      </footer>
    </div>
  );
}

