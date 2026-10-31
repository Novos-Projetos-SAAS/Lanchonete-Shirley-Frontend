"use client";

import { useDeferredValue, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit3, Plus, RefreshCw, Search, Trash2 } from "lucide-react";
import { adminService, type AdminRecord } from "@/services/admin-service";
import { queryKeys } from "@/lib/query-keys";
import { ApiError } from "@/lib/api-client";
import { Badge, Button, Checkbox, ConfirmDialog, Dialog, EmptyState, ErrorState, Field, Input, PageHeader, Pagination, ResponsiveTable, RowActions, Select, Skeleton, Textarea } from "@/components/ui";
import { useToast } from "@/components/ui/toast";
import { PermissionGate } from "@/components/shared/permission-gate";

export interface ResourceField { name: string; label: string; type?: "text" | "number" | "money" | "url" | "textarea" | "boolean" | "select"; required?: boolean; hint?: string; options?: Array<{ value: string; label: string }> }
export interface ResourceConfig { resource: string; title: string; eyebrow: string; description: string; listPermission: string; managePermission: string; fields: ResourceField[]; primaryField?: string; guidance?: string }
type Values = Record<string, string | number | boolean | null>;

function initialValues(config: ResourceConfig): Values { return Object.fromEntries(config.fields.map((field) => [field.name, field.type === "boolean" ? false : field.type === "number" ? 0 : ""])); }
function recordValues(config: ResourceConfig, record: AdminRecord): Values { return Object.fromEntries(config.fields.map((field) => [field.name, (record[field.name] as string | number | boolean | null) ?? (field.type === "boolean" ? false : "")])); }

