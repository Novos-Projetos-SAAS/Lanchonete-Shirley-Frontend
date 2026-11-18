"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import Image from "next/image";
import { Check, ChevronRight, Edit3, ImageOff, LayoutGrid, PackageOpen, Plus, RefreshCw, Search, UtensilsCrossed, X } from "lucide-react";
import type { AdminRecord } from "@/services/admin-service";
import { resolveProductImage } from "@/lib/product-images";
import { Badge, Button, Dialog, EmptyState, ErrorState, Field, Input, Pagination, Select, Skeleton } from "@/components/ui";
import { PermissionGate } from "@/components/shared/permission-gate";
import { useAuth } from "@/features/auth/auth-provider";

export function AdminProductPhoto({ product }: { product: AdminRecord }) {
  const src = resolveProductImage({ nome: String(product.nome || ""), descricao: product.descricao, imagem_url: product.imagem_url });
  const [failed, setFailed] = useState<string | null>(null);
  return <span className="catalog-photo">{src && failed !== src ? <Image src={src} alt="" fill sizes="(max-width: 600px) 50vw, 260px" unoptimized onError={() => setFailed(src)} /> : <span className="catalog-photo__empty"><ImageOff aria-hidden /><span>Sem foto</span></span>}</span>;
}

export function AdminCategoryRail({ categories, value, onChange, loading, failed, retry }: { categories: AdminRecord[]; value: string; onChange: (id: string) => void; loading?: boolean; failed?: boolean; retry?: () => void }) {
  return <aside className="catalog-categories" aria-label="Categorias de produtos">
    <div className="catalog-categories__heading"><span className="admin-kicker">Cardápio Shirley</span><h2>Categorias</h2></div>
    <div className="catalog-categories__options" role="group" aria-label="Filtrar por categoria">
      {[{ id: "", nome: "Todos", descricao: "Todos os produtos" }, ...categories].map(category => <button type="button" className="catalog-category" key={category.id} aria-pressed={value === category.id} onClick={() => onChange(category.id)}>
        <span className="catalog-category__icon">{category.id ? <UtensilsCrossed aria-hidden /> : <LayoutGrid aria-hidden />}</span>
        <span><strong>{String(category.nome)}</strong>{category.ativo === false ? <small>Inativa</small> : category.descricao ? <small>{String(category.descricao)}</small> : null}</span>
        {value === category.id && <Check className="catalog-category__check" aria-hidden />}
      </button>)}
    </div>
    {loading && <p className="muted" role="status">Carregando categorias…</p>}
    {failed && <div className="catalog-category-error"><p role="alert">Não foi possível carregar as categorias.</p><Button variant="ghost" onClick={retry}>Tentar novamente</Button></div>}
  </aside>;
}

const subscribeDesktop = (notify: () => void) => { const media = window.matchMedia("(min-width: 1200px)"); media.addEventListener("change", notify); return () => media.removeEventListener("change", notify); };
const desktopSnapshot = () => window.matchMedia("(min-width: 1200px)").matches;
const serverSnapshot = () => false;

type ProductStatus = "todos" | "ativos" | "inativos" | "arquivados";
interface CatalogProps {
  categories: AdminRecord[]; category: string; onCategory: (id: string) => void;
  categoriesLoading: boolean; categoriesFailed: boolean; retryCategories: () => void;
  products: AdminRecord[]; loading: boolean; fetching: boolean; failed: boolean; refresh: () => void;
  search: string; onSearch: (value: string) => void; status: ProductStatus; onStatus: (value: ProductStatus) => void;
  page: number; pages: number; total: number; onPage: (page: number) => void;
  onEdit: (record: AdminRecord) => void; onCreate: () => void; actions: (record: AdminRecord) => ReactNode;
  price: (record: AdminRecord) => string; guidance?: string;
  editor: { open: boolean; selected: AdminRecord | null; title: string; fields: ReactNode; footer: ReactNode; close: () => void };
}

