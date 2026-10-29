"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, PlusCircle, RefreshCw, Search } from "lucide-react";
import { PermissionGate } from "@/components/shared/permission-gate";
import { Button, EmptyState, ErrorState, Input, PageHeader, ResponsiveTable, Select, Skeleton, StatusBadge } from "@/components/ui";
import { formatDateTime } from "@/lib/date";
import { queryKeys } from "@/lib/query-keys";
import { adminService } from "@/services/admin-service";
import type { OrderSummary } from "@/types/domain";
import { useAdminRealtime } from "./use-admin-realtime";

export function AdminOrdersPage() {
  const [status, setStatus] = useState("");
  const [delivery, setDelivery] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { connected } = useAdminRealtime();
  const filters = { status, tipo_entrega: delivery, busca: search, page };
  const orders = useQuery({ queryKey: queryKeys.orders(filters), queryFn: () => adminService.orders(filters), refetchInterval: connected ? false : 30_000 });
  const columns = [
    { key: "id", header: "Pedido", render: (order: OrderSummary) => <div className="table-primary"><strong>#{order.id}</strong><small>{formatDateTime(order.criado_em)}</small></div> },
    { key: "customer", header: "Cliente", render: (order: OrderSummary) => <strong>{order.cliente_nome || "Cliente"}</strong> },
    { key: "delivery", header: "Recebimento", render: (order: OrderSummary) => <span>{order.tipo_entrega === "ENTREGA" ? "Entrega" : "Retirada"}</span> },
    { key: "status", header: "Estado", render: (order: OrderSummary) => <StatusBadge status={order.status} /> },
    { key: "total", header: "Total", render: (order: OrderSummary) => <strong className="tabular">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(order.total || order.valor_total || 0))}</strong> },
    { key: "action", header: "Abrir", className: "table-actions", render: (order: OrderSummary) => <Button asChild variant="ghost" size="sm"><Link href={`/admin/pedidos/${order.id}`}><ExternalLink aria-hidden /> Detalhes</Link></Button> },
  ];
  return <div><PageHeader eyebrow="Fila operacional" title="Pedidos" description={`Atualização ${connected ? "em tempo real" : "por consulta periódica"}. Pedidos novos aparecem no topo.`} actions={<><Button variant="ghost" onClick={() => void orders.refetch()}><RefreshCw aria-hidden /> Atualizar</Button><PermissionGate permission="pedidos.criar"><Button asChild><Link href="/admin/pedidos/novo"><PlusCircle aria-hidden /> Novo pedido</Link></Button></PermissionGate></>} /><div className="toolbar"><label className="search-box"><Search aria-hidden /><span className="sr-only">Buscar cliente</span><Input type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Nome ou telefone" /></label><label className="field"><span>Status</span><Select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}><option value="">Todos</option><option value="PENDENTE">Pendentes</option><option value="EM_PREPARO">Em preparo</option><option value="PRONTO_PARA_RETIRADA">Prontos</option><option value="SAIU_PARA_ENTREGA">Em entrega</option><option value="ENTREGUE">Entregues</option><option value="CANCELADO">Cancelados</option></Select></label><label className="field"><span>Entrega</span><Select value={delivery} onChange={(event) => { setDelivery(event.target.value); setPage(1); }}><option value="">Todos</option><option value="ENTREGA">Entrega</option><option value="RETIRADA">Retirada</option></Select></label></div>{orders.isLoading ? <div className="stack"><Skeleton className="skeleton--card" /><Skeleton className="skeleton--card" /></div> : orders.isError ? <ErrorState title="Pedidos indisponíveis" description="A fila não pôde ser consultada." action={<Button onClick={() => void orders.refetch()}>Tentar novamente</Button>} /> : !orders.data?.items.length ? <EmptyState title="Nenhum pedido nesta fila" description="Altere os filtros ou crie um pedido manual." action={<PermissionGate permission="pedidos.criar"><Button asChild><Link href="/admin/pedidos/novo">Criar pedido</Link></Button></PermissionGate>} /> : <ResponsiveTable items={orders.data.items} columns={columns} getKey={(order) => String(order.id)} caption="Fila de pedidos" />}{orders.data && orders.data.pagination.total_pages > 1 && <div className="pagination"><Button variant="ghost" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Anterior</Button><span>Página {page} de {orders.data.pagination.total_pages}</span><Button variant="ghost" disabled={page >= orders.data.pagination.total_pages} onClick={() => setPage((value) => value + 1)}>Próxima</Button></div>}</div>;
}
