"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock3, Save, Store } from "lucide-react";
import { PermissionGate } from "@/components/shared/permission-gate";
import { Button, Card, Checkbox, ErrorState, Field, FormErrorSummary, Input, PageHeader, Select } from "@/components/ui";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/features/auth/auth-provider";
import { clearFormFieldError, toFormError, type FormErrorFeedback } from "@/lib/api-errors";
import { queryKeys } from "@/lib/query-keys";
import { adminService } from "@/services/admin-service";
import { publicService } from "@/services/public-service";

import type { StoreOperationMode } from "@/types/domain";


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

    const status = useQuery({
        queryKey: queryKeys.storeStatus,
        queryFn: publicService.status,
        refetchInterval: 30_000,
    });

    const [values, setValues] = useState<Record<string, string | number | boolean | null>>({});
    const [schedules, setSchedules] = useState<Schedule[]>(emptySchedules);
    const [formError, setFormError] = useState<FormErrorFeedback | null>(null);

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

    function notifyError(error: unknown) {
        setFormError(toFormError(error, { fallback: "Não foi possível salvar as configurações." }));
        toast({
            tone: "error",
            title: "Não foi possível salvar",
            description: toFormError(error).message,
        });
    }

    function set(name: string, value: string | number | boolean) {
        setValues((current) => ({ ...current, [name]: value }));
        setFormError((current) => clearFormFieldError(current, name));
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
            setFormError(null);
            toast({ tone: "success", title: "Configurações salvas" });
            await config.refetch();
        },
        onError: notifyError,
    });

    const saveSchedules = useMutation({
        mutationFn: () => adminService.replaceSchedules(schedules),
        onSuccess: async () => {
            setFormError(null);
            toast({ tone: "success", title: "Horários salvos" });
            await scheduleQuery.refetch();
        },
        onError: notifyError,
    });


    const changeOperationMode = useMutation({
        mutationFn: (mode: StoreOperationMode) =>
            adminService.setStoreOperationMode(mode),

        onSuccess: async (saved, requestedMode) => {
            setFormError(null);

            await client.invalidateQueries({
                queryKey: queryKeys.storeStatus,
            });

            // Confirma que a API persistiu o modo solicitado.
            if (saved.modo_operacao !== requestedMode) {
                toast({
                    tone: "error",
                    title: "Não foi possível confirmar o funcionamento",
                    description:
                        "Atualize a página e confira o estado da loja.",
                });
                return;
            }

            toast({
                tone: "success",
                title: "Funcionamento atualizado",
                description:
                    requestedMode === "AUTOMATICO"
                        ? "A loja voltou a seguir os horários programados."
                        : requestedMode === "ABERTO_MANUAL"
                            ? "A abertura manual foi registrada."
                            : "O fechamento manual foi registrado.",
            });
        },

        onError: notifyError,
    });


    if (config.isError) {
        return <ErrorState title="Configuração indisponível" description="Confira sua permissão ou tente novamente." action={<Button onClick={() => void config.refetch()}>Tentar novamente</Button>} />;
    }


    const operationMode: StoreOperationMode | null =
        status.data?.modo_operacao ??
        (config.data?.modo_operacao as StoreOperationMode | undefined) ??
        null;

    const operationModeUnavailable =
        changeOperationMode.isPending ||
        status.isLoading ||
        status.isError ||
        !operationMode;

    const operationModeLabels: Record<StoreOperationMode, string> = {
        AUTOMATICO: "Automático",
        ABERTO_MANUAL: "Aberta manualmente",
        FECHADO_MANUAL: "Fechada manualmente",
    };



    return (
        <div>
            <PageHeader
                eyebrow="Operação da loja"
                title="Loja e horários"
                description="Configure o funcionamento automático ou abra e feche a loja manualmente."
            />

            <FormErrorSummary
                error={formError}
                fieldIds={{
                    nome_fantasia: "store-name",
                    telefone: "store-phone",
                    whatsapp: "store-whatsapp",
                    taxa_entrega: "store-fee",
                    tempo_estimado_min: "store-time",
                    logo_url: "store-logo",
                    endereco_trailer: "store-address",
                    referencia_trailer: "store-reference",
                    metodo_impressao: "print-method",
                    nome_impressora: "printer-name",
                }}
            />

            {/* CONTROLE DE FUNCIONAMENTO */}
            <Card className="admin-card">
                <h2>
                    <Store aria-hidden />
                    Controle de funcionamento
                </h2>

                <p className="muted">
                    Escolha como a loja deve receber pedidos. A abertura
                    manual permite receber pedidos fora dos horários
                    cadastrados, desde que a loja esteja configurada.
                </p>

                <PermissionGate permission="loja.status">
                    <div
                        className="cluster"
                        role="group"
                        aria-label="Modo de funcionamento da loja"
                    >
                        <Button
                            type="button"
                            variant={
                                operationMode === "AUTOMATICO"
                                    ? "primary"
                                    : "secondary"
                            }
                            aria-pressed={operationMode === "AUTOMATICO"}
                            disabled={operationModeUnavailable}
                            onClick={() =>
                                changeOperationMode.mutate("AUTOMATICO")
                            }
                        >
                            <Clock3 aria-hidden />
                            Automático
                        </Button>

                        <Button
                            type="button"
                            variant={
                                operationMode === "ABERTO_MANUAL"
                                    ? "primary"
                                    : "secondary"
                            }
                            aria-pressed={operationMode === "ABERTO_MANUAL"}
                            disabled={operationModeUnavailable}
                            onClick={() =>
                                changeOperationMode.mutate("ABERTO_MANUAL")
                            }
                        >
                            <Store aria-hidden />
                            Abrir agora
                        </Button>

                        <Button
                            type="button"
                            variant={
                                operationMode === "FECHADO_MANUAL"
                                    ? "danger"
                                    : "secondary"
                            }
                            aria-pressed={operationMode === "FECHADO_MANUAL"}
                            disabled={operationModeUnavailable}
                            onClick={() =>
                                changeOperationMode.mutate("FECHADO_MANUAL")
                            }
                        >
                            Fechar agora
                        </Button>
                    </div>
                </PermissionGate>

                <p className="muted">
                    {operationMode
                        ? `Modo selecionado: ${operationModeLabels[operationMode]}`
                        : "Modo de funcionamento indisponível. Verifique a versão do backend."}
                </p>

                {changeOperationMode.isPending && (
                    <p role="status" className="muted">
                        Atualizando funcionamento...
                    </p>
                )}
            </Card>

            {/* STATUS EFETIVO DA LOJA */}
            <div className="store-status-card">
                <span
                    className={`store-stamp ${!status.isError && status.data?.aberta
                            ? "store-stamp--open"
                            : ""
                        }`}
                >
                    {status.isLoading
                        ? "Consultando"
                        : status.isError
                            ? "Indisponível"
                            : status.data?.aberta
                                ? "Aberta"
                                : "Fechada"}
                </span>

                <div>
                    <strong>
                        {status.isError
                            ? "Não foi possível consultar o status da loja."
                            : status.data?.mensagem ||
                            "Consultando status..."}
                    </strong>

                    <p>
                        {operationMode
                            ? `Funcionamento: ${operationModeLabels[operationMode]}`
                            : "Funcionamento não identificado"}
                        {" · "}
                        Fuso horário: America/Sao_Paulo
                    </p>
                </div>
            </div>

            <div className="stack-lg">

                {/* IDENTIDADE E ATENDIMENTO */}
                <Card className="admin-card">
                    <h2>Identidade e atendimento</h2>

                    <fieldset
                        className="settings-fieldset"
                        disabled={!canConfigure}
                    >
                        <div className="form-grid form-grid--2">
                            <Field
                                label="Nome fantasia"
                                htmlFor="store-name"
                                required
                                error={formError?.fields.nome_fantasia}
                            >
                                <Input
                                    id="store-name"
                                    value={String(values.nome_fantasia || "")}
                                    onChange={(event) =>
                                        set("nome_fantasia", event.target.value)
                                    }
                                />
                            </Field>

                            <Field
                                label="Telefone"
                                htmlFor="store-phone"
                                error={formError?.fields.telefone}
                            >
                                <Input
                                    id="store-phone"
                                    type="tel"
                                    inputMode="tel"
                                    value={String(values.telefone || "")}
                                    onChange={(event) =>
                                        set("telefone", event.target.value)
                                    }
                                />
                            </Field>

                            <Field
                                label="WhatsApp"
                                htmlFor="store-whatsapp"
                                hint="Use DDD e número; o backend normaliza o formato."
                                error={formError?.fields.whatsapp}
                            >
                                <Input
                                    id="store-whatsapp"
                                    type="tel"
                                    inputMode="tel"
                                    value={String(values.whatsapp || "")}
                                    onChange={(event) =>
                                        set("whatsapp", event.target.value)
                                    }
                                />
                            </Field>

                            <Field
                                label="Taxa de entrega"
                                htmlFor="store-fee"
                                hint="Use ponto nos centavos, por exemplo 5.00."
                                error={formError?.fields.taxa_entrega}
                            >
                                <Input
                                    id="store-fee"
                                    inputMode="decimal"
                                    value={String(values.taxa_entrega || "")}
                                    onChange={(event) =>
                                        set("taxa_entrega", event.target.value)
                                    }
                                />
                            </Field>

                            <Field
                                label="Tempo estimado (min)"
                                htmlFor="store-time"
                                error={formError?.fields.tempo_estimado_min}
                            >
                                <Input
                                    id="store-time"
                                    type="number"
                                    min={1}
                                    max={1440}
                                    value={Number(values.tempo_estimado_min || 30)}
                                    onChange={(event) =>
                                        set(
                                            "tempo_estimado_min",
                                            Number(event.target.value),
                                        )
                                    }
                                />
                            </Field>

                            <Field
                                label="URL da logo"
                                htmlFor="store-logo"
                                error={formError?.fields.logo_url}
                            >
                                <Input
                                    id="store-logo"
                                    type="url"
                                    value={String(values.logo_url || "")}
                                    onChange={(event) =>
                                        set("logo_url", event.target.value)
                                    }
                                />
                            </Field>

                            <Field
                                label="Endereço do trailer"
                                htmlFor="store-address"
                                error={formError?.fields.endereco_trailer}
                            >
                                <Input
                                    id="store-address"
                                    value={String(values.endereco_trailer || "")}
                                    onChange={(event) =>
                                        set("endereco_trailer", event.target.value)
                                    }
                                />
                            </Field>

                            <Field
                                label="Referência"
                                htmlFor="store-reference"
                                error={formError?.fields.referencia_trailer}
                            >
                                <Input
                                    id="store-reference"
                                    value={String(values.referencia_trailer || "")}
                                    onChange={(event) =>
                                        set("referencia_trailer", event.target.value)
                                    }
                                />
                            </Field>
                        </div>

                        <PermissionGate permission="loja.configurar">
                            <Button
                                loading={saveConfig.isPending}
                                onClick={() => saveConfig.mutate()}
                            >
                                <Save aria-hidden />
                                Salvar configurações
                            </Button>
                        </PermissionGate>
                    </fieldset>
                </Card>

                {/* HORÁRIOS SEMANAIS */}
                <Card className="admin-card">
                    <h2>
                        <Clock3 aria-hidden />
                        Horários semanais
                    </h2>

                    <p className="muted">
                        No modo automático, a loja segue os horários
                        cadastrados abaixo. Se o fechamento for anterior
                        ou igual à abertura, o backend considera o
                        encerramento no dia seguinte.
                    </p>

                    <fieldset
                        className="settings-fieldset"
                        disabled={!canConfigure}
                    >
                        <div className="schedule-grid">
                            {schedules.map((row, index) => (
                                <div
                                    className="schedule-row"
                                    key={row.dia_semana}
                                >
                                    <Checkbox
                                        checked={row.ativo}
                                        onChange={(event) =>
                                            setSchedules((current) =>
                                                current.map((item, itemIndex) =>
                                                    itemIndex === index
                                                        ? {
                                                            ...item,
                                                            ativo: event.target.checked,
                                                        }
                                                        : item,
                                                ),
                                            )
                                        }
                                    >
                                        {days[row.dia_semana]}
                                    </Checkbox>

                                    <Input
                                        aria-label={`Abertura de ${days[row.dia_semana]}`}
                                        type="time"
                                        value={row.hora_inicio}
                                        onChange={(event) =>
                                            setSchedules((current) =>
                                                current.map((item, itemIndex) =>
                                                    itemIndex === index
                                                        ? {
                                                            ...item,
                                                            hora_inicio: event.target.value,
                                                        }
                                                        : item,
                                                ),
                                            )
                                        }
                                    />

                                    <Input
                                        aria-label={`Fechamento de ${days[row.dia_semana]}`}
                                        type="time"
                                        value={row.hora_fim}
                                        onChange={(event) =>
                                            setSchedules((current) =>
                                                current.map((item, itemIndex) =>
                                                    itemIndex === index
                                                        ? {
                                                            ...item,
                                                            hora_fim: event.target.value,
                                                        }
                                                        : item,
                                                ),
                                            )
                                        }
                                    />
                                </div>
                            ))}
                        </div>

                        <PermissionGate permission="loja.configurar">
                            <Button
                                loading={saveSchedules.isPending}
                                onClick={() => saveSchedules.mutate()}
                            >
                                <Save aria-hidden />
                                Salvar horários
                            </Button>
                        </PermissionGate>
                    </fieldset>
                </Card>

                {/* IMPRESSÃO AUTOMÁTICA */}
                <Card className="admin-card">
                    <h2>Impressão automática</h2>

                    <fieldset
                        className="settings-fieldset"
                        disabled={!canConfigure}
                    >
                        <Field
                            label="Método de impressão"
                            htmlFor="print-method"
                            hint="Android Bluetooth usa o app Shirley Impressão; o agente legado mantém a integração anterior."
                            error={formError?.fields.metodo_impressao}
                        >
                            <Select
                                id="print-method"
                                value={String(
                                    values.metodo_impressao || "DESABILITADA",
                                )}
                                onChange={(event) =>
                                    set("metodo_impressao", event.target.value)
                                }
                            >
                                <option value="DESABILITADA">
                                    Desabilitada
                                </option>

                                <option value="ANDROID_BLUETOOTH">
                                    Android Bluetooth
                                </option>

                                <option value="AGENTE_LEGADO">
                                    Agente legado
                                </option>
                            </Select>
                        </Field>

                        <Checkbox
                            checked={Boolean(values.imprimir_automaticamente)}
                            onChange={(event) =>
                                set(
                                    "imprimir_automaticamente",
                                    event.target.checked,
                                )
                            }
                        >
                            Solicitar comanda automaticamente
                        </Checkbox>

                        <Checkbox
                            checked={Boolean(values.imprimir_pedidos_painel)}
                            onChange={(event) =>
                                set(
                                    "imprimir_pedidos_painel",
                                    event.target.checked,
                                )
                            }
                        >
                            Também imprimir pedidos criados no painel
                        </Checkbox>

                        {values.metodo_impressao === "AGENTE_LEGADO" && (
                            <Field
                                label="Nome da impressora no agente"
                                htmlFor="printer-name"
                                hint="Use exatamente o nome configurado no agente legado."
                                error={formError?.fields.nome_impressora}
                            >
                                <Input
                                    id="printer-name"
                                    maxLength={120}
                                    value={String(values.nome_impressora || "")}
                                    onChange={(event) =>
                                        set("nome_impressora", event.target.value)
                                    }
                                />
                            </Field>
                        )}

                        {values.metodo_impressao === "ANDROID_BLUETOOTH" && (
                            <p className="muted">
                                Pareie e monitore o telefone na página Impressões.
                                A fila continua no servidor mesmo quando o
                                aparelho estiver offline.
                            </p>
                        )}

                        <PermissionGate permission="loja.configurar">
                            <Button
                                loading={saveConfig.isPending}
                                onClick={() => saveConfig.mutate()}
                            >
                                <Save aria-hidden />
                                Salvar impressão
                            </Button>
                        </PermissionGate>
                    </fieldset>
                </Card>
            </div>
        </div>
    );

}
