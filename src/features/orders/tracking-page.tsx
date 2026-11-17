"use client";

import { useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Clock3, RefreshCw } from "lucide-react";
import { Button, Card, ErrorState, PageHeader, Skeleton, StatusBadge } from "@/components/ui";
import { formatDateTime } from "@/lib/date";
import { checkoutUrl, paymentFeedback, paymentReturn } from "@/lib/infinitepay";
import { publicService } from "@/services/public-service";
import type { PaymentReturn } from "@/types/domain";
import { StatusTimeline } from "./status-timeline";

export function TrackingPage() {
  const params = useParams<{ codigo: string }>();
  const code = params.codigo;
  const valid = /^[a-f0-9]{32}$/.test(code);
  const queryClient = useQueryClient();
  const submittedReturn = useRef<string | null>(null);
  const order = useQuery({
    queryKey: ["tracking", code], queryFn: () => publicService.track(code), enabled: valid,
    refetchInterval: (query) => {
      if (typeof document === "undefined" || document.visibilityState !== "visible") return false;
      const payment = query.state.data?.pagamento;
      return payment?.fluxo === "INFINITEPAY" && !payment.liberado_operacionalmente ? 15_000 : 30_000;
    },
  });
  const confirmation = useMutation({
    mutationFn: ({ code, signal }: { code: string; signal: PaymentReturn }) => publicService.confirmPayment(code, signal),
    onSettled: (_data, _error, variables) => queryClient.invalidateQueries({ queryKey: ["tracking", variables.code] }),
  });
  const { mutate } = confirmation;
  useEffect(() => {
    const signal = paymentReturn(window.location.search);
    if (!valid || !signal) return;
    const identity = `${code}:${JSON.stringify(signal)}`;
    if (submittedReturn.current === identity) return;
    submittedReturn.current = identity;
    // Identificadores do retorno só solicitam consulta oficial; não confirmam pagamento.
    mutate({ code, signal });
  }, [code, valid, mutate]);
  if (!valid) return <main className="container centered-page" id="conteudo-principal"><ErrorState title="Código inválido" description="Confira o código de 32 caracteres recebido na confirmação." action={<Button asChild><Link href="/acompanhar"><ArrowLeft aria-hidden /> Tentar outro código</Link></Button>} /></main>;
  if (order.isLoading) return <main className="container section" id="conteudo-principal"><Skeleton className="skeleton--title" /><Skeleton className="skeleton--hero" /></main>;
  if (order.isError || !order.data) return <main className="container centered-page" id="conteudo-principal"><ErrorState title="Pedido não encontrado" description="O código pode estar incorreto ou o servidor está temporariamente indisponível." action={<div className="cluster"><Button onClick={() => void order.refetch()}><RefreshCw aria-hidden /> Tentar novamente</Button><Button asChild variant="ghost"><Link href="/acompanhar">Outro código</Link></Button></div>} /></main>;
  const payment = order.data.pagamento;
  const online = payment?.fluxo === "INFINITEPAY";
  const released = !online || payment.liberado_operacionalmente;
  const feedback = online ? paymentFeedback(payment, order.data.status) : null;
  const checkout = online && payment.estado === "AGUARDANDO_PAGAMENTO" && !released && order.data.status !== "CANCELADO" ? checkoutUrl(payment.checkout_url) : null;
  return (
    <main className="container section tracking-page" id="conteudo-principal">
      <PageHeader eyebrow="Acompanhamento" title={feedback?.title ?? "Seu pedido está andando"} description={online ? "Consulte o pagamento e acompanhe a liberação do pedido." : "A tela atualiza automaticamente enquanto estiver aberta."} actions={<Button variant="ghost" onClick={() => void order.refetch()} loading={order.isFetching}><RefreshCw aria-hidden /> Atualizar</Button>} />
      {online && <Card className="tracking-card">
        <h2>Pagamento online pela InfinitePay</h2>
        <p role="status">{confirmation.isPending ? "Conferindo pagamento com a loja…" : feedback?.description}</p>
        {confirmation.isError && <p role="alert">Não foi possível verificar esse retorno. Atualize o status ou fale com a loja. O pedido continua salvo; não pague novamente.</p>}
        {checkout && <Button asChild><a href={checkout} rel="noreferrer">Abrir checkout seguro</a></Button>}
      </Card>}
      <Card className="tracking-card">
        <div className="tracking-card__head">
          <div><small>{released ? "Status atual" : "Liberação do pedido"}</small>{released || order.data.status === "CANCELADO" ? <StatusBadge status={order.data.status} /> : <strong>Aguardando confirmação oficial</strong>}</div>
          <div><small>Pedido criado em</small><strong>{formatDateTime(order.data.criado_em)}</strong></div>
        </div>
        {released && <StatusTimeline status={order.data.status} deliveryType={order.data.tipo_entrega} />}
        {released && typeof order.data.tempo_estimado_min === "number" && <p className="estimate-note"><Clock3 aria-hidden /> Tempo estimado informado pela loja: {order.data.tempo_estimado_min} min.</p>}
        <p className="tracking-code">Código: <code>{code}</code></p>
      </Card>
      <Button asChild variant="ghost"><Link href="/"><ArrowLeft aria-hidden /> Voltar ao cardápio</Link></Button>
    </main>
  );
}

