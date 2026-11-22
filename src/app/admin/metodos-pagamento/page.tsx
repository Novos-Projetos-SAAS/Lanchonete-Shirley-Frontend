"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw, Save } from "lucide-react";
import { ResourcePage, resourceConfigs } from "@/features/admin/resource-page";
import { PermissionBoundary } from "@/components/shared/permission-boundary";
import { Badge, Button, Checkbox, ErrorState, Field, FieldGroup, FormErrorSummary, Input, Skeleton } from "@/components/ui";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/features/auth/auth-provider";
import { ApiError } from "@/lib/api-client";
import { clearFormFieldError, toFormError, type FormErrorFeedback } from "@/lib/api-errors";
import { queryKeys } from "@/lib/query-keys";
import { adminService, type InfinitepayConfiguration, type InfinitepayConfigurationPatch } from "@/services/admin-service";

const configKey = ["admin-infinitepay-config"] as const;
const fieldIds = { handle: "infinitepay-handle", api_key: "infinitepay-api-key", backend_public_url: "infinitepay-backend", redirect_url: "infinitepay-redirect", pix_habilitado: "infinitepay-pix", credito_habilitado: "infinitepay-credit" };

function invalid(field: string, message: string): never {
  throw new ApiError(message, 422, "INFINITEPAY_INVALID_CONFIGURATION", undefined, [{ path: field, message }]);
}

function callbackUrl(value: string, field: "backend_public_url" | "redirect_url", required: boolean) {
  const input = value.trim();
  if (!input && !required) return undefined;
  try {
    const url = new URL(input);
    if (url.protocol !== "https:" || url.username || url.password || url.port || url.hash || url.search || (field === "backend_public_url" && url.pathname !== "/")) throw new Error("url");
    if (field === "redirect_url" && url.pathname !== "/pedido/confirmado") invalid(field, "Use a URL HTTPS pública do frontend com o caminho /pedido/confirmado.");
  } catch {
    invalid(field, field === "backend_public_url" ? "Informe a URL HTTPS pública do backend, sem caminho, parâmetros ou porta personalizada." : "Use a URL HTTPS pública do frontend com o caminho /pedido/confirmado.");
  }
  return input;
}

