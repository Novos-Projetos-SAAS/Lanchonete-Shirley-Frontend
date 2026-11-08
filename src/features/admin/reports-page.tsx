"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, BarChart3, BookOpen, Boxes, CalendarDays, ChevronLeft, ChevronRight, Download, FileDown, PackageSearch, ReceiptText, Search, ShoppingBasket, Truck, UsersRound, Utensils } from "lucide-react";
import { apiErrorMessage } from "@/lib/api-errors";
import { formatDateTime, localDate } from "@/lib/date";
import { formatCurrency } from "@/lib/money";
import { adminService } from "@/services/admin-service";
import type { ReportColumnConfig, ReportFilterConfig, ReportMetadata, ReportPreview } from "@/types/domain";
import { Button, Card, EmptyState, ErrorState, Field, Input, PageHeader, Select, Skeleton } from "@/components/ui";
import { useToast } from "@/components/ui/toast";

type FilterValue = string | number | boolean;
type Filters = Record<string, FilterValue>;

const reportIcons = {
  faturamento_periodo: BarChart3, historico_vendas: ReceiptText, saida_adicionais: Utensils,
  vendas_paes: Boxes, clientes_frequentes: UsersRound, listagem_produtos: ShoppingBasket,
  listagem_categorias: BookOpen, listagem_paes: Boxes, listagem_pagamentos: ReceiptText,
  ranking_produtos: PackageSearch, vendas_categoria: BarChart3, entregas_retiradas: Truck,
} as const;

const staticOptions: Record<string, Array<{ value: string; label: string }>> = {
  status_pedido: [
    { value: "PENDENTE", label: "Pendente" }, { value: "EM_PREPARO", label: "Em preparo" },
    { value: "PRONTO_PARA_RETIRADA", label: "Pronto para retirada" }, { value: "SAIU_PARA_ENTREGA", label: "Saiu para entrega" },
    { value: "ENTREGUE", label: "Entregue" }, { value: "CANCELADO", label: "Cancelado" },
  ],
  status_pagamento: [{ value: "PENDENTE", label: "Pendente" }, { value: "PAGO", label: "Pago" }, { value: "ESTORNADO", label: "Estornado" }],
  tipo_entrega: [{ value: "ENTREGA", label: "Entrega" }, { value: "RETIRADA", label: "Retirada" }],
  canal_pedido: [{ value: "WEB", label: "Site" }, { value: "PAINEL", label: "Painel" }],
  tipo_produto: [{ value: "LANCHE", label: "Lanche" }, { value: "PORCAO", label: "Porção" }, { value: "BEBIDA", label: "Bebida" }, { value: "OUTRO", label: "Outro" }],
};

function parseDate(value: unknown) {
  const [year, month, day] = String(value).slice(0, 10).split("-");
  return year && month && day ? `${day}/${month}/${year}` : String(value ?? "—");
}

export function displayReportValue(value: unknown, type: ReportColumnConfig["tipo"]) {
  if (value === null || value === undefined || value === "") return "—";
  if (type === "money") return formatCurrency(String(value));
  if (type === "integer") return new Intl.NumberFormat("pt-BR").format(Number(value));
  if (type === "percent") return `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(Number(value))}%`;
  if (type === "boolean") return value === true || value === "true" ? "Sim" : "Não";
  if (type === "date") return parseDate(value);
  if (type === "datetime") return formatDateTime(String(value));
  return String(value).replaceAll("_", " ");
}

function downloadResponse(response: Response, fallback: string) {
  return response.blob().then((blob) => {
    const disposition = response.headers.get("content-disposition") || "";
    const filename = disposition.match(/filename="?([^";]+)"?/i)?.[1] || fallback;
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url; anchor.download = filename;
    document.body.appendChild(anchor); anchor.click(); anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
  });
}

