"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ClipboardList, PlusCircle, RefreshCw, Store } from "lucide-react";
import { PermissionGate } from "@/components/shared/permission-gate";
import { Button, Card, CurrencyText, ErrorState, PageHeader, Skeleton } from "@/components/ui";
import { useAuth } from "@/features/auth/auth-provider";
import { useAdminRealtime } from "@/features/orders/use-admin-realtime";
import { localDate } from "@/lib/date";
import { queryKeys } from "@/lib/query-keys";
import { adminService } from "@/services/admin-service";
import { publicService } from "@/services/public-service";

export function DashboardPage() {
  const { hasPermission } = useAuth();
  const canViewOrders = hasPermission("pedidos.listar");
  const { connected } = useAdminRealtime(canViewOrders);
  const start = localDate(-30);
  const end = localDate();
  const dashboard = useQuery({ queryKey: ["dashboard", start, end], queryFn: () => adminService.dashboard(start, end) });
  const store = useQuery({ queryKey: queryKeys.storeStatus, queryFn: publicService.status });
  const data = (dashboard.data || {}) as Record<string, unknown>;
  const statuses = Array.isArray(data.por_status) ? data.por_status as Array<{ status: string; total: string | number }> : [];
  const pending = statuses.filter((item) => ["PENDENTE", "EM_PREPARO"].includes(item.status)).reduce((sum, item) => sum + Number(item.total), 0);

  return <div>
    <PageHeader
      eyebrow="Visão da operação"
      title="Bom turno, equipe."
      description={`Resumo dos últimos 30 dias · tempo real ${canViewOrders ? (connected ? "conectado" : "reconectando") : "restrito ao perfil"}.`}
      actions={<PermissionGate permission="pedidos.criar">
        <Button asChild><Link href="/admin/pedidos/novo"><PlusCircle aria-hidden /> Novo pedido</Link></Button>
      </PermissionGate>}
    />
    {dashboard.isLoading ? <div className="metric-grid">
      <Skeleton className="skeleton--card" />
      <Skeleton className="skeleton--card" />
      <Skeleton className="skeleton--card" />
      <Skeleton className="skeleton--card" />
    </div> : dashboard.isError ? <ErrorState
      title="Resumo indisponível"
      description="Não foi possível carregar os indicadores."
      action={<Button onClick={() => void dashboard.refetch()}><RefreshCw aria-hidden /> Tentar novamente</Button>}
    /> : <>
      <div className="metric-grid">
        <Card className="metric metric--urgent"><small>Na fila agora</small><strong>{pending}</strong><span>pendentes ou em preparo</span></Card>
        <Card className="metric"><small>Pedidos válidos</small><strong>{String(data.pedidos_validos ?? 0)}</strong><span>cancelados fora da conta</span></Card>
        <Card className="metric"><small>Faturamento realizado</small><CurrencyText value={String(data.faturamento_realizado ?? "0.00")} /><span>entregue e pago</span></Card>
        <Card className="metric"><small>Ticket médio</small><CurrencyText value={String(data.ticket_medio_realizado ?? "0.00")} /><span>vendas realizadas</span></Card>
      </div>
      <div className="dashboard-grid">
        <Card className="admin-card">
          <div className="section-heading"><div><p className="eyebrow">Acesso rápido</p><h2>Operação</h2></div></div>
          <div className="quick-actions">
            <PermissionGate permission="pedidos.listar"><Link href="/admin/pedidos"><ClipboardList aria-hidden /><span><strong>Ver pedidos</strong><small>Fila e andamento</small></span><ArrowRight aria-hidden /></Link></PermissionGate>
            <PermissionGate permission="loja.visualizar"><Link href="/admin/loja"><Store aria-hidden /><span><strong>{store.data?.aberta ? "Loja aberta" : "Loja fechada"}</strong><small>{store.data?.mensagem || "Consultar status"}</small></span><ArrowRight aria-hidden /></Link></PermissionGate>
            <PermissionGate permission="produtos.listar"><Link href="/admin/produtos"><PlusCircle aria-hidden /><span><strong>Catálogo</strong><small>Produtos e disponibilidade</small></span><ArrowRight aria-hidden /></Link></PermissionGate>
          </div>
        </Card>
        <Card className="admin-card">
          <div className="section-heading"><div><p className="eyebrow">Pedidos por status</p><h2>Movimento</h2></div></div>
          {statuses.length ? <div className="chart-bars">{statuses.map((item) => {
            const max = Math.max(...statuses.map((row) => Number(row.total)), 1);
            return <div className="chart-bar" key={item.status}><span>{item.status.replaceAll("_", " ")}</span><div className="chart-bar__track"><div className="chart-bar__fill" style={{ width: `${Number(item.total) / max * 100}%` }} /></div><strong>{item.total}</strong></div>;
          })}</div> : <p className="muted">Sem pedidos neste período.</p>}
        </Card>
      </div>
    </>}
  </div>;
}