export function ResourcePage({ config }: { config: ResourceConfig }) {
  const { toast } = useToast(); const client = useQueryClient(); const [search, setSearch] = useState(""); const deferredSearch = useDeferredValue(search.trim()); const [page, setPage] = useState(1); const [open, setOpen] = useState(false); const [editing, setEditing] = useState<AdminRecord | null>(null); const [values, setValues] = useState<Values>(() => initialValues(config)); const [formError, setFormError] = useState("");
  const filters = { busca: deferredSearch, page };
  const result = useQuery({ queryKey: queryKeys.resource(config.resource, filters), queryFn: () => adminService.listResource(config.resource, filters) });
  function changeOpen(next: boolean) { setOpen(next); if (!next) { setEditing(null); setValues(initialValues(config)); setFormError(""); } }
  const save = useMutation({ mutationFn: () => {
    const body = { ...values } as Values;
    config.fields.filter((field) => field.type !== "boolean" && !field.required).forEach((field) => { if (body[field.name] === "") body[field.name] = null; });
    if (config.resource === "produtos" && !editing && body.tipo === "LANCHE") body.ativo = false;
    return editing ? adminService.updateResource(config.resource, editing.id, body) : adminService.createResource(config.resource, body);
  }, onSuccess: async () => { toast({ tone: "success", title: editing ? "Cadastro atualizado" : "Cadastro criado" }); setOpen(false); await client.invalidateQueries({ queryKey: ["resource", config.resource] }); }, onError: (error) => setFormError(error instanceof ApiError ? error.message : "Não foi possível salvar.") });
  const remove = useMutation({ mutationFn: (id: string) => adminService.deleteResource(config.resource, id), onSuccess: async () => { toast({ tone: "success", title: "Cadastro desativado" }); await client.invalidateQueries({ queryKey: ["resource", config.resource] }); }, onError: (error) => toast({ tone: "error", title: "Não foi possível desativar", description: error instanceof ApiError ? error.message : undefined }) });
  function edit(record: AdminRecord) { setEditing(record); setValues(recordValues(config, record)); setOpen(true); }
  const nameField = config.primaryField || "nome";
  const columns = [
    { key: "name", header: "Cadastro", render: (record: AdminRecord) => <div className="table-primary"><strong>{String(record[nameField] || `#${record.id}`)}</strong>{record.descricao && <small>{String(record.descricao)}</small>}</div> },
    { key: "id", header: "ID", render: (record: AdminRecord) => <span className="tabular">#{record.id}</span>, hideOnMobile: true },
    { key: "value", header: "Valor / ordem", render: (record: AdminRecord) => <div className="table-primary"><span>{resourceValue(record)}</span><small>Ordem {Number(record.ordem_exibicao ?? 0)}</small></div> },
    { key: "state", header: "Estado", render: (record: AdminRecord) => <div className="cluster cluster--compact"><Badge className={record.ativo === false ? "badge--muted" : "badge--success"}>{record.ativo === false ? "Inativo" : "Ativo"}</Badge>{record.disponivel_hoje === false && <Badge className="badge--muted">Indisponível hoje</Badge>}</div> },
    { key: "actions", header: "Ações", className: "table-actions", render: (record: AdminRecord) => <PermissionGate permission={config.managePermission}><RowActions label={`Ações de ${String(record[nameField] || record.id)}`}>{config.resource === "produtos" && <ProductAssociations product={record} />}<Button variant="ghost" size="sm" onClick={() => edit(record)}><Edit3 aria-hidden /> Editar</Button><ConfirmDialog destructive trigger={<Button variant="ghost" size="sm"><Trash2 aria-hidden /> Desativar</Button>} title="Desativar cadastro?" description="O histórico será preservado e o item deixará de aparecer onde aplicável." confirmLabel="Desativar" onConfirm={() => remove.mutate(record.id)} /></RowActions></PermissionGate> },
  ];
  return <div><PageHeader eyebrow={config.eyebrow} title={config.title} description={config.description} actions={<><Button variant="ghost" onClick={() => void result.refetch()}><RefreshCw aria-hidden /> Atualizar</Button><PermissionGate permission={config.managePermission}><Button onClick={() => setOpen(true)}><Plus aria-hidden /> Novo cadastro</Button></PermissionGate></>} />{config.guidance && <div className="guidance-card"><strong>Antes de publicar</strong><p>{config.guidance}</p></div>}<label className="search-box resource-search"><Search aria-hidden /><span className="sr-only">Buscar</span><Input type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder={`Buscar em ${config.title.toLocaleLowerCase("pt-BR")}`} /></label>{result.isLoading ? <div className="stack"><Skeleton className="skeleton--card" /><Skeleton className="skeleton--card" /></div> : result.isError ? <ErrorState title="Cadastros indisponíveis" description="Não foi possível consultar a API." action={<Button onClick={() => void result.refetch()}>Tentar novamente</Button>} /> : !result.data?.items.length ? <EmptyState title={`Nenhum cadastro em ${config.title.toLocaleLowerCase("pt-BR")}`} description="Cadastre o primeiro item quando estiver pronto." action={<PermissionGate permission={config.managePermission}><Button onClick={() => setOpen(true)}>Cadastrar agora</Button></PermissionGate>} /> : <ResponsiveTable items={result.data.items} columns={columns} getKey={(record) => record.id} caption={`Cadastros em ${config.title}`} />}{result.data && <Pagination page={page} totalPages={result.data.pagination.total_pages} totalItems={result.data.pagination.total} onPageChange={setPage} label={`Paginação de ${config.title}`} />}
    <Dialog open={open} onOpenChange={changeOpen} title={editing ? `Editar ${String(editing[nameField] || "cadastro")}` : `Novo cadastro em ${config.title}`} description="Preencha somente dados reais da operação." footer={<><Button variant="ghost" onClick={() => changeOpen(false)}>Cancelar</Button><Button loading={save.isPending} onClick={() => save.mutate()}>Salvar</Button></>}><div className="form-grid">{formError && <div className="form-error-summary" role="alert">{formError}</div>}{config.fields.map((field) => <ResourceInput key={field.name} field={field} value={values[field.name]} onChange={(value) => setValues((current) => ({ ...current, [field.name]: value }))} />)}</div></Dialog>
  </div>;
}

function resourceValue(record: AdminRecord) {
  const money = record.preco_base ?? record.preco ?? record.acrescimo;
  if (money != null && money !== "") return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(money));
  if (record.tipo) return String(record.tipo).toLocaleLowerCase("pt-BR");
  if (record.codigo) return String(record.codigo);
  return "—";
}

