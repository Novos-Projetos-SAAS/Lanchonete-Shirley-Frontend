"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, Bell, BookOpen, Boxes, ClipboardList, Home, MailPlus, MoreHorizontal, PlusCircle, ReceiptText, ScrollText, Settings, ShoppingBasket, Store, UserRound, UsersRound } from "lucide-react";
import { BrandMark } from "@/components/shared/brand-mark";
import { useAuth } from "@/features/auth/auth-provider";
import { Skeleton } from "@/components/ui";

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
const bottom = [nav[0], nav[1], nav[2], nav[12], { href: "/admin/perfil", label: "Mais", icon: MoreHorizontal }];

function active(pathname: string, item: { href: string; exact?: boolean }) { return item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`); }

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, hasPermission } = useAuth();
  useEffect(() => { if (!loading && !user) router.replace(`/admin/login?retorno=${encodeURIComponent(pathname)}`); }, [loading, pathname, router, user]);
  if (loading || !user) return <main className="container route-loading" aria-busy="true"><Skeleton className="skeleton--title" /><Skeleton className="skeleton--hero" /></main>;
  const visible = nav.filter((item) => !item.permission || hasPermission(item.permission));
  const current = [...nav].reverse().find((item) => active(pathname, item));
  return <div className="admin-shell"><aside className="admin-sidebar"><BrandMark href="/admin" /><nav className="admin-nav" aria-label="Módulos administrativos">{visible.map((item) => { const Icon = item.icon; return <Link href={item.href} key={item.href} aria-current={active(pathname, item) ? "page" : undefined}><Icon aria-hidden />{item.label}</Link>; })}</nav><div className="admin-sidebar__footer"><strong>{user.nome}</strong><br />Operação da Shirley</div></aside><div className="admin-main"><header className="admin-topbar"><div className="admin-topbar__context"><small>Painel da Shirley</small><strong>{current?.label || "Operação"}</strong></div>{hasPermission("loja.visualizar") && <Link className="icon-button" aria-label="Configurações da loja" title="Configurações da loja" href="/admin/loja"><Settings aria-hidden /></Link>}</header><main id="conteudo-principal">{children}</main></div><nav className="admin-bottom-nav" aria-label="Navegação principal do painel">{bottom.filter((item) => !item.permission || hasPermission(item.permission)).map((item) => { const Icon = item.icon; return <Link href={item.href} key={item.href} aria-current={active(pathname, item) ? "page" : undefined}><Icon aria-hidden />{item.label}</Link>; })}</nav></div>;
}

