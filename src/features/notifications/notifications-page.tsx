"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, BellOff, CheckCheck, ExternalLink, Smartphone } from "lucide-react";
import { queryKeys } from "@/lib/query-keys";
import { formatDateTime } from "@/lib/date";
import { adminService, type AdminRecord } from "@/services/admin-service";
import { disablePush, enablePush, pushSupport } from "@/features/pwa/push";
import { Badge, Button, Card, EmptyState, ErrorState, PageHeader, Pagination, ResponsiveTable, RowActions, Skeleton } from "@/components/ui";
import { useToast } from "@/components/ui/toast";

export function NotificationsPage() {
  const client = useQueryClient();
  const { toast } = useToast();
  const [pushBusy, setPushBusy] = useState(false);
  const [page, setPage] = useState(1);
  const notifications = useQuery({ queryKey: [...queryKeys.notifications, page], queryFn: () => adminService.notifications(page) });
  const pushConfig = useQuery({ queryKey: ["push-config"], queryFn: adminService.pushConfig, retry: false });
  const read = useMutation({ mutationFn: adminService.markRead, onSuccess: async () => { await client.invalidateQueries({ queryKey: queryKeys.notifications }); await client.invalidateQueries({ queryKey: queryKeys.unreadNotifications }); } });
  async function turnOn() { setPushBusy(true); try { await enablePush(); toast({ tone: "success", title: "Notificações ativadas neste aparelho" }); } catch (error) { toast({ tone: "error", title: "Não foi possível ativar", description: error instanceof Error ? error.message : undefined }); } finally { setPushBusy(false); } }
  async function turnOff() { setPushBusy(true); try { await disablePush(); toast({ tone: "success", title: "Notificações desativadas neste aparelho" }); } catch { toast({ tone: "error", title: "Não foi possível desativar" }); } finally { setPushBusy(false); } }
  const columns = [
    { key: "notice", header: "Notificação", render: (item: AdminRecord) => <div className="table-primary"><strong>{String(item.titulo || "Notificação")}</strong><small>{String(item.corpo || "")}</small></div> },
    { key: "date", header: "Recebida", render: (item: AdminRecord) => <span className="tabular">{formatDateTime(String(item.criado_em || ""))}</span> },
    { key: "state", header: "Estado", render: (item: AdminRecord) => <Badge className={item.lida_em ? "badge--muted" : "badge--success"}>{item.lida_em ? "Lida" : "Nova"}</Badge> },
    { key: "actions", header: "Ações", className: "table-actions", render: (item: AdminRecord) => item.pedido_id || !item.lida_em ? <RowActions label={`Ações de ${String(item.titulo || "notificação")}`}>{item.pedido_id && <Button asChild variant="ghost" size="sm"><Link href={`/admin/pedidos/${String(item.pedido_id)}`}><ExternalLink aria-hidden /> Ver pedido</Link></Button>}{!item.lida_em && <Button variant="ghost" size="sm" loading={read.isPending} onClick={() => read.mutate(item.id)}><CheckCheck aria-hidden /> Marcar lida</Button>}</RowActions> : <span className="muted">Sem ações</span> },
  ];
  return <div><PageHeader eyebrow="Caixa de entrada" title="Notificações" description="A inbox é a fonte durável; avisos do navegador podem atrasar conforme o aparelho e a rede." /><Card className="push-card"><div><Smartphone aria-hidden /><div><h2>Avisos neste aparelho</h2><p>{!pushSupport() ? "Este navegador não oferece Web Push." : pushConfig.data?.habilitado ? `Permissão atual: ${typeof Notification !== "undefined" ? Notification.permission : "indisponível"}` : "Push ainda não está configurado no servidor."}</p></div></div><div className="cluster"><Button disabled={!pushSupport() || !pushConfig.data?.habilitado} loading={pushBusy} onClick={turnOn}><Bell aria-hidden /> Ativar</Button><Button variant="ghost" disabled={!pushSupport()} loading={pushBusy} onClick={turnOff}><BellOff aria-hidden /> Desativar</Button></div></Card>{notifications.isLoading ? <div className="stack" aria-label="Carregando notificações"><Skeleton className="skeleton--card" /><Skeleton className="skeleton--card" /></div> : notifications.isError ? <ErrorState title="Avisos indisponíveis" description="Não foi possível sincronizar a caixa de entrada." action={<Button onClick={() => void notifications.refetch()}>Tentar novamente</Button>} /> : !notifications.data?.items.length ? <EmptyState title="Nenhum aviso por aqui" description="Pedidos novos e eventos operacionais aparecerão nesta caixa." /> : <ResponsiveTable items={notifications.data.items} columns={columns} getKey={(item) => item.id} caption="Notificações operacionais" />}{notifications.data && <Pagination page={page} totalPages={notifications.data.pagination.total_pages} totalItems={notifications.data.pagination.total} onPageChange={setPage} label="Paginação das notificações" />}</div>;
}