function InfinitepayForm({ configuration, canEdit }: { configuration: InfinitepayConfiguration; canEdit: boolean }) {
  const client = useQueryClient();
  const { toast } = useToast();
  const [values, setValues] = useState({
    handle: configuration.handle ?? "", backend_public_url: configuration.backend_public_url ?? "", redirect_url: configuration.redirect_url ?? "",
    ativo: configuration.ativo, pix_habilitado: configuration.pix_habilitado, credito_habilitado: configuration.credito_habilitado,
  });
  const [apiKey, setApiKey] = useState("");
  const [error, setError] = useState<FormErrorFeedback | null>(null);
  const save = useMutation({
    mutationFn: () => {
      const handle = values.handle.trim().replace(/^\$/, "");
      const key = apiKey.trim();
      if (values.pix_habilitado && !values.credito_habilitado) invalid("pix_habilitado", "Pix online exige cartão habilitado: a InfinitePay sempre oferece cartão nesse checkout.");
      if (values.ativo && !values.credito_habilitado) invalid("credito_habilitado", "Habilite cartão para ativar a InfinitePay.");
      if ((values.ativo || key) && !handle) invalid("handle", "Informe a InfiniteTag da conta InfinitePay.");
      if (handle && !/^[A-Za-z0-9_.-]{1,100}$/.test(handle)) invalid("handle", "Informe uma InfiniteTag válida, sem espaços.");
      if (key && !/^inchk_[A-Za-z0-9_-]+$/.test(key)) invalid("api_key", "Informe uma API Key válida iniciada por inchk_.");
      if (values.ativo && !key && !configuration.has_api_key) invalid("api_key", "Cadastre a API Key antes de ativar a InfinitePay.");
      const backend = callbackUrl(values.backend_public_url, "backend_public_url", values.ativo);
      const redirect = callbackUrl(values.redirect_url, "redirect_url", values.ativo);
      const body: InfinitepayConfigurationPatch = {
        versao: configuration.versao, ativo: values.ativo, pix_habilitado: values.pix_habilitado, credito_habilitado: values.credito_habilitado,
        ...(handle ? { handle } : {}), ...(key ? { api_key: key } : {}),
        ...(backend ? { backend_public_url: backend } : {}), ...(redirect ? { redirect_url: redirect } : {}),
      };
      return adminService.updateInfinitepayConfiguration(body);
    },
    onSuccess: async (row) => {
      setApiKey("");
      client.setQueryData(configKey, row);
      await client.invalidateQueries({ queryKey: queryKeys.payments });
      toast({ tone: "success", title: "Configuração InfinitePay salva" });
    },
    onError: (failure) => setError(toFormError(failure, { fallback: "Não foi possível salvar a InfinitePay." })),
    onSettled: () => setApiKey(""),
  });
  function change<K extends keyof typeof values>(field: K, value: (typeof values)[K]) {
    setValues((current) => ({ ...current, [field]: value }));
    setError((current) => clearFormFieldError(current, field));
  }
  return <form onSubmit={(event) => { event.preventDefault(); if (canEdit) { setError(null); save.mutate(); } }} noValidate>
    <FieldGroup id="infinitepay" title="InfinitePay" description="Checkout hospedado. Configuração aplicada aos novos pedidos online; métodos tradicionais continuam disponíveis." disabled={!canEdit || save.isPending}>
      <Badge>Configuração salva: {configuration.ativo ? "Ativa" : "Desativada"}</Badge>
      <p role="status">{configuration.has_api_key ? "API Key cadastrada no backend." : "API Key ainda não cadastrada."}</p>
      <div className="form-grid form-grid--2">
        <Field label="InfiniteTag" htmlFor={fieldIds.handle} hint="Identificador da conta, sem o $ inicial." error={error?.fields.handle}><Input id={fieldIds.handle} value={values.handle} maxLength={101} onChange={(event) => change("handle", event.target.value)} autoComplete="off" /></Field>
        <Field label="API Key" htmlFor={fieldIds.api_key} hint="Deixe vazio para manter a chave atual. A chave salva nunca é exibida." error={error?.fields.api_key}><Input id={fieldIds.api_key} type="password" value={apiKey} maxLength={512} onChange={(event) => { setApiKey(event.target.value); setError((current) => clearFormFieldError(current, "api_key")); }} autoComplete="new-password" spellCheck={false} /></Field>
        <Field label="URL pública do backend" htmlFor={fieldIds.backend_public_url} hint="HTTPS, somente a origem do backend. O webhook é configurado automaticamente." error={error?.fields.backend_public_url}><Input id={fieldIds.backend_public_url} type="url" value={values.backend_public_url} maxLength={2048} onChange={(event) => change("backend_public_url", event.target.value)} /></Field>
        <Field label="URL de retorno do frontend" htmlFor={fieldIds.redirect_url} hint="HTTPS com /pedido/confirmado. A origem deve estar autorizada no backend." error={error?.fields.redirect_url}><Input id={fieldIds.redirect_url} type="url" value={values.redirect_url} maxLength={2048} onChange={(event) => change("redirect_url", event.target.value)} /></Field>
      </div>
      <div className="stack">
        <Checkbox checked={values.ativo} onChange={(event) => change("ativo", event.target.checked)}>Ativar InfinitePay</Checkbox>
        <Checkbox id={fieldIds.pix_habilitado} checked={values.pix_habilitado} onChange={(event) => change("pix_habilitado", event.target.checked)}>Habilitar Pix</Checkbox>
        <Checkbox id={fieldIds.credito_habilitado} checked={values.credito_habilitado} onChange={(event) => change("credito_habilitado", event.target.checked)}>Habilitar cartão</Checkbox>
      </div>
      <p className="field__hint">Pix online exige cartão habilitado. Salvar com a integração ativa permite pagamentos reais nos novos pedidos.</p>
      <FormErrorSummary error={error} fieldIds={fieldIds} />
      <Button type="submit" loading={save.isPending} disabled={!canEdit}><Save aria-hidden /> Salvar InfinitePay</Button>
    </FieldGroup>
  </form>;
}

function InfinitepaySection() {
  const { hasPermission } = useAuth();
  const canRead = hasPermission("infinitepay.visualizar");
  const query = useQuery({ queryKey: configKey, queryFn: adminService.infinitepayConfiguration, enabled: canRead, refetchOnWindowFocus: false });
  if (!canRead) return null;
  if (query.isLoading) return <Skeleton className="skeleton--card" />;
  if (query.isError || !query.data) return <ErrorState title="Configuração InfinitePay indisponível" description="Não foi possível consultar a configuração salva." action={<Button onClick={() => void query.refetch()}><RefreshCw aria-hidden /> Recarregar configuração</Button>} />;
  return <div className="stack"><InfinitepayForm key={query.data.versao} configuration={query.data} canEdit={hasPermission("infinitepay.configurar")} /><Button variant="ghost" onClick={() => void query.refetch()}><RefreshCw aria-hidden /> Recarregar configuração</Button></div>;
}

export default function Page() {
  return <PermissionBoundary permission="metodos_pagamento.listar"><div className="stack-lg"><ResourcePage config={resourceConfigs["metodos-pagamento"]} /><InfinitepaySection /></div></PermissionBoundary>;
}

