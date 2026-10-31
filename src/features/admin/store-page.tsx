"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock3, Save, Store } from "lucide-react";
import { PermissionGate } from "@/components/shared/permission-gate";
import { Button, Card, Checkbox, ErrorState, Field, Input, PageHeader, Select } from "@/components/ui";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/features/auth/auth-provider";
import { ApiError } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { adminService } from "@/services/admin-service";
import { publicService } from "@/services/public-service";

const days = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

interface Schedule {
  dia_semana: number;
  hora_inicio: string;
  hora_fim: string;
  ativo: boolean;
}

const emptySchedules = (): Schedule[] => days.map((_, dia_semana) => ({
  dia_semana,
  hora_inicio: "18:00",
  hora_fim: "23:00",
  ativo: false,
}));

export function StorePage() {
  const { toast } = useToast();
  const { hasPermission } = useAuth();
  const client = useQueryClient();
  const canConfigure = hasPermission("loja.configurar");
  const config = useQuery({ queryKey: ["store-config"], queryFn: adminService.storeConfig });
  const scheduleQuery = useQuery({ queryKey: ["store-schedules"], queryFn: adminService.schedules });
  const status = useQuery({ queryKey: queryKeys.storeStatus, queryFn: publicService.status });
  const [values, setValues] = useState<Record<string, string | number | boolean | null>>({});
  const [schedules, setSchedules] = useState<Schedule[]>(emptySchedules);

  // Sincroniza o formulário editável quando os dados remotos chegam.
  useEffect(() => {
    if (!config.data) return;
    // A consulta é a fonte inicial do formulário; alterações posteriores permanecem locais até salvar.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setValues({
      nome_fantasia: String(config.data.nome_fantasia || ""),
      telefone: String(config.data.telefone || ""),
      whatsapp: String(config.data.whatsapp || ""),
      endereco_trailer: String(config.data.endereco_trailer || ""),
      referencia_trailer: String(config.data.referencia_trailer || ""),
      logo_url: String(config.data.logo_url || ""),
      taxa_entrega: String(config.data.taxa_entrega || "0.00"),
      tempo_estimado_min: Number(config.data.tempo_estimado_min || 30),
      aceitar_pedidos: Boolean(config.data.aceitar_pedidos),
      imprimir_automaticamente: Boolean(config.data.imprimir_automaticamente),
      nome_impressora: String(config.data.nome_impressora || ""),
      metodo_impressao: String(config.data.metodo_impressao || (config.data.imprimir_automaticamente ? "AGENTE_LEGADO" : "DESABILITADA")),
      imprimir_pedidos_painel: Boolean(config.data.imprimir_pedidos_painel),
    });
  }, [config.data]);

  useEffect(() => {
    if (!scheduleQuery.data) return;
    // A consulta é a fonte inicial da grade de horários.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSchedules(days.map((_, day) => {
      const row = scheduleQuery.data.find((item) => Number(item.dia_semana) === day);
      return row ? {
        dia_semana: day,
        hora_inicio: String(row.hora_inicio).slice(0, 5),
        hora_fim: String(row.hora_fim).slice(0, 5),
        ativo: Boolean(row.ativo),
      } : emptySchedules()[day];
    }));
  }, [scheduleQuery.data]);

  function notifyError(error: Error) {
    toast({
      tone: "error",
      title: "Não foi possível salvar",
      description: error instanceof ApiError ? error.message : undefined,
    });
  }

  function set(name: string, value: string | number | boolean) {
    setValues((current) => ({ ...current, [name]: value }));
  }

  const saveConfig = useMutation({
    mutationFn: () => adminService.updateStoreConfig({
      ...values,
      logo_url: values.logo_url || null,
      telefone: values.telefone || null,
      whatsapp: values.whatsapp || null,
      endereco_trailer: values.endereco_trailer || null,
      referencia_trailer: values.referencia_trailer || null,
      nome_impressora: values.nome_impressora || null,
    }),
    onSuccess: async () => {
      toast({ tone: "success", title: "Configurações salvas" });
      await config.refetch();
    },
    onError: notifyError,
  });

  const saveSchedules = useMutation({
    mutationFn: () => adminService.replaceSchedules(schedules),
    onSuccess: async () => {
      toast({ tone: "success", title: "Horários salvos" });
      await scheduleQuery.refetch();
    },
    onError: notifyError,
  });

  const toggle = useMutation({
    mutationFn: (accept: boolean) => adminService.setStoreStatus(accept),
    onSuccess: async (_result, accept) => {
      set("aceitar_pedidos", accept);
      toast({ tone: "success", title: accept ? "Pedidos permitidos no horário" : "Recebimento pausado" });
      await Promise.all([
        config.refetch(),
        client.invalidateQueries({ queryKey: queryKeys.storeStatus }),
      ]);
    },
    onError: notifyError,
  });

  if (config.isError) {
    return <ErrorState title="Configuração indisponível" description="Confira sua permissão ou tente novamente." action={<Button onClick={() => void config.refetch()}>Tentar novamente</Button>} />;
  }

  const manuallyAccepting = Boolean(values.aceitar_pedidos);

  return <div>
    <PageHeader
      eyebrow="Operação da loja"
      title="Loja e horários"
      description="A abertura efetiva combina o controle manual, os horários e a configuração mínima exigida pela API."
      actions={<PermissionGate permission="loja.status">
        <Button variant={manuallyAccepting ? "danger" : "primary"} loading={toggle.isPending} onClick={() => toggle.mutate(!manuallyAccepting)}>
          <Store aria-hidden /> {manuallyAccepting ? "Pausar recebimento" : "Permitir no horário"}
        </Button>
      </PermissionGate>}
    />

    <div className="store-status-card">
      <span className={`store-stamp ${status.data?.aberta ? "store-stamp--open" : ""}`}>{status.data?.aberta ? "Aberta" : "Fechada"}</span>
      <div>
        <strong>{status.data?.mensagem || "Consultando status…"}</strong>
        <p>Controle manual: {manuallyAccepting ? "permitido" : "pausado"} · Fuso horário: America/Sao_Paulo</p>
      </div>
    </div>

    <div className="stack-lg">
      <Card className="admin-card">
        <h2>Identidade e atendimento</h2>
        <fieldset className="settings-fieldset" disabled={!canConfigure}>
          <div className="form-grid form-grid--2">
            <Field label="Nome fantasia" htmlFor="store-name" required>
              <Input id="store-name" value={String(values.nome_fantasia || "")} onChange={(event) => set("nome_fantasia", event.target.value)} />
            </Field>
            <Field label="Telefone" htmlFor="store-phone">
              <Input id="store-phone" type="tel" inputMode="tel" value={String(values.telefone || "")} onChange={(event) => set("telefone", event.target.value)} />
            </Field>
            <Field label="WhatsApp" htmlFor="store-whatsapp" hint="Use DDD e número; o backend normaliza o formato.">
              <Input id="store-whatsapp" type="tel" inputMode="tel" value={String(values.whatsapp || "")} onChange={(event) => set("whatsapp", event.target.value)} />
            </Field>
            <Field label="Taxa de entrega" htmlFor="store-fee" hint="Use ponto nos centavos, por exemplo 5.00.">
              <Input id="store-fee" inputMode="decimal" value={String(values.taxa_entrega || "")} onChange={(event) => set("taxa_entrega", event.target.value)} />
            </Field>
            <Field label="Tempo estimado (min)" htmlFor="store-time">
              <Input id="store-time" type="number" min={1} max={1440} value={Number(values.tempo_estimado_min || 30)} onChange={(event) => set("tempo_estimado_min", Number(event.target.value))} />
            </Field>
            <Field label="URL da logo" htmlFor="store-logo">
              <Input id="store-logo" type="url" value={String(values.logo_url || "")} onChange={(event) => set("logo_url", event.target.value)} />
            </Field>
            <Field label="Endereço do trailer" htmlFor="store-address">
              <Input id="store-address" value={String(values.endereco_trailer || "")} onChange={(event) => set("endereco_trailer", event.target.value)} />
            </Field>
            <Field label="Referência" htmlFor="store-reference">
              <Input id="store-reference" value={String(values.referencia_trailer || "")} onChange={(event) => set("referencia_trailer", event.target.value)} />
            </Field>
          </div>
          <PermissionGate permission="loja.configurar">
            <Button loading={saveConfig.isPending} onClick={() => saveConfig.mutate()}><Save aria-hidden /> Salvar configurações</Button>
          </PermissionGate>
        </fieldset>
      </Card>

      <Card className="admin-card">
        <h2><Clock3 aria-hidden /> Horários semanais</h2>
        <p className="muted">Se o fim for anterior ou igual ao início, o backend considera encerramento no dia seguinte.</p>
        <fieldset className="settings-fieldset" disabled={!canConfigure}>
          <div className="schedule-grid">
            {schedules.map((row, index) => <div className="schedule-row" key={row.dia_semana}>
              <Checkbox checked={row.ativo} onChange={(event) => setSchedules((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, ativo: event.target.checked } : item))}>{days[row.dia_semana]}</Checkbox>
              <Input aria-label={`Abertura de ${days[row.dia_semana]}`} type="time" value={row.hora_inicio} onChange={(event) => setSchedules((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, hora_inicio: event.target.value } : item))} />
              <Input aria-label={`Fechamento de ${days[row.dia_semana]}`} type="time" value={row.hora_fim} onChange={(event) => setSchedules((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, hora_fim: event.target.value } : item))} />
            </div>)}
          </div>
          <PermissionGate permission="loja.configurar">
            <Button loading={saveSchedules.isPending} onClick={() => saveSchedules.mutate()}><Save aria-hidden /> Salvar horários</Button>
          </PermissionGate>
        </fieldset>
      </Card>

      <Card className="admin-card">
        <h2>Impressão automática</h2>
        <fieldset className="settings-fieldset" disabled={!canConfigure}>
          <Field label="Método de impressão" htmlFor="print-method" hint="Android Bluetooth usa o app Shirley Impressão; o agente legado mantém a integração anterior.">
            <Select id="print-method" value={String(values.metodo_impressao || "DESABILITADA")} onChange={(event) => set("metodo_impressao", event.target.value)}>
              <option value="DESABILITADA">Desabilitada</option>
              <option value="ANDROID_BLUETOOTH">Android Bluetooth</option>
              <option value="AGENTE_LEGADO">Agente legado</option>
            </Select>
          </Field>
          <Checkbox checked={Boolean(values.imprimir_automaticamente)} onChange={(event) => set("imprimir_automaticamente", event.target.checked)}>Solicitar comanda automaticamente</Checkbox>
          <Checkbox checked={Boolean(values.imprimir_pedidos_painel)} onChange={(event) => set("imprimir_pedidos_painel", event.target.checked)}>Também imprimir pedidos criados no painel</Checkbox>
          {values.metodo_impressao === "AGENTE_LEGADO" && <Field label="Nome da impressora no agente" htmlFor="printer-name" hint="Use exatamente o nome configurado no agente legado.">
            <Input id="printer-name" maxLength={120} value={String(values.nome_impressora || "")} onChange={(event) => set("nome_impressora", event.target.value)} />
          </Field>}
          {values.metodo_impressao === "ANDROID_BLUETOOTH" && <p className="muted">Pareie e monitore o telefone na página Impressões. A fila continua no servidor mesmo quando o aparelho estiver offline.</p>}
          <PermissionGate permission="loja.configurar">
            <Button loading={saveConfig.isPending} onClick={() => saveConfig.mutate()}><Save aria-hidden /> Salvar impressão</Button>
          </PermissionGate>
        </fieldset>
      </Card>
    </div>
  </div>;
}
