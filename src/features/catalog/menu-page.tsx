"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Clock3, MapPin, RefreshCw, Search, ShoppingBag, Store, X } from "lucide-react";
import { Button, Card, CurrencyText, EmptyState, ErrorState, Input, Skeleton } from "@/components/ui";
import { buildMenuReturnPath, consumeMenuPosition, menuContextFromSearch } from "@/lib/menu-context";
import { centsToMoney } from "@/lib/money";
import { queryKeys } from "@/lib/query-keys";
import { publicService } from "@/services/public-service";
import { cartTotalCents, useCartStore } from "@/store/cart-store";
import { ProductCard } from "./product-card";
import type { PublicMenu } from "@/types/domain";

export function visibleMenuCategories(menu: PublicMenu, search: string, category: string) {
  const term = search.trim().toLocaleLowerCase("pt-BR");
  return menu
    .filter((item) => category === "todos" || item.id === category)
    .map((item) => ({
      ...item,
      produtos: (item.produtos || []).filter((product) => !term || `${product.nome} ${product.descricao || ""}`.toLocaleLowerCase("pt-BR").includes(term)),
    }))
    .filter((item) => (item.produtos?.length || 0) > 0);
}

export function MenuPage() {
  const [category, setCategory] = useState("todos");
  const [search, setSearch] = useState("");
  const [contextReady, setContextReady] = useState(false);
  const restoredRef = useRef(false);
  const status = useQuery({ queryKey: queryKeys.storeStatus, queryFn: publicService.status, refetchInterval: 60_000 });
  const menu = useQuery({ queryKey: queryKeys.menu, queryFn: publicService.menu });
  const cartItems = useCartStore((state) => state.items);
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantidade, 0);
  const cartTotal = cartTotalCents(cartItems);
  const returnPath = buildMenuReturnPath({ search, category });

  useEffect(() => {
    const context = menuContextFromSearch(window.location.search);
    // A URL só existe no cliente; estes estados são hidratados uma única vez a partir dela.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSearch(context.search);
    setCategory(context.category);
    setContextReady(true);
  }, []);

  useEffect(() => {
    if (!contextReady) return;
    window.history.replaceState(null, "", returnPath);
  }, [contextReady, returnPath]);

  useEffect(() => {
    if (!contextReady || !menu.data || restoredRef.current) return;
    const validCategory = category === "todos" || menu.data.some((item) => item.id === category);
    if (!validCategory) {
      window.requestAnimationFrame(() => setCategory("todos"));
      return;
    }
    restoredRef.current = true;
    const savedPosition = consumeMenuPosition(returnPath);
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
      if (savedPosition !== null) {
        const maximum = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
        window.scrollTo({ top: Math.min(savedPosition, maximum), behavior: "instant" });
      } else if (category !== "todos") {
        document.getElementById(`categoria-${category}`)?.scrollIntoView({ block: "start" });
      }
    }));
  }, [category, contextReady, menu.data, returnPath]);

  const visibleCategories = useMemo(() => {
    return visibleMenuCategories(menu.data || [], search, category);
  }, [category, menu.data, search]);

  function selectCategory(id: string) {
    setCategory(id);
    const target = id === "todos" ? document.getElementById("cardapio") : document.getElementById(`categoria-${id}`);
    window.requestAnimationFrame(() => target?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  return (
    <main id="conteudo-principal" className="public-menu">
      <section className="menu-intro" aria-labelledby="menu-title">
        <div className="container menu-intro__grid">
          <div className="menu-intro__copy">
            <p className="eyebrow">Lanchonete Shirley</p>
            <h1 id="menu-title">Escolha seu pedido</h1>
            <p>Confira o cardápio, personalize cada item e acompanhe tudo pelo site.</p>
          </div>
          <Card className="store-summary" role="region" aria-label="Informações da loja">
            {status.isLoading ? <><Skeleton className="counter-skeleton" /><Skeleton className="counter-skeleton" /></> : status.isError ? (
              <ErrorState compact title="Status indisponível" description="O cardápio continua disponível. Confirme o atendimento antes de finalizar." action={<Button size="sm" variant="ghost" onClick={() => void status.refetch()}><RefreshCw aria-hidden /> Tentar novamente</Button>} />
            ) : (
              <>
                <div className="store-summary__head">
                  <span className={`store-status ${status.data?.aberta ? "store-status--open" : "store-status--closed"}`}><span aria-hidden />{status.data?.aberta ? "Aberta agora" : "Fechada agora"}</span>
                  <strong>{status.data?.loja?.nome_fantasia || "Lanchonete Shirley"}</strong>
                </div>
                <p>{status.data?.mensagem}</p>
                <div className="store-summary__details">
                  {status.data?.loja?.tempo_estimado_min && <span><Clock3 aria-hidden /> Cerca de {status.data.loja.tempo_estimado_min} min</span>}
                  {status.data?.loja?.endereco_trailer && <span><MapPin aria-hidden /> {status.data.loja.endereco_trailer}</span>}
                </div>
              </>
            )}
          </Card>
        </div>
      </section>

      <section className="section public-menu__section" id="cardapio" aria-labelledby="cardapio-title">
        <div className="container">
          <div className="section-heading public-section-heading">
            <div><p className="eyebrow">Cardápio</p><h2 id="cardapio-title">O que você quer hoje?</h2></div>
            <p>Preços e disponibilidade são confirmados ao enviar o pedido.</p>
          </div>

          <div className="menu-tools">
            <label className="search-box">
              <span className="sr-only">Buscar no cardápio</span><Search aria-hidden />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar lanche, bebida..." />
              {search && <button type="button" onClick={() => setSearch("")} aria-label="Limpar busca"><X aria-hidden /><span>Limpar</span></button>}
            </label>
            <nav className="category-rail" aria-label="Categorias do cardápio">
              <button type="button" aria-current={category === "todos" ? "true" : undefined} onClick={() => selectCategory("todos")}>Todos</button>
              {(menu.data || []).map((item) => <button type="button" key={item.id} aria-current={category === item.id ? "true" : undefined} onClick={() => selectCategory(item.id)}>{item.nome}</button>)}
            </nav>
          </div>

          <div className="menu-layout">
            <div className="menu-layout__content">
              {menu.isLoading ? (
                <div className="product-grid product-grid--menu"><Skeleton className="skeleton--card" /><Skeleton className="skeleton--card" /><Skeleton className="skeleton--card" /></div>
              ) : menu.isError ? (
                <ErrorState title="O cardápio não carregou" description="O servidor pode estar temporariamente indisponível." action={<Button onClick={() => void menu.refetch()}><RefreshCw aria-hidden /> Tentar novamente</Button>} />
              ) : !menu.data?.length ? (
                <EmptyState title="Cardápio indisponível" description="A equipe ainda não publicou produtos para hoje." />
              ) : !visibleCategories.length ? (
                <EmptyState title="Nenhum item encontrado" description="Tente buscar por outro nome." action={<Button variant="ghost" onClick={() => setSearch("")}>Limpar busca</Button>} />
              ) : (
                <div className="menu-sections">
                  {visibleCategories.map((item) => (
                    <section className="menu-category" id={`categoria-${item.id}`} key={item.id} aria-labelledby={`categoria-titulo-${item.id}`}>
                      <header><div><h3 id={`categoria-titulo-${item.id}`}>{item.nome}</h3>{item.descricao && <p>{item.descricao}</p>}</div><span>{item.produtos?.length} {item.produtos?.length === 1 ? "item" : "itens"}</span></header>
                      <div className="product-grid product-grid--menu">{item.produtos?.map((product) => <ProductCard key={product.id} product={product} menuReturnPath={returnPath} />)}</div>
                    </section>
                  ))}
                </div>
              )}
            </div>

            <aside className="menu-cart-summary" aria-labelledby="menu-cart-title">
              <Card className="sticky-summary">
                <div className="menu-cart-summary__title"><div><p className="eyebrow">Seu pedido</p><h2 id="menu-cart-title">Carrinho</h2></div><ShoppingBag aria-hidden /></div>
                {!itemCount ? <div className="menu-cart-summary__empty"><Store aria-hidden /><p>Seu carrinho está vazio.</p><small>Escolha um item para começar.</small></div> : <>
                  <ul>{cartItems.slice(0, 3).map((item) => <li key={item.key}><span>{item.quantidade}× {item.nome}</span><CurrencyText value={centsToMoney(cartTotalCents([item]))} /></li>)}</ul>
                  {cartItems.length > 3 && <p className="menu-cart-summary__more">+ {cartItems.length - 3} configurações no carrinho</p>}
                  <div className="menu-cart-summary__total"><span>Subtotal</span><CurrencyText value={centsToMoney(cartTotal)} /></div>
                  <Button asChild full><Link href="/carrinho">Ver carrinho</Link></Button>
                </>}
              </Card>
            </aside>
          </div>
        </div>
      </section>

      {itemCount > 0 && <Link className="mobile-cart-bar" href="/carrinho"><span><ShoppingBag aria-hidden /><strong>Ver carrinho</strong><small>{itemCount} {itemCount === 1 ? "item" : "itens"}</small></span><CurrencyText value={centsToMoney(cartTotal)} /></Link>}
    </main>
  );
}