function ResourceInput({ field, value, onChange }: { field: ResourceField; value: Values[string]; onChange: (value: Values[string]) => void }) {
  const id = `resource-${field.name}`;
  if (field.type === "boolean") return <Checkbox checked={Boolean(value)} onChange={(event) => onChange(event.target.checked)}>{field.label}</Checkbox>;
  if (field.type === "textarea") return <Field label={field.label} htmlFor={id} required={field.required} hint={field.hint}><Textarea id={id} required={field.required} value={String(value ?? "")} onChange={(event) => onChange(event.target.value)} /></Field>;
  if (field.type === "select") return <Field label={field.label} htmlFor={id} required={field.required} hint={field.hint}><Select id={id} required={field.required} value={String(value ?? "")} onChange={(event) => onChange(event.target.value)}><option value="">Selecione</option>{field.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</Select></Field>;
  return <Field label={field.label} htmlFor={id} required={field.required} hint={field.hint}><Input id={id} type={field.type === "number" ? "number" : field.type === "url" ? "url" : "text"} inputMode={field.type === "number" ? "numeric" : field.type === "money" ? "decimal" : undefined} required={field.required} value={String(value ?? "")} onChange={(event) => onChange(field.type === "number" ? Number(event.target.value) : event.target.value)} /></Field>;
}

function ProductAssociations({ product }: { product: AdminRecord }) {
  const [open, setOpen] = useState(false); const [breads, setBreads] = useState<Record<string, boolean>>({}); const [extras, setExtras] = useState<Record<string, number>>({}); const { toast } = useToast();
  const breadList = useQuery({ queryKey: queryKeys.resource("tipos-pao", { ativo: true }), queryFn: () => adminService.listResource("tipos-pao", { ativo: true, limit: 100 }), enabled: false });
  const extraList = useQuery({ queryKey: queryKeys.resource("adicionais", { ativo: true }), queryFn: () => adminService.listResource("adicionais", { ativo: true, limit: 100 }), enabled: false });
  const links = useQuery({ queryKey: ["product-links", product.id], queryFn: () => adminService.productLinks(product.id), enabled: false });
  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) return;
    setBreads({});
    setExtras({});
    void Promise.all([breadList.refetch(), extraList.refetch(), links.refetch()]).then(([, , linkResult]) => {
      if (!linkResult.data) return;
      setBreads(Object.fromEntries(linkResult.data.tipos_pao.map((item) => [item.tipo_pao_id, item.ativo])));
      setExtras(Object.fromEntries(linkResult.data.adicionais.map((item) => [item.adicional_id, item.ativo ? item.max_quantidade_por_item : 0])));
    });
  }
  const save = useMutation({ mutationFn: () => Promise.all([adminService.replaceProductBreads(product.id, Object.entries(breads).filter(([, active]) => active).map(([tipo_pao_id]) => ({ tipo_pao_id, ativo: true }))), adminService.replaceProductAdditionals(product.id, Object.entries(extras).filter(([, max]) => max > 0).map(([adicional_id, max_quantidade_por_item]) => ({ adicional_id, max_quantidade_por_item, ativo: true })))]), onSuccess: () => { toast({ tone: "success", title: "Opções do produto atualizadas" }); setOpen(false); }, onError: (error) => toast({ tone: "error", title: "Não foi possível vincular opções", description: error instanceof ApiError ? error.message : undefined }) });
  const loading = links.isFetching || breadList.isFetching || extraList.isFetching;
  const failed = links.isError || breadList.isError || extraList.isError;
  return <Dialog open={open} onOpenChange={handleOpenChange} trigger={<Button variant="secondary" size="sm">Opções</Button>} title={`Pães e adicionais de ${String(product.nome || "produto")}`} description="O conjunto atual é carregado antes da edição. Salvar substitui todos os vínculos." footer={<><Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button><Button loading={save.isPending} disabled={loading || failed || !links.data} onClick={() => save.mutate()}>Salvar vínculos</Button></>}><div className="stack">{failed ? <ErrorState compact title="Vínculos indisponíveis" description="Nada foi alterado. Feche e tente novamente antes de substituir o conjunto." /> : loading ? <p className="muted">Carregando vínculos atuais…</p> : <><div><h3>Pães permitidos</h3>{breadList.data?.items.map((bread) => <Checkbox key={bread.id} checked={!!breads[bread.id]} onChange={(event) => setBreads((current) => ({ ...current, [bread.id]: event.target.checked }))}>{String(bread.nome)}</Checkbox>)}</div><div><h3>Adicionais e limite por item</h3>{extraList.data?.items.map((extra) => <div className="association-row" key={extra.id}><Checkbox checked={(extras[extra.id] || 0) > 0} onChange={(event) => setExtras((current) => ({ ...current, [extra.id]: event.target.checked ? 1 : 0 }))}>{String(extra.nome)}</Checkbox>{(extras[extra.id] || 0) > 0 && <label>Máximo <Input type="number" min={1} max={20} value={extras[extra.id]} onChange={(event) => setExtras((current) => ({ ...current, [extra.id]: Number(event.target.value) }))} /></label>}</div>)}</div></>}</div></Dialog>;
}

