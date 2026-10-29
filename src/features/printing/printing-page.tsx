"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Printer, RefreshCw } from "lucide-react";
import { formatDateTime } from "@/lib/date";
import { adminService, type AdminRecord } from "@/services/admin-service";
import { Badge, Button, EmptyState, ErrorState, Field, PageHeader, ResponsiveTable, Select } from "@/components/ui";

export function PrintingPage() {
  const [status, setStatus] = useState("");
  const jobs = useQuery({ queryKey: ["print-jobs", status], queryFn: () => adminService.printJobs(status), refetchInterval: 30_000 });
  const columns = [
    { key: "id", header: "Impressão", render: (job: AdminRecord) => <strong>#{job.id}</strong> },
    { key: "order", header: "Pedido", render: (job: AdminRecord) => <span>#{String(job.pedido_id || "—")}</span> },
    { key: "date", header: "Solicitada", render: (job: AdminRecord) => <span className="tabular">{formatDateTime(String(job.criado_em || ""))}</span> },
    { key: "attempts", header: "Tentativas", render: (job: AdminRecord) => <span className="tabular">{String(job.tentativas ?? 0)}</span>, hideOnMobile: true },
    { key: "status", header: "Estado", render: (job: AdminRecord) => <Badge>{String(job.status || "PENDENTE").replaceAll("_", " ")}</Badge> },
  ];
  return <div><PageHeader eyebrow="Agente externo" title="Fila de impressão" description="O painel solicita comandas; a impressão física depende do agente conectado." actions={<Button variant="ghost" onClick={() => void jobs.refetch()}><RefreshCw aria-hidden /> Atualizar</Button>} /><div className="print-notice"><Printer aria-hidden /><p><strong>O navegador Android não imprime diretamente.</strong><br />Monitore o agente e as falhas nesta fila.</p></div><Field label="Estado" htmlFor="print-status"><Select id="print-status" className="print-filter" value={status} onChange={(event) => setStatus(event.target.value)}><option value="">Todos</option><option value="PENDENTE">Pendente</option><option value="EM_PROCESSAMENTO">Em processamento</option><option value="CONCLUIDA">Concluída</option><option value="FALHOU">Falhou</option></Select></Field>{jobs.isError ? <ErrorState title="Fila indisponível" description="Confira sua permissão e a conexão." action={<Button onClick={() => void jobs.refetch()}>Tentar novamente</Button>} /> : !jobs.data?.items.length ? <EmptyState title="Fila vazia" description="Novas solicitações de comanda aparecerão aqui." /> : <ResponsiveTable items={jobs.data.items} columns={columns} getKey={(job) => job.id} caption="Fila de impressão" />}</div>;
}