export function ProductCatalogWorkspace(props: CatalogProps) {
  const { hasPermission } = useAuth();
  const canManage = hasPermission("produtos.gerenciar");
  const desktop = useSyncExternalStore(subscribeDesktop, desktopSnapshot, serverSnapshot);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const wasOpen = useRef(false);
  const { editor } = props;
  useEffect(() => {
    if (desktop && editor.open) titleRef.current?.focus({ preventScroll: true });
    if (wasOpen.current && !editor.open) triggerRef.current?.focus({ preventScroll: true });
    wasOpen.current = editor.open;
  }, [desktop, editor.open, editor.selected?.id]);
  const categoryName = props.categories.find(item => item.id === props.category)?.nome;
  return <div className="catalog-workspace">
    <AdminCategoryRail categories={props.categories} value={props.category} onChange={props.onCategory} loading={props.categoriesLoading} failed={props.categoriesFailed} retry={props.retryCategories} />
    <section className="catalog-content" aria-labelledby="catalog-title">
      <div className="catalog-heading"><div><span className="admin-kicker">Seu cardápio</span><h1 id="catalog-title">{categoryName ? String(categoryName) : "Produtos"}</h1><p>Fotos, preços e disponibilidade em um só lugar.</p></div><PermissionGate permission="produtos.gerenciar"><Button onClick={event => { triggerRef.current = event.currentTarget; props.onCreate(); }}><Plus aria-hidden /> Novo produto</Button></PermissionGate></div>
      <div className="catalog-filters" role="group" aria-label="Filtros de produtos">
        <label className="catalog-search"><Search aria-hidden /><span className="sr-only">Buscar</span><Input type="search" value={props.search} onChange={event => props.onSearch(event.target.value)} placeholder="Buscar em produtos" /></label>
        <Field label="Estado" htmlFor="product-status-filter"><Select id="product-status-filter" value={props.status} onChange={event => props.onStatus(event.target.value as ProductStatus)}><option value="todos">Todos</option><option value="ativos">Ativos</option><option value="inativos">Inativos</option><option value="arquivados">Arquivados</option></Select></Field>
        <Button variant="ghost" onClick={props.refresh} aria-label="Atualizar produtos"><RefreshCw aria-hidden /><span>Atualizar</span></Button>
      </div>
      <div className="catalog-results"><p role="status" aria-live="polite">{props.fetching ? "Atualizando produtos…" : `${props.total} produto${props.total === 1 ? "" : "s"} encontrado${props.total === 1 ? "" : "s"}`}</p>{props.category && <button type="button" className="catalog-clear" onClick={() => props.onCategory("")}>Limpar categoria <X aria-hidden /></button>}</div>
      {props.loading ? <div className="catalog-grid" aria-busy="true"><Skeleton className="skeleton--card" /><Skeleton className="skeleton--card" /></div> : props.failed ? <ErrorState title="Produtos indisponíveis" description="Não foi possível consultar os produtos." action={<Button onClick={props.refresh}>Tentar novamente</Button>} /> : !props.products.length ? <EmptyState title={props.status === "arquivados" ? "Nenhum produto arquivado" : "Nenhum produto encontrado"} description="Ajuste os filtros ou cadastre um novo produto." action={<PermissionGate permission="produtos.gerenciar"><Button onClick={props.onCreate}>Novo produto</Button></PermissionGate>} /> : <div className="catalog-grid" aria-label="Produtos do catálogo">
        {props.products.map(product => {
          const name = String(product.nome || `#${product.id}`);
          const selected = editor.open && editor.selected?.id === product.id;
          return <article key={product.id} className="catalog-card" data-selected={selected || undefined} aria-label={name}>
            <div className="catalog-card__open"><AdminProductPhoto product={product} /><div className="catalog-card__info"><strong className="catalog-card__name">{name}</strong>{product.descricao && <span className="catalog-card__description">{String(product.descricao)}</span>}<span className="catalog-card__price">{props.price(product)}</span>{canManage && !product.deletado_em && <button type="button" className="catalog-card__edit" aria-label={`Editar ${name}`} aria-pressed={selected} aria-controls={desktop ? "product-editor" : undefined} onClick={event => { triggerRef.current = event.currentTarget; props.onEdit(product); }}><Edit3 aria-hidden />Editar<ChevronRight aria-hidden /></button>}</div></div>
            <div className="catalog-card__footer"><div className="catalog-card__status"><Badge className={product.deletado_em || product.ativo === false ? "badge--muted" : "badge--success"}>{product.deletado_em ? "Arquivado" : product.ativo === false ? "Inativo" : "Ativo"}</Badge>{!product.deletado_em && product.disponivel_hoje === false && <small>Indisponível hoje</small>}</div>{props.actions(product)}</div>
          </article>;
        })}
      </div>}
      <Pagination page={props.page} totalPages={props.pages} totalItems={props.total} onPageChange={props.onPage} label="Paginação de Produtos" />
      {props.guidance && <details className="catalog-guidance"><summary>Antes de publicar um produto</summary><p>{props.guidance}</p></details>}
    </section>
    <aside className="catalog-editor" id="product-editor" aria-label="Editor de produto" onKeyDown={event => { if (event.key === "Escape" && editor.open) { event.stopPropagation(); editor.close(); } }}>
      {desktop && editor.open ? <><header className="catalog-editor__heading"><div><span className="admin-kicker">Dados do produto</span><h2 tabIndex={-1} ref={titleRef}>{editor.title}</h2></div><Button variant="ghost" onClick={editor.close} aria-label="Fechar editor"><X aria-hidden /></Button></header><div className="catalog-editor__body">{editor.fields}</div><footer className="catalog-editor__footer">{editor.footer}</footer></> : <div className="catalog-editor__empty"><span className="catalog-editor__symbol"><PackageOpen aria-hidden /></span><h2>{canManage ? "Seu produto, em detalhe" : "Consulte seu cardápio"}</h2><p>{canManage ? "Selecione um produto para editar seus dados ou cadastre um novo." : "As alterações ficam disponíveis para quem possui permissão de gerenciamento."}</p><PermissionGate permission="produtos.gerenciar"><Button onClick={props.onCreate}><Plus aria-hidden /> Novo produto</Button></PermissionGate></div>}
    </aside>
    {!desktop && <Dialog open={editor.open} onOpenChange={next => { if (!next) editor.close(); }} title={editor.title} description="Preencha somente dados reais da operação." footer={editor.footer}>{editor.fields}</Dialog>}
  </div>;
}