export function ReportsPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const catalog = useQuery({ queryKey: ["report-catalog"], queryFn: adminService.reportCatalog, staleTime: 5 * 60_000 });
  const normalizedSearch = search.trim().toLocaleLowerCase("pt-BR");
  const groups = useMemo(() => {
    const visible = (catalog.data || []).filter((report) => !normalizedSearch || `${report.nome} ${report.descricao}`.toLocaleLowerCase("pt-BR").includes(normalizedSearch));
    return [
      { key: "GERENCIAL", label: "Gerenciais", description: "Vendas, operação e desempenho.", items: visible.filter((report) => report.grupo === "GERENCIAL") },
      { key: "CADASTRAL", label: "Cadastrais", description: "Produtos e configurações do catálogo.", items: visible.filter((report) => report.grupo === "CADASTRAL") },
    ];
  }, [catalog.data, normalizedSearch]);

  async function downloadCsv() {
    try { await downloadResponse(await adminService.salesCsv(localDate(-30), localDate()), "vendas.csv"); }
    catch { toast({ tone: "error", title: "Não foi possível exportar o CSV" }); }
  }

  return <div><PageHeader eyebrow="Decisões com dados" title="Relatórios" description="Escolha um relatório, confirme os filtros e gere uma prévia antes de exportar." actions={<Button variant="secondary" onClick={() => void downloadCsv()}><Download aria-hidden /> Vendas em CSV</Button>} /><div className="report-catalog-toolbar"><label className="report-search" htmlFor="report-search"><Search aria-hidden /><span className="sr-only">Buscar relatório</span><Input id="report-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar relatório" /></label></div>{catalog.isLoading ? <div className="report-catalog-grid"><Skeleton className="skeleton--hero" /><Skeleton className="skeleton--hero" /></div> : catalog.isError ? <ErrorState title="Catálogo indisponível" description="Não foi possível carregar os relatórios autorizados." action={<Button onClick={() => void catalog.refetch()}>Tentar novamente</Button>} /> : groups.every((group) => !group.items.length) ? <EmptyState title="Nenhum relatório encontrado" description="Tente buscar por vendas, produtos ou pagamentos." /> : <div className="report-groups">{groups.filter((group) => group.items.length).map((group) => <section key={group.key} aria-labelledby={`report-group-${group.key}`}><div className="report-group-heading"><div><h2 id={`report-group-${group.key}`}>{group.label}</h2><p>{group.description}</p></div><span>{group.items.length} {group.items.length === 1 ? "relatório" : "relatórios"}</span></div><div className="report-catalog-grid">{group.items.map((report) => { const Icon = reportIcons[report.codigo as keyof typeof reportIcons] || BarChart3; return <Card className="report-catalog-card" key={report.codigo}><div className="report-catalog-card__icon"><Icon aria-hidden /></div><div><h3>{report.nome}</h3><p>{report.descricao}</p></div><Button asChild variant="secondary"><Link href={`/admin/relatorios/${report.codigo}`}>Gerar relatório <ChevronRight aria-hidden /></Link></Button></Card>; })}</div></section>)}</div>}</div>;
}

function ReportFilterField({ filter, value, onChange }: { filter: ReportFilterConfig; value: FilterValue | undefined; onChange: (value: FilterValue | undefined) => void }) {
  const options = staticOptions[filter.opcoes || ""] || [];
  const source = useQuery({ queryKey: ["report-filter-options", filter.fonte], queryFn: () => adminService.reportFilterOptions(filter.fonte || ""), enabled: Boolean(filter.fonte), staleTime: 5 * 60_000 });
  const id = `report-filter-${filter.chave}`;
  if (filter.tipo === "select") return <Field label={filter.rotulo} htmlFor={id} required={filter.obrigatorio} hint={source.isError ? "Não foi possível carregar as opções." : undefined}><Select id={id} value={String(value ?? "")} onChange={(event) => onChange(event.target.value || undefined)}><option value="">Todos</option>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}{source.data?.map((option) => <option key={option.id} value={option.id}>{option.nome}</option>)}</Select></Field>;
  if (filter.tipo === "boolean") return <Field label={filter.rotulo} htmlFor={id}><Select id={id} value={value === undefined ? "" : String(value)} onChange={(event) => onChange(event.target.value === "" ? undefined : event.target.value === "true")}><option value="">Todos</option><option value="true">Sim</option><option value="false">Não</option></Select></Field>;
  return <Field label={filter.rotulo} htmlFor={id} required={filter.obrigatorio}><Input id={id} type={filter.tipo === "date" ? "date" : filter.tipo === "number" ? "number" : "text"} value={String(value ?? "")} min={filter.minimo} max={filter.maximo} maxLength={filter.maximo_caracteres} onChange={(event) => onChange(event.target.value === "" ? undefined : filter.tipo === "number" ? Number(event.target.value) : event.target.value)} /></Field>;
}

