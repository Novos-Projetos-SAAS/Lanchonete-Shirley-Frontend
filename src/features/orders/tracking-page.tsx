"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Clock3, RefreshCw } from "lucide-react";
import { Button, Card, ErrorState, PageHeader, Skeleton, StatusBadge } from "@/components/ui";
import { formatDateTime } from "@/lib/date";
import { publicService } from "@/services/public-service";
import { StatusTimeline } from "./status-timeline";

export function TrackingPage() {
  const params = useParams<{ codigo: string }>();
  const valid = /^[a-f0-9]{32}$/.test(params.codigo);
  const order = useQuery({ queryKey: ["tracking", params.codigo], queryFn: () => publicService.track(params.codigo), enabled: valid, refetchInterval: () => typeof document !== "undefined" && document.visibilityState === "visible" ? 30_000 : false });
  if (!valid) return <main className="container centered-page" id="conteudo-principal"><ErrorState title="Código inválido" description="Confira o código de 32 caracteres recebido na confirmação." action={<Button asChild><Link href="/acompanhar"><ArrowLeft aria-hidden /> Tentar outro código</Link></Button>} /></main>;
  if (order.isLoading) return <main className="container section" id="conteudo-principal"><Skeleton className="skeleton--title" /><Skeleton className="skeleton--hero" /></main>;
  if (order.isError || !order.data) return <main className="container centered-page" id="conteudo-principal"><ErrorState title="Pedido não encontrado" description="O código pode estar incorreto ou o servidor está temporariamente indisponível." action={<div className="cluster"><Button onClick={() => void order.refetch()}><RefreshCw aria-hidden /> Tentar novamente</Button><Button asChild variant="ghost"><Link href="/acompanhar">Outro código</Link></Button></div>} /></main>;
  return <main className="container section tracking-page" id="conteudo-principal"><PageHeader eyebrow="Acompanhamento" title="Seu pedido está andando" description="A tela atualiza automaticamente enquanto estiver aberta." actions={<Button variant="ghost" onClick={() => void order.refetch()}><RefreshCw aria-hidden /> Atualizar</Button>} /><Card className="tracking-card"><div className="tracking-card__head"><div><small>Status atual</small><StatusBadge status={order.data.status} /></div><div><small>Recebido em</small><strong>{formatDateTime(order.data.criado_em)}</strong></div></div><StatusTimeline status={order.data.status} deliveryType={order.data.tipo_entrega} />{typeof order.data.tempo_estimado_min === "number" && <p className="estimate-note"><Clock3 aria-hidden /> Tempo estimado informado pela loja: {order.data.tempo_estimado_min} min.</p>}<p className="tracking-code">Código: <code>{params.codigo}</code></p></Card><Button asChild variant="ghost"><Link href="/"><ArrowLeft aria-hidden /> Voltar ao cardápio</Link></Button></main>;
}

