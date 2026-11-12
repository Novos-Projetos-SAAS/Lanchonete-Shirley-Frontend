import { apiRequest } from "@/lib/api-client";
import type { PaginatedData } from "@/types/api";
import type { AndroidPrintStatus, CreateOrderInput, Invitation, InvitationSecretResponse, OrderSummary, PrintPairing, ReportMetadata, ReportPreview } from "@/types/domain";

// As respostas administrativas variam por recurso; componentes convertem os
// campos antes de renderizar ou enviar de volta à API.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AdminRecord = { id: string;[key: string]: any };
export interface ProductLinks {
    produto_id: string;
    tipos_pao: Array<{ tipo_pao_id: string; ativo: boolean; codigo: string; nome: string; acrescimo: string | null }>;
    adicionais: Array<{ adicional_id: string; max_quantidade_por_item: number; ativo: boolean; nome: string; preco: string; disponivel_hoje: boolean; deletado_em: string | null }>;
}
function search(params: Record<string, string | number | boolean | undefined>) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => { if (value !== undefined && value !== "") query.set(key, String(value)); });
    const result = query.toString();
    return result ? `?${result}` : "";
}

export const adminService = {
    changePassword: (body: { senha_atual: string; nova_senha: string; confirmar_nova_senha: string }) => apiRequest("/auth/alterar-senha", { method: "POST", body, csrf: true }),
    listResource: <T extends AdminRecord>(resource: string, params: Record<string, string | number | boolean | undefined> = {}) => apiRequest<PaginatedData<T>>(`/admin/${resource}${search({ page: 1, limit: 10, ...params })}`),
    getResource: <T extends AdminRecord>(resource: string, id: string) => apiRequest<T>(`/admin/${resource}/${id}`),
    createResource: <T extends AdminRecord>(resource: string, body: unknown) => apiRequest<T>(`/admin/${resource}`, { method: "POST", body, csrf: true }),
    updateResource: <T extends AdminRecord>(resource: string, id: string, body: unknown) => apiRequest<T>(`/admin/${resource}/${id}`, { method: "PATCH", body, csrf: true }),
    deleteResource: (resource: string, id: string) => apiRequest(`/admin/${resource}/${id}`, { method: "DELETE", csrf: true }),
    deactivateProduct: (id: string) => apiRequest<AdminRecord>(`/admin/produtos/${id}/desativar`, { method: "PATCH", csrf: true }),
    reactivateProduct: (id: string) => apiRequest<AdminRecord>(`/admin/produtos/${id}/reativar`, { method: "POST", csrf: true }),
    restoreProduct: (id: string) => apiRequest<AdminRecord>(`/admin/produtos/${id}/restaurar`, { method: "POST", csrf: true }),
    productLinks: (id: string) => apiRequest<ProductLinks>(`/admin/produtos/${id}/vinculos`),
    replaceProductBreads: (id: string, tipos_pao: Array<{ tipo_pao_id: string; ativo: boolean }>) => apiRequest(`/admin/produtos/${id}/tipos-pao`, { method: "PUT", body: { tipos_pao }, csrf: true }),
    replaceProductAdditionals: (id: string, adicionais: Array<{ adicional_id: string; max_quantidade_por_item: number; ativo: boolean }>) => apiRequest(`/admin/produtos/${id}/adicionais`, { method: "PUT", body: { adicionais }, csrf: true }),
    dashboard: (start: string, end: string) => apiRequest<AdminRecord>(`/admin/dashboard${search({ data_inicio: start, data_fim: end })}`),
    orders: (params: Record<string, string | number | boolean | undefined>) => apiRequest<PaginatedData<OrderSummary>>(`/admin/pedidos${search({ page: 1, limit: 10, ...params })}`),
    order: (id: string) => apiRequest<OrderSummary>(`/admin/pedidos/${id}`),
    createOrder: (body: CreateOrderInput) => apiRequest<OrderSummary>("/admin/pedidos", { method: "POST", body, csrf: true }),
    updateOrderStatus: (id: string, body: { status: string; motivo?: string | null; versao: number }) => apiRequest<OrderSummary>(`/admin/pedidos/${id}/status`, { method: "PATCH", body, csrf: true }),
    updatePayment: (id: string, body: { status_pagamento: string; motivo?: string | null; versao: number }) => apiRequest<OrderSummary>(`/admin/pedidos/${id}/pagamento`, { method: "PATCH", body, csrf: true }),
    cancelOrder: (id: string, body: { motivo: string; versao: number }) => apiRequest<OrderSummary>(`/admin/pedidos/${id}/cancelar`, { method: "POST", body, csrf: true }),
    storeConfig: () => apiRequest<AdminRecord>("/admin/loja/configuracoes"),
    updateStoreConfig: (body: unknown) => apiRequest<AdminRecord>("/admin/loja/configuracoes", { method: "PATCH", body, csrf: true }),
    schedules: () => apiRequest<AdminRecord[]>("/admin/loja/horarios"),
    replaceSchedules: (horarios: unknown[]) => apiRequest<AdminRecord[]>("/admin/loja/horarios", { method: "PUT", body: { horarios }, csrf: true }),
    setStoreStatus: (aceitar_pedidos: boolean) => apiRequest<AdminRecord>("/admin/loja/status", { method: "PATCH", body: { aceitar_pedidos }, csrf: true }),
    accessLevels: () => apiRequest<AdminRecord[]>("/admin/niveis-acesso"),
    invitationLevels: () => apiRequest<AdminRecord[]>("/admin/convites/niveis-acesso"),
    invitations: (params: Record<string, string | number | boolean | undefined> = {}) => apiRequest<PaginatedData<Invitation>>(`/admin/convites${search({ page: 1, limit: 10, ...params })}`),
    createInvitation: (body: { email: string; nivel_acesso_id: string }) => apiRequest<InvitationSecretResponse>("/admin/convites", { method: "POST", body, csrf: true }),
    reissueInvitation: (id: string) => apiRequest<InvitationSecretResponse>(`/admin/convites/${id}/reemitir`, { method: "POST", csrf: true }),
    revokeInvitation: (id: string) => apiRequest<Invitation>(`/admin/convites/${id}/revogar`, { method: "POST", csrf: true }),
    permissionCatalog: () => apiRequest<AdminRecord[]>("/admin/permissoes"),
    setUserPermissions: (id: string, permissoes: string[]) => apiRequest<AdminRecord>(`/admin/usuarios/${id}/permissoes`, { method: "PATCH", body: { permissoes }, csrf: true }),
    resetUserPassword: (id: string, nova_senha: string) => apiRequest(`/admin/usuarios/${id}/redefinir-senha`, { method: "POST", body: { nova_senha }, csrf: true }),
    report: (name: string, start: string, end: string) => apiRequest<unknown>(`/admin/relatorios/${name}${search({ data_inicio: start, data_fim: end })}`),
    salesCsv: (start: string, end: string) => apiRequest<Response>(`/admin/relatorios/vendas.csv${search({ data_inicio: start, data_fim: end })}`, { raw: true }),
    reportCatalog: () => apiRequest<ReportMetadata[]>("/admin/relatorios"),
    reportFilterOptions: (source: string) => apiRequest<Array<{ id: string; nome: string }>>(`/admin/relatorios/opcoes/${encodeURIComponent(source)}`),
    reportMetadata: (code: string) => apiRequest<ReportMetadata>(`/admin/relatorios/${encodeURIComponent(code)}`),
    generateReport: (code: string, filtros: Record<string, string | number | boolean>, page = 1, limit = 10) => apiRequest<ReportPreview>(`/admin/relatorios/${encodeURIComponent(code)}/gerar`, { method: "POST", body: { filtros, page, limit }, csrf: true, timeout: 30_000 }),
    reportPdf: (code: string, filtros: Record<string, string | number | boolean>) => apiRequest<Response>(`/admin/relatorios/${encodeURIComponent(code)}/pdf`, { method: "POST", body: { filtros, page: 1, limit: 50 }, csrf: true, raw: true, timeout: 60_000 }),
    notifications: (page = 1) => apiRequest<PaginatedData<AdminRecord>>(`/admin/notificacoes${search({ page, limit: 10 })}`),
    unread: () => apiRequest<{ total: number }>("/admin/notificacoes/nao-lidas"),
    markRead: (id: string) => apiRequest<AdminRecord>(`/admin/notificacoes/${id}/lida`, { method: "PATCH", csrf: true }),
    pushConfig: () => apiRequest<{ habilitado: boolean; chave_publica?: string; public_key?: string; motivo?: string }>("/admin/push/configuracao"),
    subscribePush: (body: PushSubscriptionJSON & { dispositivo_nome?: string }) => apiRequest("/admin/push/inscricoes", { method: "POST", body, csrf: true }),
    unsubscribePush: (endpoint: string) => apiRequest("/admin/push/inscricoes", { method: "DELETE", body: { endpoint }, csrf: true }),
    printJobs: (status = "", page = 1) => apiRequest<PaginatedData<AdminRecord>>(`/admin/impressoes${search({ page, limit: 10, status })}`),
    requestPrint: (id: string) => apiRequest(`/admin/pedidos/${id}/impressoes`, { method: "POST", csrf: true }),
    androidPrintStatus: () => apiRequest<AndroidPrintStatus>("/admin/impressoes/android/status"),
    createPrintPairing: (api_url: string) => apiRequest<PrintPairing>("/admin/impressoes/android/pareamentos", { method: "POST", body: { api_url }, csrf: true }),
    revokePrintDevice: (id: string) => apiRequest(`/admin/impressoes/android/dispositivos/${id}/revogar`, { method: "POST", csrf: true }),
    testAndroidPrint: () => apiRequest("/admin/impressoes/android/teste", { method: "POST", csrf: true }),
};

