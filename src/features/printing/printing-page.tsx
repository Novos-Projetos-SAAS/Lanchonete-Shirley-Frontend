"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  BluetoothConnected,
  Copy,
  Link2,
  Printer,
  ReceiptText,
  RefreshCw,
  RotateCcw,
  Smartphone,
  Unplug,
} from "lucide-react";
import { PermissionGate } from "@/components/shared/permission-gate";
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  Dialog,
  EmptyState,
  ErrorState,
  Field,
  PageHeader,
  Pagination,
  ResponsiveTable,
  Select,
  Skeleton,
} from "@/components/ui";
import { useToast } from "@/components/ui/toast";
import { formatDateTime } from "@/lib/date";
import { API_URL } from "@/lib/api-client";
import { apiErrorMessage } from "@/lib/api-errors";
import { adminService, type AdminRecord } from "@/services/admin-service";
import type { PrintDevice, PrintPairing } from "@/types/domain";
import "./printing-page.css";

const online = (device: PrintDevice) =>
  Boolean(device.ultimo_contato_em) &&
  Date.now() - new Date(device.ultimo_contato_em!).getTime() < 45_000;

const statusLabel: Record<string, string> = {
  PENDENTE: "Pendente",
  EM_PROCESSAMENTO: "Em processamento",
  CONCLUIDA: "Concluída",
  FALHOU: "Falhou",
  RESULTADO_INDETERMINADO: "Resultado indeterminado",
};