export function validateReportFilters(metadata: ReportMetadata, filters: Filters) {
  if (metadata.filtros_config.some((filter) => filter.obrigatorio && (filters[filter.chave] === undefined || filters[filter.chave] === ""))) return false;
  const start = filters.data_inicio; const end = filters.data_fim;
  return !(typeof start === "string" && typeof end === "string" && start > end);
}

export function ReportBuilderPage() {
  const params = useParams<{ codigo: string }>();
  const code = params.codigo;
  const metadata = useQuery({ queryKey: ["report-metadata", code], queryFn: () => adminService.reportMetadata(code), retry: false });
  if (metadata.isLoading) return <div><Skeleton className="skeleton--title" /><Skeleton className="skeleton--hero" /></div>;
  if (metadata.isError || !metadata.data) return <ErrorState title="Relatório indisponível" description="O relatório não existe ou seu perfil não pode acessá-lo." action={<Button asChild variant="secondary"><Link href="/admin/relatorios">Voltar aos relatórios</Link></Button>} />;
  return <ReportBuilder key={code} code={code} report={metadata.data} />;
}

function ReportBuilder({ code, report }: { code: string; report: ReportMetadata }) {
  const { toast } = useToast();
  const [filters, setFilters] = useState<Filters>(() => ({ ...report.filtros_padrao }));
  const [preview, setPreview] = useState<ReportPreview | null>(null);
  const [confirmedFilters, setConfirmedFilters] = useState<Filters | null>(null);
  const generation = useMutation({
    mutationFn: ({ page, currentFilters }: { page: number; currentFilters: Filters }) => adminService.generateReport(code, currentFilters, page, 50),
    onSuccess: (result, variables) => { setPreview(result); setConfirmedFilters({ ...variables.currentFilters }); },
    onError: (error) => toast({ tone: "error", title: "Não foi possível gerar o relatório", description: apiErrorMessage(error, "Revise os filtros e tente novamente.") }),
  });
  const pdf = useMutation({
    mutationFn: async () => { if (!confirmedFilters) throw new Error("Gere a prévia primeiro."); return adminService.reportPdf(code, confirmedFilters); },
    onSuccess: (response) => void downloadResponse(response, `relatorio-${code}.pdf`),
    onError: (error) => toast({ tone: "error", title: "Não foi possível exportar o PDF", description: apiErrorMessage(error, "Gere a prévia novamente e tente exportar.") }),
  });
  const changeFilter = (key: string, value: FilterValue | undefined) => {
    setFilters((current) => { const next = { ...current }; if (value === undefined) delete next[key]; else next[key] = value; return next; });
    setPreview(null); setConfirmedFilters(null); generation.reset();
  };
  const isValid = validateReportFilters(report, filters);
  return <div><Link className="back-link" href="/admin/relatorios"><ArrowLeft aria-hidden /> Voltar aos relatórios</Link><PageHeader eyebrow={report.grupo === "GERENCIAL" ? "Relatório gerencial" : "Relatório cadastral"} title={report.nome} description={report.descricao} /><Card className="report-builder"><div className="report-builder__heading"><div><CalendarDays aria-hidden /><div><h2>Filtros</h2><p>A prévia e o PDF usarão exatamente os valores confirmados aqui.</p></div></div></div><div className="report-filter-grid">{report.filtros_config.map((filter) => <ReportFilterField key={filter.chave} filter={filter} value={filters[filter.chave]} onChange={(value) => changeFilter(filter.chave, value)} />)}</div><div className="report-builder__actions"><Button loading={generation.isPending} disabled={!isValid} onClick={() => generation.mutate({ page: 1, currentFilters: filters })}><BarChart3 aria-hidden /> Gerar relatório</Button>{!isValid && <p role="status">Preencha o período e mantenha a data inicial anterior à final.</p>}</div></Card>{generation.isPending ? <Card className="report-preview-loading" aria-busy="true"><Skeleton className="skeleton--title" /><Skeleton className="skeleton--hero" /></Card> : preview ? <ReportPreviewPanel preview={preview} exporting={pdf.isPending} onExport={() => pdf.mutate()} onPage={(page) => generation.mutate({ page, currentFilters: confirmedFilters || filters })} /> : <EmptyState title="A prévia aparecerá aqui" description="Confirme os filtros e selecione Gerar relatório. Nenhum PDF será exportado antes dessa etapa." />}</div>;
}