export const resourceConfigs: Record<string, ResourceConfig> = {
  categorias: { resource: "categorias", title: "Categorias", eyebrow: "Organização do cardápio", description: "Agrupe itens para o cliente encontrar o que quer sem esforço.", listPermission: "categorias.listar", managePermission: "categorias.gerenciar", fields: [{ name: "nome", label: "Nome", required: true }, { name: "slug", label: "Slug", required: true, hint: "Minúsculas, números e hífen. Ex.: lanches-artesanais" }, { name: "descricao", label: "Descrição", type: "textarea" }, { name: "ordem_exibicao", label: "Ordem", type: "number" }, { name: "ativo", label: "Categoria ativa", type: "boolean" }] },
  produtos: { resource: "produtos", title: "Produtos", eyebrow: "Cardápio operacional", description: "Cadastre preços, disponibilidade e apresentação dos itens.", listPermission: "produtos.listar", managePermission: "produtos.gerenciar", guidance: "Lanches novos são criados inativos. Depois, vincule pelo menos um pão ativo, configure adicionais e somente então ative o produto.", fields: [{ name: "categoria_id", label: "ID da categoria", required: true, hint: "Use o ID exibido na tela Categorias." }, { name: "nome", label: "Nome", required: true }, { name: "descricao", label: "Descrição", type: "textarea" }, { name: "tipo", label: "Tipo", type: "select", required: true, options: [{ value: "LANCHE", label: "Lanche" }, { value: "PORCAO", label: "Porção" }, { value: "BEBIDA", label: "Bebida" }, { value: "OUTRO", label: "Outro" }] }, { name: "preco_base", label: "Preço base", type: "money", hint: "Decimal com ponto. Ex.: 18.50" }, { name: "imagem_url", label: "URL da imagem", type: "url" }, { name: "ordem_exibicao", label: "Ordem", type: "number" }, { name: "ativo", label: "Produto ativo", type: "boolean" }, { name: "disponivel_hoje", label: "Disponível hoje", type: "boolean" }] },
  "tipos-pao": { resource: "tipos-pao", title: "Pães", eyebrow: "Montagem de lanches", description: "Controle tipos de pão e seus acréscimos.", listPermission: "paes.listar", managePermission: "paes.gerenciar", fields: [{ name: "codigo", label: "Código", required: true, hint: "Maiúsculas e sublinhado. Ex.: FRANCES" }, { name: "nome", label: "Nome", required: true }, { name: "acrescimo", label: "Acréscimo", type: "money", hint: "Pão francês ativo exige valor maior que zero." }, { name: "ordem_exibicao", label: "Ordem", type: "number" }, { name: "ativo", label: "Pão ativo", type: "boolean" }] },
  adicionais: { resource: "adicionais", title: "Adicionais", eyebrow: "Complementos", description: "Gerencie complementos, preços e disponibilidade do dia.", listPermission: "adicionais.listar", managePermission: "adicionais.gerenciar", fields: [{ name: "nome", label: "Nome", required: true }, { name: "descricao", label: "Descrição", type: "textarea" }, { name: "preco", label: "Preço", type: "money", required: true }, { name: "ordem_exibicao", label: "Ordem", type: "number" }, { name: "ativo", label: "Adicional ativo", type: "boolean" }, { name: "disponivel_hoje", label: "Disponível hoje", type: "boolean" }] },
  "metodos-pagamento": { resource: "metodos-pagamento", title: "Formas de pagamento", eyebrow: "Recebimento", description: "Mostre ao cliente somente as formas que a loja aceita.", listPermission: "metodos_pagamento.listar", managePermission: "metodos_pagamento.gerenciar", fields: [{ name: "codigo", label: "Código", required: true, hint: "Maiúsculas e sublinhado. Ex.: PIX" }, { name: "nome", label: "Nome", required: true }, { name: "ordem_exibicao", label: "Ordem", type: "number" }, { name: "ativo", label: "Forma ativa", type: "boolean" }] },
};