export function PrintingPage() {
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [pairing, setPairing] = useState<PrintPairing | null>(null);
  const client = useQueryClient();
  const { toast } = useToast();

  const jobs = useQuery({
    queryKey: ["print-jobs", status, page],
    queryFn: () => adminService.printJobs(status, page),
    refetchInterval: 20_000,
  });
  const android = useQuery({
    queryKey: ["android-print-status"],
    queryFn: adminService.androidPrintStatus,
    refetchInterval: 15_000,
  });

  async function refresh() {
    await Promise.all([jobs.refetch(), android.refetch()]);
  }

  const pairingMutation = useMutation({
    mutationFn: () => adminService.createPrintPairing(API_URL),
    onSuccess: setPairing,
    onError: (error) => toast({
      tone: "error",
      title: "Não foi possível criar o pareamento",
      description: apiErrorMessage(error),
    }),
  });
  const testMutation = useMutation({
    mutationFn: adminService.testAndroidPrint,
    onSuccess: async () => {
      toast({ tone: "success", title: "Página de teste enfileirada" });
      await jobs.refetch();
    },
    onError: (error) => toast({
      tone: "error",
      title: "Teste não enfileirado",
      description: apiErrorMessage(error),
    }),
  });
  const revokeMutation = useMutation({
    mutationFn: adminService.revokePrintDevice,
    onSuccess: async () => {
      toast({ tone: "success", title: "Dispositivo revogado" });
      await android.refetch();
    },
    onError: (error) => toast({
      tone: "error",
      title: "Não foi possível revogar",
      description: apiErrorMessage(error),
    }),
  });
  const reprintMutation = useMutation({
    mutationFn: adminService.requestPrint,
    onSuccess: async () => {
      toast({ tone: "success", title: "2ª via enfileirada" });
      await client.invalidateQueries({ queryKey: ["print-jobs"] });
    },
    onError: (error) => toast({
      tone: "error",
      title: "2ª via não solicitada",
      description: apiErrorMessage(error),
    }),
  });

  const columns = [
    {
      key: "id",
      header: "Impressão",
      render: (job: AdminRecord) => (
        <div className="printing-page__job-identity">
          <strong>#{job.id}</strong>
          <small className="print-job-kind">
            {job.tipo === "REIMPRESSAO" ? "2ª via" : String(job.tipo || "Comanda").toLowerCase()}
          </small>
        </div>
      ),
    },
    {
      key: "order",
      header: "Pedido",
      render: (job: AdminRecord) => <strong>#{String(job.pedido_id || "—")}</strong>,
    },
    {
      key: "date",
      header: "Solicitada",
      render: (job: AdminRecord) => (
        <span className="tabular">{formatDateTime(String(job.criado_em || ""))}</span>
      ),
      hideOnMobile: true,
    },
    {
      key: "attempts",
      header: "Tentativas",
      render: (job: AdminRecord) => <span className="tabular">{String(job.tentativas ?? 0)}</span>,
      hideOnMobile: true,
    },
    {
      key: "status",
      header: "Estado",
      render: (job: AdminRecord) => (
        <div className="printing-page__job-state">
          <Badge className={`print-state print-state--${String(job.status || "PENDENTE").toLowerCase()}`}>
            {statusLabel[String(job.status)] || String(job.status)}
          </Badge>
          {job.ultimo_erro && <small className="print-job-error">{String(job.ultimo_erro)}</small>}
        </div>
      ),
    },
    {
      key: "actions",
      header: "Ações",
      render: (job: AdminRecord) =>
        job.pedido_id && ["FALHOU", "RESULTADO_INDETERMINADO", "CONCLUIDA"].includes(String(job.status)) ? (
          <PermissionGate permission="impressoes.solicitar">
            <ConfirmDialog
              trigger={<Button variant="ghost" size="sm"><RotateCcw aria-hidden /> 2ª via</Button>}
              title="Emitir 2ª via?"
              description="Confira primeiro se a comanda anterior saiu. A nova impressão será identificada como 2ª VIA e ficará na auditoria."
              confirmLabel="Enfileirar 2ª via"
              onConfirm={() => reprintMutation.mutate(String(job.pedido_id))}
            />
          </PermissionGate>
        ) : <span aria-hidden>—</span>,
    },
  ];

  const activeDevices = android.data?.dispositivos.filter((device) => device.status === "ATIVO") ?? [];
  const recentCount = activeDevices.filter(online).length;
  const uncertain = android.data?.fila.RESULTADO_INDETERMINADO ?? 0;
  const printMethod = android.isLoading
    ? "Consultando…"
    : android.isError
      ? "Indisponível"
      : android.data?.configuracao.metodo_impressao === "ANDROID_BLUETOOTH"
        ? "Android Bluetooth"
        : android.data?.configuracao.metodo_impressao === "AGENTE_LEGADO"
          ? "Agente legado"
          : "Desabilitado";

  return (
    <div className="printing-page">
      <PageHeader
        eyebrow="Operação térmica"
        title="Impressões"
        description="Acompanhe a conexão dos aparelhos, as comandas e o histórico de impressão."
        actions={
          <Button variant="secondary" onClick={() => void refresh()}>
            <RefreshCw aria-hidden /> Atualizar
          </Button>
        }
      />

      {uncertain > 0 && (
        <div className="print-alert" role="alert">
          <AlertTriangle aria-hidden />
          <div>
            <strong>{uncertain} impressão(ões) com resultado indeterminado</strong>
            <p>Confira fisicamente a impressora antes de autorizar uma 2ª via.</p>
          </div>
        </div>
      )}

      <section className="printing-page__overview" aria-labelledby="printing-overview-title">
        <div className="printing-page__section-intro">
          <div>
            <p className="printing-page__eyebrow">Visão geral</p>
            <h2 id="printing-overview-title">Estado da impressão</h2>
          </div>
          <span className="printing-page__refresh-note">Atualização automática da fila e dos aparelhos</span>
        </div>
        <div className="print-status-grid">
          <Card className="print-stat">
            <div className="printing-page__stat-head">
              <small>Método ativo</small>
              <span className="printing-page__stat-icon"><Printer aria-hidden /></span>
            </div>
            <strong className="printing-page__stat-value">{printMethod}</strong>
            <span>
              {android.isError ? "Não foi possível consultar a configuração" :
                android.data?.configuracao.imprimir_automaticamente
                  ? "Pedidos web automáticos"
                  : "Somente solicitações manuais"}
            </span>
          </Card>
          <Card className="print-stat">
            <div className="printing-page__stat-head">
              <small>Aparelhos ativos</small>
              <span className="printing-page__stat-icon"><Smartphone aria-hidden /></span>
            </div>
            <strong className="printing-page__stat-value tabular">
              {android.isError ? "—" : activeDevices.length}
            </strong>
            <span>{recentCount} em contato recente</span>
          </Card>
          <Card className="print-stat">
            <div className="printing-page__stat-head">
              <small>Comandas pendentes</small>
              <span className="printing-page__stat-icon"><ReceiptText aria-hidden /></span>
            </div>
            <strong className="printing-page__stat-value tabular">
              {android.isError ? "—" : (android.data?.fila.PENDENTE ?? 0)}
            </strong>
            <span>{android.data?.fila.EM_PROCESSAMENTO ?? 0} em processamento</span>
          </Card>
        </div>
      </section>

      <section className="print-section printing-page__panel" aria-labelledby="android-devices-title">
        <div className="printing-page__panel-head">
          <div>
            <p className="printing-page__eyebrow">Companheiro Android</p>
            <h2 id="android-devices-title">Aparelhos e turno</h2>
            <p>Gerencie os dispositivos autorizados a receber as comandas.</p>
          </div>
          <PermissionGate permission="impressoes.configurar">
            <div className="printing-page__actions">
              <Button
                variant="secondary"
                loading={testMutation.isPending}
                onClick={() => testMutation.mutate()}
              >
                <Printer aria-hidden /> Imprimir teste
              </Button>
              <Button
                loading={pairingMutation.isPending}
                onClick={() => pairingMutation.mutate()}
              >
                <Link2 aria-hidden /> Parear aparelho
              </Button>
            </div>
          </PermissionGate>
        </div>
        <div className="printing-page__panel-body">
          {android.isLoading ? (
            <div className="printing-page__loading"><Skeleton className="skeleton--card" /></div>
          ) : android.isError ? (
            <ErrorState
              compact
              title="Integração Android indisponível"
              description="A migration 040 precisa estar aplicada antes de usar estes controles."
              action={<Button onClick={() => void android.refetch()}>Tentar novamente</Button>}
            />
          ) : activeDevices.length === 0 ? (
            <EmptyState
              compact
              title="Nenhum aparelho pareado"
              description="Gere um código temporário e informe-o no app Shirley Impressão."
            />
          ) : (
            <div className="print-device-grid">
              {activeDevices.map((device) => (
                <DeviceCard
                  key={device.id}
                  device={device}
                  onRevoke={() => revokeMutation.mutate(device.id)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="print-section printing-page__panel" aria-labelledby="print-queue-title">
        <div className="printing-page__panel-head printing-page__panel-head--queue">
          <div>
            <p className="printing-page__eyebrow">Histórico operacional</p>
            <h2 id="print-queue-title">Fila de comandas</h2>
            <p>Consulte tentativas, resultados e solicitações de 2ª via.</p>
          </div>
          <div className="printing-page__filter">
            <Field label="Filtrar por estado" htmlFor="print-status">
              <Select
                id="print-status"
                className="print-filter"
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value);
                  setPage(1);
                }}
              >
                <option value="">Todos os estados</option>
                <option value="PENDENTE">Pendente</option>
                <option value="EM_PROCESSAMENTO">Em processamento</option>
                <option value="CONCLUIDA">Concluída</option>
                <option value="FALHOU">Falhou</option>
                <option value="RESULTADO_INDETERMINADO">Resultado indeterminado</option>
              </Select>
            </Field>
          </div>
        </div>
        <div className="printing-page__panel-body printing-page__queue-body">
          {jobs.isLoading ? (
            <div className="printing-page__loading">
              <Skeleton className="skeleton--card" />
              <Skeleton className="skeleton--card" />
            </div>
          ) : jobs.isError ? (
            <ErrorState
              title="Fila indisponível"
              description="Confira sua permissão e a conexão."
              action={<Button onClick={() => void jobs.refetch()}>Tentar novamente</Button>}
            />
          ) : !jobs.data?.items.length ? (
            <EmptyState
              title="Fila vazia"
              description="Novas solicitações de comanda aparecerão aqui."
            />
          ) : (
            <ResponsiveTable
              items={jobs.data.items}
              columns={columns}
              getKey={(job) => job.id}
              caption="Fila de impressão"
            />
          )}
          {jobs.data && (
            <Pagination
              page={page}
              totalPages={jobs.data.pagination.total_pages}
              totalItems={jobs.data.pagination.total}
              onPageChange={setPage}
              label="Paginação das impressões"
            />
          )}
        </div>
      </section>

      <Dialog
        open={Boolean(pairing)}
        onOpenChange={(open) => !open && setPairing(null)}
        title="Código de pareamento"
        description="Uso único e validade curta. Digite no app ou abra o link no próprio Android."
        footer={<Button onClick={() => setPairing(null)}>Concluir</Button>}
      >
        {pairing && (
          <div className="pairing-code">
            <span>Código temporário</span>
            <strong aria-label={`Código ${pairing.codigo.split("").join(" ")}`}>
              {pairing.codigo}
            </strong>
            <p>Expira em {formatDateTime(pairing.expira_em)}.</p>
            <Button
              variant="secondary"
              onClick={async () => {
                await navigator.clipboard.writeText(pairing.pareamento_uri);
                toast({ tone: "success", title: "Link copiado" });
              }}
            >
              <Copy aria-hidden /> Copiar link seguro
            </Button>
            <small>O código não será exibido novamente depois que esta janela fechar.</small>
          </div>
        )}
      </Dialog>
    </div>
  );
}

function DeviceCard({ device, onRevoke }: { device: PrintDevice; onRevoke: () => void }) {
  const connected = online(device);

  return (
    <Card className="print-device">
      <div className="print-device__head">
        <span className={`print-device__icon ${connected ? "print-device__icon--online" : ""}`}>
          {connected ? <BluetoothConnected aria-hidden /> : <Unplug aria-hidden />}
        </span>
        <div className="print-device__identity">
          <h3>{device.nome}</h3>
          <p>{connected ? "Contato recente" : "Sem contato recente"}</p>
        </div>
        <span className={`printing-page__device-pill ${device.turno_ativo ? "printing-page__device-pill--active" : ""}`}>
          {device.turno_ativo ? "Turno ativo" : "Turno encerrado"}
        </span>
      </div>
      <dl>
        <div><dt>Impressora</dt><dd>{device.impressora_nome || "Não selecionada"}</dd></div>
        <div><dt>Formato</dt><dd>{device.bobina_mm} mm · {device.codificacao}</dd></div>
        <div><dt>Aplicativo</dt><dd>{device.app_version || "—"} · Android {device.android_version || "—"}</dd></div>
        <div><dt>Último contato</dt><dd>{device.ultimo_contato_em ? formatDateTime(device.ultimo_contato_em) : "Nunca"}</dd></div>
        <div><dt>Estado informado</dt><dd>{device.ultimo_status || "Sem estado"}</dd></div>
      </dl>
      {device.ultimo_erro && (
        <p className="print-device__error"><AlertTriangle aria-hidden /> {device.ultimo_erro}</p>
      )}
      <PermissionGate permission="impressoes.configurar">
        <div className="printing-page__device-footer">
          <ConfirmDialog
            destructive
            trigger={<Button variant="ghost" size="sm"><Smartphone aria-hidden /> Revogar aparelho</Button>}
            title="Revogar este aparelho?"
            description="A credencial deixará de funcionar imediatamente. Para reconectar, será necessário um novo pareamento."
            confirmLabel="Revogar credencial"
            onConfirm={onRevoke}
          />
        </div>
      </PermissionGate>
    </Card>
  );
}
