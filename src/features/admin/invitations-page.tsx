"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, MailPlus, RotateCw, Search, ShieldX } from "lucide-react";
import { PermissionGate } from "@/components/shared/permission-gate";
import { Badge, Button, ConfirmDialog, Dialog, EmptyState, ErrorState, Field, Input, PageHeader, Pagination, ResponsiveTable, RowActions, Select } from "@/components/ui";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/features/auth/auth-provider";
import { ApiError } from "@/lib/api-client";
import { formatDateTime } from "@/lib/date";
import { queryKeys } from "@/lib/query-keys";
import { adminService } from "@/services/admin-service";
import type { Invitation, InvitationSecretResponse } from "@/types/domain";

const statusLabel = { PENDENTE: "Pendente", ACEITO: "Aceito", EXPIRADO: "Expirado", REVOGADO: "Revogado" } as const;

export function InvitationsPage() {
  const { hasPermission } = useAuth();
  const { toast } = useToast();
  const client = useQueryClient();
  const canManage = hasPermission("convites.gerenciar");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [secret, setSecret] = useState<{ expiresAt: string; link: string } | null>(null);
  const [form, setForm] = useState({ email: "", nivel_acesso_id: "" });
  const [error, setError] = useState("");
  const filters = { busca: search, status, page };
  const invitations = useQuery({ queryKey: queryKeys.invitations(filters), queryFn: () => adminService.invitations(filters) });
  const levels = useQuery({ queryKey: ["invitation-levels"], queryFn: adminService.invitationLevels, enabled: canManage && createOpen });

  function reveal(response: InvitationSecretResponse) {
    const link = `${window.location.origin}/convite#token=${encodeURIComponent(response.token)}`;
    setSecret({ expiresAt: response.convite.expira_em, link });
  }

  function notifyError(cause: Error) {
    setError(cause instanceof ApiError ? cause.message : "Não foi possível concluir a operação.");
  }

  async function refresh() {
    await client.invalidateQueries({ queryKey: ["invitations"] });
  }

  const create = useMutation({
    mutationFn: () => adminService.createInvitation(form),
    onSuccess: async (response) => {
      setCreateOpen(false);
      setForm({ email: "", nivel_acesso_id: "" });
      reveal(response);
      create.reset();
      await refresh();
    },
    onError: notifyError,
  });
  const reissue = useMutation({
    mutationFn: adminService.reissueInvitation,
    onSuccess: async (response) => { reveal(response); reissue.reset(); await refresh(); },
    onError: (cause) => toast({ tone: "error", title: "Não foi possível reemitir", description: cause instanceof ApiError ? cause.message : undefined }),
  });
  const revoke = useMutation({
    mutationFn: adminService.revokeInvitation,
    onSuccess: async () => { toast({ tone: "success", title: "Convite revogado" }); await refresh(); },
    onError: (cause) => toast({ tone: "error", title: "Não foi possível revogar", description: cause instanceof ApiError ? cause.message : undefined }),
  });

  async function copyLink() {
    if (!secret) return;
    try {
      await navigator.clipboard.writeText(secret.link);
      toast({ tone: "success", title: "Link copiado" });
    } catch {
      toast({ tone: "error", title: "Não foi possível copiar", description: "Selecione o link e copie manualmente." });
    }
  }

  const columns = [
    { key: "email", header: "E-mail", render: (item: Invitation) => <strong>{item.email}</strong> },
    { key: "nivel", header: "Nível", render: (item: Invitation) => <span>{item.nivel || `#${item.nivel_acesso_id}`}</span> },
    { key: "status", header: "Estado", render: (item: Invitation) => <Badge className={`invite-status invite-status--${item.status.toLowerCase()}`}>{statusLabel[item.status]}</Badge> },
    { key: "expires", header: "Validade", render: (item: Invitation) => <span className="tabular">{formatDateTime(item.expira_em)}</span> },
    { key: "created", header: "Criado", render: (item: Invitation) => <span className="tabular">{formatDateTime(item.criado_em)}</span>, hideOnMobile: true },
    { key: "actions", header: "Ações", className: "table-actions", render: (item: Invitation) => canManage && item.status !== "ACEITO" ? <RowActions label={`Ações do convite para ${item.email}`}><Button variant="ghost" size="sm" loading={reissue.isPending} onClick={() => reissue.mutate(item.id)}><RotateCw aria-hidden /> Reemitir</Button>{item.status === "PENDENTE" && <ConfirmDialog destructive trigger={<Button variant="ghost" size="sm"><ShieldX aria-hidden /> Revogar</Button>} title="Revogar este convite?" description="O link deixará de funcionar imediatamente." confirmLabel="Revogar" onConfirm={() => revoke.mutate(item.id)} />}</RowActions> : <span className="muted">Sem ações</span> },
  ];

  return <div><PageHeader eyebrow="Acesso inicial" title="Convites" description="Crie links de uso único. O segredo aparece somente após criar ou reemitir e não volta a ser exibido." actions={<PermissionGate permission="convites.gerenciar"><Button onClick={() => { setError(""); setCreateOpen(true); }}><MailPlus aria-hidden /> Novo convite</Button></PermissionGate>} /><div className="toolbar invitations-toolbar"><label className="search-box"><Search aria-hidden /><span className="sr-only">Buscar convite por e-mail</span><Input type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Buscar por e-mail" /></label><Field label="Estado" htmlFor="invitation-status"><Select id="invitation-status" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}><option value="">Todos</option>{Object.entries(statusLabel).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</Select></Field></div>{invitations.isLoading ? <p className="muted" aria-live="polite">Carregando convites…</p> : invitations.isError ? <ErrorState title="Convites indisponíveis" description="A consulta não pôde ser concluída." action={<Button onClick={() => void invitations.refetch()}>Tentar novamente</Button>} /> : !invitations.data?.items.length ? <EmptyState title="Nenhum convite encontrado" description="Crie um convite ou ajuste os filtros." /> : <ResponsiveTable items={invitations.data.items} columns={columns} getKey={(item) => item.id} caption="Convites de colaboradores" />}{invitations.data && <Pagination page={page} totalPages={invitations.data.pagination.total_pages} totalItems={invitations.data.pagination.total} onPageChange={setPage} label="Paginação dos convites" />}
    <Dialog open={createOpen} onOpenChange={setCreateOpen} title="Novo convite" description="Informe o e-mail e a responsabilidade inicial do colaborador." footer={<><Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancelar</Button><Button loading={create.isPending} disabled={!form.email || !form.nivel_acesso_id || levels.isError} onClick={() => create.mutate()}>Criar convite</Button></>}><div className="form-grid">{error && <div className="form-error-summary" role="alert">{error}</div>}<Field label="E-mail" htmlFor="invitation-email" required><Input id="invitation-email" type="email" autoComplete="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} /></Field><Field label="Nível de acesso" htmlFor="invitation-level" required hint="Permissões individuais podem ser ajustadas depois do aceite."><Select id="invitation-level" value={form.nivel_acesso_id} onChange={(event) => setForm((current) => ({ ...current, nivel_acesso_id: event.target.value }))}><option value="">Selecione</option>{levels.data?.map((level) => <option value={level.id} key={level.id}>{String(level.nome)}</option>)}</Select></Field>{levels.isError && <p className="field__error" role="alert">Não foi possível carregar os níveis de acesso.</p>}</div></Dialog>
    <Dialog open={!!secret} onOpenChange={(open) => { if (!open) setSecret(null); }} title="Link de convite pronto" description="Copie agora e envie por um canal confiável. Este link não será mostrado novamente." footer={<Button onClick={() => void copyLink()}><Copy aria-hidden /> Copiar link</Button>}><Field label="Link de uso único" htmlFor="invitation-link" hint={`Válido até ${secret ? formatDateTime(secret.expiresAt) : ""}.`}><Input id="invitation-link" readOnly value={secret?.link || ""} onFocus={(event) => event.currentTarget.select()} /></Field></Dialog>
  </div>;
}
