"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, ClipboardCopy, Home } from "lucide-react";
import { Button, Card, EmptyState, PageHeader, PriceBreakdown, StatusBadge } from "@/components/ui";
import type { OrderSummary } from "@/types/domain";
import { useToast } from "@/components/ui/toast";

const KEY = "shirley.order.confirmation";
export function ConfirmationPage() {
  const [order, setOrder] = useState<Partial<OrderSummary> | null>(null);
  const [loaded, setLoaded] = useState(false);
  const { toast } = useToast();
  // A confirmação existe apenas no sessionStorage do navegador após o checkout.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { const value = sessionStorage.getItem(KEY); setOrder(value ? JSON.parse(value) as Partial<OrderSummary> : null); setLoaded(true); }, []);
  if (!loaded) return <main className="container centered-page" id="conteudo-principal">Carregando confirmação…</main>;
  if (!order?.codigo_acompanhamento) return <main className="container centered-page" id="conteudo-principal"><EmptyState title="Nenhuma confirmação recente" description="Se você já fez um pedido, use o código recebido para acompanhar." action={<Button asChild><Link href="/acompanhar">Acompanhar pedido</Link></Button>} /></main>;
  async function copyCode() { await navigator.clipboard.writeText(order!.codigo_acompanhamento!); toast({ tone: "success", title: "Código copiado" }); }
  return <main className="container section confirmation-page" id="conteudo-principal"><div className="confirmation-seal"><CheckCircle2 aria-hidden /></div><PageHeader eyebrow="Pedido recebido" title="Agora é com a Shirley." description="A loja confirmou o recebimento. Guarde o código para acompanhar sem informar telefone ou endereço." /><Card className="confirmation-ticket"><div className="confirmation-ticket__code"><small>Código de acompanhamento</small><strong>{order.codigo_acompanhamento}</strong><Button variant="ghost" size="sm" onClick={copyCode}><ClipboardCopy aria-hidden /> Copiar</Button></div>{order.status && <StatusBadge status={order.status} />}<PriceBreakdown lines={[{ label: "Subtotal", value: order.subtotal || "0.00" }, { label: "Entrega", value: order.taxa_entrega || "0.00" }, { label: "Total confirmado", value: order.total || "0.00", emphasis: true }]} /><div className="cluster"><Button asChild><Link href={`/acompanhar/${order.codigo_acompanhamento}`}>Acompanhar agora</Link></Button><Button asChild variant="ghost"><Link href="/"><Home aria-hidden /> Voltar ao início</Link></Button></div></Card></main>;
}

