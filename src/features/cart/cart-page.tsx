"use client";

import Link from "next/link";
import { ArrowLeft, Edit3, ShoppingBag, Trash2 } from "lucide-react";
import { Button, Card, ConfirmDialog, CurrencyText, EmptyState, PageHeader, PriceBreakdown, QuantityStepper } from "@/components/ui";
import { centsToMoney } from "@/lib/money";
import { cartItemUnitCents, cartTotalCents, useCartStore } from "@/store/cart-store";

export function CartPage() {
  const items = useCartStore((state) => state.items);
  const hydrated = useCartStore((state) => state.hydrated);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const clear = useCartStore((state) => state.clear);
  if (!hydrated) return <main className="container centered-page" id="conteudo-principal" aria-busy="true">Carregando carrinho…</main>;
  if (!items.length) return <main className="container centered-page" id="conteudo-principal"><EmptyState title="Seu carrinho está esperando" description="Escolha um item do cardápio e monte do seu jeito." action={<Button asChild><Link href="/"><ArrowLeft aria-hidden /> Ver cardápio</Link></Button>} /></main>;
  const total = cartTotalCents(items);
  return <main className="container section" id="conteudo-principal"><PageHeader eyebrow="Seu pedido" title="Carrinho" description="Confira os itens. O servidor confirma preços e disponibilidade ao finalizar." actions={<ConfirmDialog destructive trigger={<Button variant="ghost" size="sm"><Trash2 aria-hidden /> Limpar</Button>} title="Esvaziar o carrinho?" description="Todos os itens serão removidos deste aparelho." confirmLabel="Esvaziar" onConfirm={clear} />} /><div className="split-layout"><div className="stack">{items.map((item) => <Card className="cart-item" key={item.key}><div className="cart-item__top"><div><h2>{item.nome}</h2><p>{item.pao?.nome || (item.tipo === "LANCHE" ? "Pão não selecionado" : "Item padrão")}</p></div><CurrencyText value={centsToMoney(cartItemUnitCents(item) * item.quantidade)} /></div>{item.adicionais.length > 0 && <ul>{item.adicionais.map((additional) => <li key={additional.id}>{additional.quantidade}× {additional.nome}</li>)}</ul>}{item.observacoes && <p className="cart-item__note">“{item.observacoes}”</p>}<div className="cart-item__actions"><QuantityStepper value={item.quantidade} onChange={(value) => updateQuantity(item.key, value)} /><div><Button asChild variant="ghost" size="sm"><Link href={`/produto/${item.produtoId}`}><Edit3 aria-hidden /> Editar como novo</Link></Button><ConfirmDialog destructive trigger={<Button variant="ghost" size="sm"><Trash2 aria-hidden /> Remover</Button>} title="Remover este item?" description={`${item.nome} sairá do carrinho.`} confirmLabel="Remover" onConfirm={() => removeItem(item.key)} /></div></div></Card>)}</div><Card className="sticky-summary"><h2>Resumo</h2><PriceBreakdown lines={[{ label: `${items.reduce((sum, item) => sum + item.quantidade, 0)} itens`, value: centsToMoney(total) }, { label: "Entrega", value: "0.00" }, { label: "Estimativa", value: centsToMoney(total), emphasis: true }]} note="A taxa de entrega e o total definitivo são calculados pela API." /><Button asChild full size="lg"><Link href="/finalizar"><ShoppingBag aria-hidden /> Ir para finalizar</Link></Button><Button asChild full variant="ghost"><Link href="/"><ArrowLeft aria-hidden /> Continuar escolhendo</Link></Button></Card></div></main>;
}

