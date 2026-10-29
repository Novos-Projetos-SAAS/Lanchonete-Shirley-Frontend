"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { formatDateTime } from "@/lib/date";
import { queryKeys } from "@/lib/query-keys";
import { adminService, type AdminRecord } from "@/services/admin-service";
import { Badge, Button, EmptyState, ErrorState, Field, Input, PageHeader, ResponsiveTable, Select } from "@/components/ui";

export function LogsPage() {
  const [type, setType] = useState("");
  const [action, setAction] = useState("");
  const logs = useQuery({ queryKey: queryKeys.resource("logs", { tipo: type, acao: action }), queryFn: () => adminService.listResource("logs", { tipo: type, acao: action }) });
  const columns = [
    { key: "event", header: "Evento", render: (log: AdminRecord) => <div className="table-primary"><strong>{String(log.acao || "Evento")}</strong><small>{String(log.descricao || "Sem descrição")}</small></div> },
    { key: "type", header: "Tipo", render: (log: AdminRecord) => <Badge>{String(log.tipo || "AÇÃO")}</Badge> },
    { key: "date", header: "Data", render: (log: AdminRecord) => <span className="tabular">{formatDateTime(String(log.criado_em || ""))}</span> },
    { key: "request", header: "Request ID", render: (log: AdminRecord) => <code className="request-id">{String(log.request_id || "não informado")}</code>, hideOnMobile: true },
  ];
  return <div><PageHeader eyebrow="Rastro de auditoria" title="Logs" description="Consulta somente leitura. Os dados já chegam sanitizados pelo servidor." /><div className="toolbar"><label className="search-box"><Search aria-hidden /><span className="sr-only">Filtrar por ação</span><Input type="search" value={action} onChange={(event) => setAction(event.target.value)} placeholder="Ação, ex.: PEDIDO.STATUS" /></label><Field label="Tipo" htmlFor="log-type"><Select id="log-type" value={type} onChange={(event) => setType(event.target.value)}><option value="">Todos</option><option value="ACAO">Ação</option><option value="ERRO">Erro</option><option value="SEGURANCA">Segurança</option><option value="SISTEMA">Sistema</option></Select></Field></div>{logs.isError ? <ErrorState title="Logs indisponíveis" description="A consulta de auditoria não pôde ser concluída." action={<Button onClick={() => void logs.refetch()}>Tentar novamente</Button>} /> : !logs.data?.items.length ? <EmptyState title="Nenhum registro encontrado" description="Altere os filtros ou consulte outro período." /> : <ResponsiveTable items={logs.data.items} columns={columns} getKey={(log) => log.id} caption="Eventos de auditoria" />}</div>;
}
