"use client";

import { useDeferredValue, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { KeyRound, MailPlus, Plus, Search, ShieldCheck, Trash2 } from "lucide-react";
import { ApiError } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { adminService, type AdminRecord } from "@/services/admin-service";
import { Badge, Button, Checkbox, ConfirmDialog, Dialog, EmptyState, ErrorState, Field, Input, PageHeader, Pagination, ResponsiveTable, RowActions, Select, Skeleton } from "@/components/ui";
import { useToast } from "@/components/ui/toast";
import { PermissionGate } from "@/components/shared/permission-gate";
import { useAuth } from "@/features/auth/auth-provider";

export function UsersPage() {
  const client = useQueryClient();
  const { toast } = useToast();
  const { user: currentUser, hasPermission } = useAuth();
  const canCreate = hasPermission("usuarios.criar") && hasPermission("permissoes.listar");
  const canEditPermissions = hasPermission("permissoes.editar") && hasPermission("permissoes.listar");
  const canResetPassword = hasPermission("usuarios.redefinir_senha");
  const canDeactivate = hasPermission("usuarios.desativar");
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search.trim());
  const [active, setActive] = useState("");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [permissionsUser, setPermissionsUser] = useState<AdminRecord | null>(null);
  const [permissionsLoadingId, setPermissionsLoadingId] = useState<string | null>(null);
  const [resetUser, setResetUser] = useState<AdminRecord | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [password, setPassword] = useState("");
  const [form, setForm] = useState({ nome: "", email: "", senha: "", nivel_acesso_id: "" });
  const [error, setError] = useState("");
  const filters = { busca: deferredSearch, ativo: active === "" ? undefined : active === "true", page };
  const users = useQuery({ queryKey: queryKeys.resource("usuarios", filters), queryFn: () => adminService.listResource("usuarios", filters) });
  const levels = useQuery({ queryKey: ["access-levels"], queryFn: adminService.accessLevels, enabled: createOpen && canCreate });
  const permissions = useQuery({ queryKey: ["permissions"], queryFn: adminService.permissionCatalog, enabled: !!permissionsUser && canEditPermissions });
  const create = useMutation({ mutationFn: () => adminService.createResource("usuarios", form), onSuccess: async () => { toast({ tone: "success", title: "Colaborador criado" }); setCreateOpen(false); setForm({ nome: "", email: "", senha: "", nivel_acesso_id: "" }); await client.invalidateQueries({ queryKey: ["resource", "usuarios"] }); }, onError: handleError });
  const deactivate = useMutation({ mutationFn: (id: string) => adminService.deleteResource("usuarios", id), onSuccess: async () => { toast({ tone: "success", title: "Acesso desativado" }); if (page > 1 && users.data?.items.length === 1) setPage((current) => current - 1); await client.invalidateQueries({ queryKey: ["resource", "usuarios"] }); }, onError: handleError });
  const savePermissions = useMutation({ mutationFn: () => adminService.setUserPermissions(permissionsUser!.id, selectedPermissions), onSuccess: () => { toast({ tone: "success", title: "Permissões atualizadas", description: "Sessões afetadas foram encerradas." }); setPermissionsUser(null); }, onError: handleError });
  const reset = useMutation({ mutationFn: () => adminService.resetUserPassword(resetUser!.id, password), onSuccess: () => { toast({ tone: "success", title: "Senha redefinida", description: "As sessões do colaborador foram encerradas." }); setResetUser(null); setPassword(""); }, onError: handleError });

  async function openPermissions(user: AdminRecord) {
    setError(""); setPermissionsLoadingId(user.id);
    try {
      const detail = await adminService.getResource<AdminRecord>("usuarios", user.id);
      setSelectedPermissions(Array.isArray(detail.permissoes) ? detail.permissoes.map(String) : []);
      setPermissionsUser(detail);
    } catch (cause) { handleError(cause as Error); }
    finally { setPermissionsLoadingId(null); }
  }
  function handleError(cause: Error) { setError(cause instanceof ApiError ? cause.message : "Não foi possível concluir."); }
  if (users.isError) return <ErrorState title="Equipe indisponível" description="Confira sua permissão e tente novamente." action={<Button onClick={() => void users.refetch()}>Tentar novamente</Button>} />;

  const columns = [
    { key: "name", header: "Colaborador", render: (user: AdminRecord) => <div className="table-primary"><strong>{String(user.nome)}</strong><small>{String(user.email)}</small></div> },
    { key: "level", header: "Nível", render: (user: AdminRecord) => <span>{String(user.nivel || user.nivel_acesso_id || "—")}</span> },
    { key: "state", header: "Estado", render: (user: AdminRecord) => <Badge className={user.ativo === false ? "badge--muted" : "badge--success"}>{user.ativo === false ? "Inativo" : "Ativo"}</Badge> },
    { key: "actions", header: "Ações", className: "table-actions", render: (user: AdminRecord) => {
      const isActive = user.ativo !== false;
      const isOtherUser = currentUser?.id !== user.id;
      const hasActions = isActive && (canEditPermissions || (isOtherUser && (canResetPassword || canDeactivate)));
      if (!hasActions) return <span className="muted">Sem ações</span>;
      return <RowActions label={`Ações de ${String(user.nome)}`}>{canEditPermissions && <Button variant="ghost" size="sm" loading={permissionsLoadingId === user.id} onClick={() => void openPermissions(user)}><ShieldCheck aria-hidden /> Permissões</Button>}{isOtherUser && canResetPassword && <Button variant="ghost" size="sm" onClick={() => { setResetUser(user); setError(""); }}><KeyRound aria-hidden /> Redefinir senha</Button>}{isOtherUser && canDeactivate && <ConfirmDialog destructive trigger={<Button variant="ghost" size="sm"><Trash2 aria-hidden /> Desativar</Button>} title="Desativar colaborador?" description="As sessões e o acesso deste usuário serão encerrados." confirmLabel="Desativar" onConfirm={() => deactivate.mutate(user.id)} />}</RowActions>;
    } },
  ];

  return <div><PageHeader eyebrow="Acessos e responsabilidades" title="Equipe" description="Gerencie colaboradores, permissões e recuperação de acesso." actions={<><PermissionGate permission="convites.listar"><Button asChild variant="secondary"><Link href="/admin/convites"><MailPlus aria-hidden /> Ver convites</Link></Button></PermissionGate>{canCreate && <Button onClick={() => { setError(""); setCreateOpen(true); }}><Plus aria-hidden /> Criar diretamente</Button>}</>} /><div className="toolbar"><label className="search-box"><Search aria-hidden /><span className="sr-only">Buscar colaborador</span><Input type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Buscar por nome ou e-mail" /></label><Field label="Estado" htmlFor="user-active-filter"><Select id="user-active-filter" value={active} onChange={(event) => { setActive(event.target.value); setPage(1); }}><option value="">Todos</option><option value="true">Ativos</option><option value="false">Inativos</option></Select></Field></div>{users.isLoading ? <div className="stack" aria-label="Carregando equipe"><Skeleton className="skeleton--card" /><Skeleton className="skeleton--card" /></div> : !users.data?.items.length ? <EmptyState title="Nenhum colaborador encontrado" description="Ajuste a busca ou o filtro de estado." /> : <ResponsiveTable items={users.data.items} columns={columns} getKey={(user) => user.id} caption="Colaboradores da equipe" />}{users.data && <Pagination page={page} totalPages={users.data.pagination.total_pages} totalItems={users.data.pagination.total} onPageChange={setPage} label="Paginação da equipe" />}
    <Dialog open={createOpen} onOpenChange={setCreateOpen} title="Criar colaborador diretamente" description="Prefira convites quando a pessoa puder definir a própria senha." footer={<><Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancelar</Button><Button loading={create.isPending} disabled={!form.nome || !form.email || !form.senha || !form.nivel_acesso_id || levels.isError} onClick={() => create.mutate()}>Criar acesso</Button></>}><div className="form-grid">{error && <div className="form-error-summary" role="alert">{error}</div>}<Field label="Nome" htmlFor="user-name" required><Input id="user-name" autoComplete="name" value={form.nome} onChange={(event) => setForm((current) => ({ ...current, nome: event.target.value }))} /></Field><Field label="E-mail" htmlFor="user-email" required><Input id="user-email" type="email" autoComplete="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} /></Field><Field label="Senha temporária" htmlFor="user-password" required hint="Mínimo 12 caracteres, com maiúscula, minúscula e número."><Input id="user-password" type="password" autoComplete="new-password" value={form.senha} onChange={(event) => setForm((current) => ({ ...current, senha: event.target.value }))} /></Field><Field label="Nível de acesso" htmlFor="user-level" required><Select id="user-level" value={form.nivel_acesso_id} onChange={(event) => setForm((current) => ({ ...current, nivel_acesso_id: event.target.value }))}><option value="">Selecione</option>{levels.data?.map((level) => <option value={level.id} key={level.id}>{String(level.nome)}</option>)}</Select></Field></div></Dialog>
    <Dialog open={!!permissionsUser} onOpenChange={(open) => !open && setPermissionsUser(null)} title={`Permissões de ${String(permissionsUser?.nome || "colaborador")}`} description="Conceda somente o necessário para a função." footer={<><Button variant="ghost" onClick={() => setPermissionsUser(null)}>Cancelar</Button><Button loading={savePermissions.isPending} onClick={() => savePermissions.mutate()}>Salvar permissões</Button></>}><div className="permission-list">{error && <div className="form-error-summary" role="alert">{error}</div>}{permissions.data?.map((permission) => { const code = String(permission.codigo || permission.nome); return <Checkbox key={permission.id} checked={selectedPermissions.includes(code)} onChange={(event) => setSelectedPermissions((current) => event.target.checked ? [...current, code] : current.filter((item) => item !== code))}>{String(permission.nome)} <small>{code}</small></Checkbox>; })}</div></Dialog>
    <Dialog open={!!resetUser} onOpenChange={(open) => !open && setResetUser(null)} title={`Redefinir senha de ${String(resetUser?.nome || "colaborador")}`} description="Esta ação encerra todas as sessões do usuário e não pode ser usada na própria conta." footer={<><Button variant="ghost" onClick={() => setResetUser(null)}>Cancelar</Button><Button loading={reset.isPending} disabled={password.length < 12} onClick={() => reset.mutate()}>Redefinir senha</Button></>}><div className="stack">{error && <div className="form-error-summary" role="alert">{error}</div>}<Field label="Nova senha" htmlFor="reset-password" required hint="Mínimo 12 caracteres, com maiúscula, minúscula e número."><Input id="reset-password" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} /></Field></div></Dialog>
  </div>;
}
