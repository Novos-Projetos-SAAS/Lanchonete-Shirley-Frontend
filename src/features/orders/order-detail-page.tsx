"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Ban, CreditCard, Printer, RefreshCw, Save } from "lucide-react";
import { ApiError, isVersionConflict } from "@/lib/api-client";
import { formatDateTime } from "@/lib/date";
import { orderStatusOptions, requiresStatusConfirmation } from "@/lib/order-rules";
import { queryKeys } from "@/lib/query-keys";
import { adminService } from "@/services/admin-service";
import type { OrderStatus, PaymentStatus } from "@/types/domain";
import { Button, Card, ConfirmDialog, CurrencyText, EmptyState, ErrorState, Field, Input, PageHeader, Select, Skeleton, StatusBadge } from "@/components/ui";
import { useToast } from "@/components/ui/toast";
import { PermissionGate } from "@/components/shared/permission-gate";

const statusName: Record<OrderStatus, string> = {
  PENDENTE: "Pendente", EM_PREPARO: "Em preparo", PRONTO_PARA_RETIRADA: "Pronto para retirada",
  SAIU_PARA_ENTREGA: "Saiu para entrega", ENTREGUE: "Entregue", CANCELADO: "Cancelado",
};

export function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const client = useQueryClient();
  const { toast } = useToast();
  const [nextStatus, setNextStatus] = useState<OrderStatus | "">("");
  const [reason, setReason] = useState("");
  const [payment, setPayment] = useState<PaymentStatus | "">("");
  const [paymentReason, setPaymentReason] = useState("");
  const order = useQuery({ queryKey: queryKeys.order(params.id), queryFn: () => adminService.order(params.id) });
  const refresh = async () => { await order.refetch(); await client.invalidateQueries({ queryKey: ["admin-orders"] }); };
  const mutation = useMutation({
    mutationFn: async (kind: "status" | "payment" | "cancel" | "print") => {
      const current = order.data;
      if (!current?.versao) throw new Error("Versão do pedido indisponível.");
      if (kind === "status" && nextStatus) return adminService.updateOrderStatus(params.id, { status: nextStatus, versao: current.versao });
      if (kind === "payment" && payment) return adminService.updatePayment(params.id, { status_pagamento: payment, ...(payment === "ESTORNADO" ? { motivo: paymentReason } : {}), versao: current.versao });
      if (kind === "cancel") return adminService.cancelOrder(params.id, { motivo: reason, versao: current.versao });
      return adminService.requestPrint(params.id);
    },
    onSuccess: async () => {
      toast({ tone: "success", title: "Pedido atualizado" });
      setReason(""); setPaymentReason(""); setNextStatus(""); setPayment("");
      await refresh();
    },
    onError: async (error) => {
      if (isVersionConflict(error)) {
        toast({ tone: "error", title: "O pedido mudou em outro aparelho", description: "Os dados foram atualizados. Revise antes de tentar novamente." });
        await refresh();
      } else toast({ tone: "error", title: "Não foi possível atualizar", description: error instanceof ApiError ? error.message : "Tente novamente." });
    },
  });
  const items = Array.isArray(order.data?.itens) ? order.data.itens as Array<Record<string, unknown>> : [];
  if (order.isLoading) return <div><Skeleton className="skeleton--title" /><Skeleton className="skeleton--hero" /></div>;
  if (order.isError || !order.data) return <ErrorState title="Pedido indisponível" description="Ele pode não existir ou você não tem acesso." action={<Button onClick={() => void order.refetch()}>Tentar novamente</Button>} />;

  const data = order.data;
  const deliveryType = data.tipo_entrega || "ENTREGA";
  const statusOptions = orderStatusOptions(deliveryType, data.status);
  const canAdvance = statusOptions.some((option) => !option.disabled);
  const canCancel = !["ENTREGUE", "CANCELADO"].includes(data.status);
  const confirmStatus = nextStatus ? requiresStatusConfirmation(deliveryType, data.status, nextStatus) : false;
  const statusButton = <Button loading={mutation.isPending} disabled={!nextStatus}><Save aria-hidden /> Atualizar status</Button>;
  const paymentButton = <Button variant="secondary" loading={mutation.isPending} disabled={!payment || (payment === "ESTORNADO" && !paymentReason.trim())}><CreditCard aria-hidden /> Registrar</Button>;

  return <div>
    <Link className="back-link" href="/admin/pedidos"><ArrowLeft aria-hidden /> Voltar à fila</Link>
    <PageHeader eyebrow={`Pedido #${data.id}`} title={data.cliente_nome || "Cliente"} description={`${data.tipo_entrega === "ENTREGA" ? "Entrega" : "Retirada"} · criado em ${formatDateTime(data.criado_em)}`} actions={<><Button variant="ghost" onClick={() => void refresh()}><RefreshCw aria-hidden /> Atualizar</Button><PermissionGate permission="impressoes.solicitar"><Button variant="secondary" loading={mutation.isPending} onClick={() => mutation.mutate("print")}><Printer aria-hidden /> Solicitar comanda</Button></PermissionGate></>} />
    <div className="order-detail-grid">
      <div className="stack">
        <Card className="admin-card"><div className="order-detail-status"><div><small>Status do pedido</small><StatusBadge status={data.status} /></div>{data.status_pagamento && <div><small>Pagamento</small><StatusBadge status={data.status_pagamento} /></div>}<div><small>Total</small><CurrencyText value={data.total || data.valor_total} /></div></div></Card>
        <Card className="admin-card"><h2>Itens</h2>{items.length ? <div className="order-items">{items.map((item, index) => <div key={String(item.id || index)}><div><strong>{String(item.quantidade || 1)}× {String(item.produto_nome_snapshot || item.nome || "Item")}</strong><CurrencyText value={String(item.subtotal || "0.00")} /></div>{item.tipo_pao_nome_snapshot ? <p>Pão: {String(item.tipo_pao_nome_snapshot)}</p> : null}{Array.isArray(item.adicionais) && item.adicionais.length ? <ul>{(item.adicionais as Array<Record<string, unknown>>).map((extra, extraIndex) => <li key={String(extra.id || extraIndex)}>{String(extra.quantidade_por_unidade || 1)}× {String(extra.nome_snapshot || "Adicional")}</li>)}</ul> : null}{item.observacoes ? <p>Obs.: {String(item.observacoes)}</p> : null}</div>)}</div> : <EmptyState compact title="Sem itens" description="O backend não retornou os itens deste pedido." />}</Card>
        <Card className="admin-card"><h2>Entrega e contato</h2><dl className="detail-list"><div><dt>Cliente</dt><dd>{data.cliente_nome || "—"}</dd></div><div><dt>Telefone</dt><dd>{String(data.cliente_telefone || "—")}</dd></div>{data.tipo_entrega === "ENTREGA" && <div><dt>Endereço</dt><dd>{[data.endereco_logradouro, data.endereco_numero, data.endereco_bairro, data.endereco_cidade].filter(Boolean).map(String).join(", ") || "—"}</dd></div>}<div><dt>Forma de pagamento</dt><dd>{String(data.metodo_pagamento_nome_snapshot || "—")}</dd></div></dl></Card>
      </div>
      <aside className="stack">
        <PermissionGate permission="pedidos.status"><Card className="admin-card"><h2>Atualizar status</h2>{canAdvance ? <div className="stack"><Field label="Novo status" htmlFor="next-status" hint="Você pode avançar diretamente para qualquer etapa posterior válida."><Select id="next-status" value={nextStatus} onChange={(event) => setNextStatus(event.target.value as OrderStatus)}><option value="">Selecione</option>{statusOptions.map((option) => <option value={option.status} disabled={option.disabled} key={option.status}>{statusName[option.status]}{option.current ? " (atual)" : option.past ? " (concluído)" : ""}</option>)}</Select></Field>{confirmStatus ? <ConfirmDialog trigger={statusButton} title={`Atualizar para ${nextStatus ? statusName[nextStatus] : "novo status"}?`} description="O histórico registrará somente esta transição. Etapas intermediárias não serão criadas." confirmLabel="Confirmar atualização" onConfirm={() => mutation.mutate("status")} /> : <Button loading={mutation.isPending} disabled={!nextStatus} onClick={() => mutation.mutate("status")}><Save aria-hidden /> Atualizar status</Button>}</div> : <p className="muted">Este pedido está em estado final.</p>}</Card></PermissionGate>
        <PermissionGate permission="pedidos.pagamento"><Card className="admin-card"><h2>Registrar pagamento</h2><div className="stack"><Field label="Novo estado" htmlFor="payment-status"><Select id="payment-status" value={payment} onChange={(event) => { setPayment(event.target.value as PaymentStatus); setPaymentReason(""); }}><option value="">Selecione</option>{data.status_pagamento === "PENDENTE" && <option value="PAGO">Pago</option>}{data.status_pagamento === "PAGO" && <option value="ESTORNADO">Estornado</option>}</Select></Field>{payment === "ESTORNADO" && <Field label="Motivo do estorno" htmlFor="payment-reason" required hint="O motivo ficará registrado na auditoria."><Input id="payment-reason" value={paymentReason} onChange={(event) => setPaymentReason(event.target.value)} maxLength={500} /></Field>}{payment === "ESTORNADO" ? <ConfirmDialog destructive trigger={paymentButton} title="Confirmar estorno?" description="Esta é uma operação financeira excepcional e exige justificativa." confirmLabel="Confirmar estorno" onConfirm={() => mutation.mutate("payment")} /> : <Button variant="secondary" loading={mutation.isPending} disabled={!payment} onClick={() => mutation.mutate("payment")}><CreditCard aria-hidden /> Marcar como pago</Button>}</div></Card></PermissionGate>
        {canCancel && <PermissionGate permission="pedidos.cancelar"><Card className="admin-card danger-zone"><h2>Cancelar pedido</h2><Field label="Motivo obrigatório" htmlFor="cancel-reason"><Input id="cancel-reason" value={reason} onChange={(event) => setReason(event.target.value)} maxLength={500} /></Field><ConfirmDialog destructive trigger={<Button variant="danger" disabled={!reason.trim()}><Ban aria-hidden /> Cancelar pedido</Button>} title="Cancelar este pedido?" description="O cancelamento é terminal e ficará registrado no histórico." confirmLabel="Sim, cancelar" onConfirm={() => mutation.mutate("cancel")} /></Card></PermissionGate>}
      </aside>
    </div>
  </div>;
}

