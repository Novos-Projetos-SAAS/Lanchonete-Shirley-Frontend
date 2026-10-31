"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CircleCheckBig, CirclePause, ClipboardList, PlusCircle, RefreshCw, Store, TriangleAlert } from "lucide-react";
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
    {store.isLoading ? <Skeleton className="dashboard-store-status dashboard-store-status--loading" /> : store.isError ? <section className="dashboard-store-status dashboard-store-status--warning" aria-labelledby="dashboard-store-title">
      <span className="dashboard-store-status__icon"><TriangleAlert aria-hidden /></span>
      <div><p className="eyebrow">Status efetivo da loja</p><h2 id="dashboard-store-title">Status indisponível</h2><p>Não foi possível confirmar agora se o canal público está aceitando pedidos.</p></div>
      <Button variant="ghost" size="sm" onClick={() => void store.refetch()}><RefreshCw aria-hidden /> Tentar novamente</Button>
    </section> : <section className={`dashboard-store-status ${store.data?.aberta ? "dashboard-store-status--open" : "dashboard-store-status--closed"}`} role="status" aria-atomic="true" aria-labelledby="dashboard-store-title">
      <span className="dashboard-store-status__icon">{store.data?.aberta ? <CircleCheckBig aria-hidden /> : <CirclePause aria-hidden />}</span>
      <div><p className="eyebrow">Status efetivo da loja</p><h2 id="dashboard-store-title">{store.data?.aberta ? "Loja aberta para pedidos" : "Loja fechada para pedidos"}</h2><p>{store.data?.mensagem || "Status calculado pela API."} O resultado combina controle manual, horários e configuração mínima.</p></div>
      <PermissionGate permission="loja.visualizar"><Button asChild variant="ghost" size="sm"><Link href="/admin/loja">Ver controles <ArrowRight aria-hidden /></Link></Button></PermissionGate>
    </section>}
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
            <PermissionGate permission="loja.visualizar"><Link href="/admin/loja"><Store aria-hidden /><span><strong>Configurar loja</strong><small>Controle manual e horários</small></span><ArrowRight aria-hidden /></Link></PermissionGate>
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