function ReportPreviewPanel({ preview, exporting, onExport, onPage }: { preview: ReportPreview; exporting: boolean; onExport: () => void; onPage: (page: number) => void }) {
  return <section className="report-preview" aria-labelledby="report-preview-title"><div className="report-preview__heading"><div><p className="eyebrow">Prévia confirmada</p><h2 id="report-preview-title">{preview.relatorio.nome}</h2><p>{preview.paginacao.total} {preview.paginacao.total === 1 ? "registro" : "registros"} · gerado em {formatDateTime(preview.gerado_em)}</p></div><Button variant="secondary" loading={exporting} onClick={onExport}><FileDown aria-hidden /> Exportar PDF</Button></div>{preview.filtros_aplicados.length > 0 && <dl className="report-applied-filters">{preview.filtros_aplicados.map((filter) => <div key={filter.chave}><dt>{filter.rotulo}</dt><dd>{filter.chave.startsWith("data_") ? parseDate(filter.valor) : String(filter.valor).replaceAll("_", " ")}</dd></div>)}</dl>}{Object.keys(preview.totais).length > 0 && <div className="report-totals">{Object.entries(preview.totais).map(([key, value]) => { const column = preview.colunas.find((item) => item.chave === key); return <div key={key}><span>{column?.rotulo || key.replaceAll("_", " ")}</span><strong>{displayReportValue(value, column?.tipo || "text")}</strong></div>; })}</div>}{preview.dados.length ? <div className="report-data"><div className="report-table-wrap"><table><caption className="sr-only">Dados do relatório {preview.relatorio.nome}</caption><thead><tr>{preview.colunas.map((column) => <th scope="col" key={column.chave}>{column.rotulo}</th>)}</tr></thead><tbody>{preview.dados.map((row, index) => <tr key={`${preview.paginacao.page}-${index}`}>{preview.colunas.map((column) => <td className={["money", "integer", "percent"].includes(column.tipo) ? "report-cell--number" : undefined} key={column.chave}>{displayReportValue(row[column.chave], column.tipo)}</td>)}</tr>)}</tbody></table></div><div className="report-mobile-list">{preview.dados.map((row, index) => <article key={`${preview.paginacao.page}-mobile-${index}`}>{preview.colunas.map((column) => <div key={column.chave}><span>{column.rotulo}</span><strong>{displayReportValue(row[column.chave], column.tipo)}</strong></div>)}</article>)}</div></div> : <EmptyState compact title="Nenhum registro encontrado" description={preview.mensagem || "Não há dados para os filtros informados."} />}{preview.paginacao.total_pages > 1 && <nav className="report-pagination" aria-label="Paginação da prévia"><Button variant="ghost" disabled={preview.paginacao.page <= 1} onClick={() => onPage(preview.paginacao.page - 1)}><ChevronLeft aria-hidden /> Anterior</Button><span>Página {preview.paginacao.page} de {preview.paginacao.total_pages}</span><Button variant="ghost" disabled={preview.paginacao.page >= preview.paginacao.total_pages} onClick={() => onPage(preview.paginacao.page + 1)}>Próxima <ChevronRight aria-hidden /></Button></nav>}</section>;
}

