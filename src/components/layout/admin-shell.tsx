"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, Bell, BookOpen, Boxes, ClipboardList, Home, MailPlus, MoreHorizontal, PlusCircle, ReceiptText, ScrollText, Settings, ShoppingBasket, Store, UserRound, UsersRound } from "lucide-react";
import { BrandMark } from "@/components/shared/brand-mark";
import { useAuth } from "@/features/auth/auth-provider";
import { Drawer, Skeleton } from "@/components/ui";

const nav = [
  { href: "/admin", label: "Início", icon: Home, permission: "dashboard.visualizar", exact: true },
  { href: "/admin/pedidos", label: "Pedidos", icon: ClipboardList, permission: "pedidos.listar" },
  { href: "/admin/pedidos/novo", label: "Novo pedido", icon: PlusCircle, permission: "pedidos.criar" },
  { href: "/admin/produtos", label: "Produtos", icon: ShoppingBasket, permission: "produtos.listar" },
  { href: "/admin/categorias", label: "Categorias", icon: BookOpen, permission: "categorias.listar" },
  { href: "/admin/paes", label: "Pães", icon: Boxes, permission: "paes.listar" },
  { href: "/admin/adicionais", label: "Adicionais", icon: PlusCircle, permission: "adicionais.listar" },
  { href: "/admin/metodos-pagamento", label: "Pagamentos", icon: ReceiptText, permission: "metodos_pagamento.listar" },
  { href: "/admin/loja", label: "Loja", icon: Store, permission: "loja.visualizar" },
  { href: "/admin/usuarios", label: "Equipe", icon: UsersRound, permission: "usuarios.listar" },
  { href: "/admin/convites", label: "Convites", icon: MailPlus, permission: "convites.listar" },
  { href: "/admin/relatorios", label: "Relatórios", icon: BarChart3, permission: "relatorios.visualizar" },
  { href: "/admin/logs", label: "Auditoria", icon: ScrollText, permission: "logs.listar" },
  { href: "/admin/notificacoes", label: "Avisos", icon: Bell, permission: "notificacoes.receber" },
  { href: "/admin/impressoes", label: "Impressões", icon: ReceiptText, permission: "impressoes.listar" },
  { href: "/admin/perfil", label: "Meu perfil", icon: UserRound },
];
const mobilePrimaryHrefs = new Set([
  "/admin",
  "/admin/pedidos",
  "/admin/pedidos/novo",
  "/admin/impressoes",
]);
const bottomPrimary = nav.filter((item) => mobilePrimaryHrefs.has(item.href));

export function isAdminNavActive(pathname: string, item: { href: string; exact?: boolean }) {
  if (item.href === "/admin/pedidos/novo") return pathname === item.href;
  if (item.href === "/admin/pedidos") return pathname === item.href || (pathname.startsWith(`${item.href}/`) && pathname !== "/admin/pedidos/novo");
  return item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, hasPermission } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);
  useEffect(() => { if (!loading && !user) router.replace(`/admin/login?retorno=${encodeURIComponent(pathname)}`); }, [loading, pathname, router, user]);
  if (loading || !user) return <main className="container route-loading" aria-busy="true"><Skeleton className="skeleton--title" /><Skeleton className="skeleton--hero" /></main>;
  const visible = nav.filter((item) => !item.permission || hasPermission(item.permission));
  const current = [...nav].reverse().find((item) => isAdminNavActive(pathname, item));
  const primaryHrefs = new Set(bottomPrimary.map((item) => item.href));
  const moreItems = visible.filter((item) => !primaryHrefs.has(item.href));
  const moreActive = moreItems.some((item) => isAdminNavActive(pathname, item));
  return <div className="admin-shell"><aside className="admin-sidebar"><BrandMark href="/admin" /><nav className="admin-nav" aria-label="Módulos administrativos">{visible.map((item) => { const Icon = item.icon; return <Link href={item.href} key={item.href} aria-current={isAdminNavActive(pathname, item) ? "page" : undefined}><Icon aria-hidden />{item.label}</Link>; })}</nav><div className="admin-sidebar__footer"><strong>{user.nome}</strong><br />Operação da Shirley</div></aside><div className="admin-main"><header className="admin-topbar"><div className="admin-topbar__context"><small>Painel da Shirley</small><strong>{current?.label || "Operação"}</strong></div>{hasPermission("loja.visualizar") && <Link className="icon-button" aria-label="Configurações da loja" title="Configurações da loja" href="/admin/loja"><Settings aria-hidden /></Link>}</header><main id="conteudo-principal">{children}</main></div><nav className="admin-bottom-nav" aria-label="Navegação principal do painel">{bottomPrimary.filter((item) => !item.permission || hasPermission(item.permission)).map((item) => { const Icon = item.icon; return <Link href={item.href} key={item.href} aria-current={isAdminNavActive(pathname, item) ? "page" : undefined}><Icon aria-hidden />{item.label}</Link>; })}<Drawer open={moreOpen} onOpenChange={setMoreOpen} trigger={<button type="button" aria-current={moreActive ? "page" : undefined}><MoreHorizontal aria-hidden />Mais</button>} title="Mais opções" description="Acesse os demais módulos disponíveis para o seu perfil."><nav className="admin-more-nav" aria-label="Outros módulos administrativos">{moreItems.length ? moreItems.map((item) => { const Icon = item.icon; return <Link href={item.href} key={item.href} aria-current={isAdminNavActive(pathname, item) ? "page" : undefined} onClick={() => setMoreOpen(false)}><Icon aria-hidden /><span>{item.label}</span></Link>; }) : <p className="muted">Seu perfil não possui outros módulos disponíveis.</p>}</nav></Drawer></nav></div>;
}

