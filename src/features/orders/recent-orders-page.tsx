"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useQueries } from "@tanstack/react-query";
import { Clock3, RefreshCw, Trash2 } from "lucide-react";
import { Button, Card, ConfirmDialog, EmptyState, PageHeader, Skeleton, StatusBadge } from "@/components/ui";
import { formatDateTime } from "@/lib/date";
import { clearRecentOrders, readRecentOrders, type RecentOrderReference } from "@/lib/recent-orders";
import { publicService } from "@/services/public-service";

export function RecentOrdersPage() {
  const [references, setReferences] = useState<RecentOrderReference[]>([]);
  const [loaded, setLoaded] = useState(false);
  // O histórico existe somente no navegador e é validado antes do uso.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setReferences(readRecentOrders()); setLoaded(true); }, []);
  const orders = useQueries({ queries: references.map((reference) => ({
    queryKey: ["recent-order", reference.code],
    queryFn: () => publicService.track(reference.code),
    retry: false,
    refetchInterval: 30_000,
  })) });

  function clearHistory() { clearRecentOrders(); setReferences([]); }
  if (!loaded) return <main className="container section" id="conteudo-principal"><Skeleton className="skeleton--title" /><Skeleton className="skeleton--hero" /></main>;

  return <main className="container section recent-orders-page" id="conteudo-principal"><PageHeader eyebrow="Neste navegador" title="Meus pedidos" description="Referências recentes ficam somente neste aparelho por até 30 dias. O andamento é sempre consultado na loja." actions={references.length ? <ConfirmDialog destructive trigger={<Button variant="ghost"><Trash2 aria-hidden /> Limpar histórico</Button>} title="Limpar pedidos deste navegador?" description="Os pedidos não serão apagados da loja, mas os atalhos locais serão removidos." confirmLabel="Limpar histórico" onConfirm={clearHistory} /> : undefined} />{!references.length ? <EmptyState title="Nenhum pedido recente" description="Depois de finalizar um pedido, o atalho para acompanhamento aparecerá aqui." action={<Button asChild><Link href="/">Ver cardápio</Link></Button>} /> : <div className="recent-orders-list">{references.map((reference, index) => { const query = orders[index]; return <Card className="recent-order-card" key={reference.code}><div><small>Pedido</small><h2>{reference.orderId ? `#${reference.orderId}` : "Pedido recente"}</h2><p><Clock3 aria-hidden /> {formatDateTime(reference.createdAt)}</p></div><div className="recent-order-card__status">{query?.isLoading ? <Skeleton className="counter-skeleton" /> : query?.data ? <StatusBadge status={query.data.status} /> : <span className="muted">Não foi possível confirmar o status agora.</span>}</div><div className="cluster"><Button asChild><Link href={`/acompanhar/${reference.code}`}>Acompanhar</Link></Button>{query?.isError && <Button variant="ghost" onClick={() => void query.refetch()}><RefreshCw aria-hidden /> Atualizar</Button>}</div></Card>; })}</div>}<p className="privacy-note">Limpar dados do navegador remove este histórico. Recuperação em outro aparelho exige o link ou código de acompanhamento.</p></main>;
}
