import { StrictMode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { OrderPayment, OrderSummary } from "@/types/domain";
import { TrackingPage } from "./tracking-page";
import { ConfirmationPage } from "./confirmation-page";

const mocks = vi.hoisted(() => ({ track: vi.fn(), confirm: vi.fn(), replace: vi.fn() }));
const code = "abcdef0123456789abcdef0123456789";
const router = { replace: mocks.replace };
vi.mock("next/navigation", () => ({ useParams: () => ({ codigo: code }), useRouter: () => router }));
vi.mock("@/services/public-service", () => ({ publicService: { track: mocks.track, confirmPayment: mocks.confirm } }));
vi.mock("@/components/ui/toast", () => ({ useToast: () => ({ toast: vi.fn() }) }));

function order(payment?: OrderPayment): OrderSummary {
  return { codigo_acompanhamento: code, status: "PENDENTE", tipo_entrega: "RETIRADA", criado_em: "2026-11-17T12:00:00Z", tempo_estimado_min: 35, pagamento: payment };
}
function mount(component = <TrackingPage />) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(<StrictMode><QueryClientProvider client={client}>{component}</QueryClientProvider></StrictMode>);
}
const pending: OrderPayment = { fluxo: "INFINITEPAY", estado: "AGUARDANDO_PAGAMENTO", liberado_operacionalmente: false, checkout_url: "https://buy.infinitepay.io/fixture/1" };

describe("acompanhamento InfinitePay", () => {
  beforeEach(() => { vi.clearAllMocks(); window.history.replaceState(null, "", "/"); mocks.track.mockResolvedValue(order(pending)); mocks.confirm.mockResolvedValue(pending); });

  it("mantém produção e prazo ocultos antes da confirmação; atualizar só consulta", async () => {
    mount();
    expect(await screen.findByRole("heading", { name: "Aguardando pagamento" })).toBeVisible();
    expect(screen.queryByText("Na chapa")).not.toBeInTheDocument();
    expect(screen.queryByText(/Tempo estimado informado/)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Abrir checkout seguro" })).toHaveAttribute("href", pending.checkout_url);
    fireEvent.click(screen.getByRole("button", { name: "Atualizar" }));
    await waitFor(() => expect(mocks.track.mock.calls.length).toBeGreaterThan(1));
    expect(mocks.confirm).not.toHaveBeenCalled();
  });

  it("ignora paid=true e parâmetros sem identidade completa", async () => {
    window.history.replaceState(null, "", "?paid=true&status=PAGO");
    mount();
    await screen.findByRole("heading", { name: "Aguardando pagamento" });
    expect(mocks.confirm).not.toHaveBeenCalled();
  });

  it("retorno repetido solicita uma consulta por montagem, sem usar sua resposta como liberação", async () => {
    window.history.replaceState(null, "", "?order_nsu=o&transaction_nsu=t&slug=s&paid=true");
    mocks.confirm.mockResolvedValue({ ...pending, estado: "PAGO_VERIFICADO", liberado_operacionalmente: true });
    mount();
    await waitFor(() => expect(mocks.confirm).toHaveBeenCalledExactlyOnceWith(code, { order_nsu: "o", transaction_nsu: "t", slug: "s" }));
    await screen.findByRole("heading", { name: "Aguardando pagamento" });
    expect(screen.queryByText("Na chapa")).not.toBeInTheDocument();
  });

  it("mostra produção somente após resposta de acompanhamento liberada", async () => {
    mocks.track.mockResolvedValue(order({ ...pending, estado: "PAGO_VERIFICADO", liberado_operacionalmente: true, checkout_url: null }));
    mount();
    expect(await screen.findByRole("heading", { name: "Pagamento confirmado" })).toBeVisible();
    expect(screen.getByText("Na chapa")).toBeVisible();
    expect(screen.queryByRole("link", { name: "Abrir checkout seguro" })).not.toBeInTheDocument();
  });

  it.each(["EXPIRADO", "CRIACAO_INCERTA", "PAGO_EM_REVISAO"] as const)("não oferece nova cobrança ou produção em %s", async (estado) => {
    mocks.track.mockResolvedValue(order({ ...pending, estado, checkout_url: null }));
    mount();
    await screen.findByText("Pagamento online pela InfinitePay");
    expect(screen.queryByRole("link", { name: "Abrir checkout seguro" })).not.toBeInTheDocument();
    expect(screen.queryByText("Na chapa")).not.toBeInTheDocument();
  });

  it("falha da consulta preserva pedido pendente", async () => {
    window.history.replaceState(null, "", "?order_nsu=o&transaction_nsu=t&slug=s");
    mocks.confirm.mockRejectedValue(new Error("unavailable"));
    mount();
    expect(await screen.findByRole("alert")).toHaveTextContent("O pedido continua salvo");
    expect(screen.queryByText("Na chapa")).not.toBeInTheDocument();
  });

  it("mantém acompanhamento tradicional", async () => {
    mocks.track.mockResolvedValue(order({ fluxo: "TRADICIONAL", liberado_operacionalmente: true }));
    mount();
    expect(await screen.findByRole("heading", { name: "Seu pedido está andando" })).toBeVisible();
    expect(screen.getByText("Na chapa")).toBeVisible();
    expect(screen.queryByText("Pagamento online pela InfinitePay")).not.toBeInTheDocument();
  });

  it("retorno em outro navegador usa código da URL sem sessionStorage", async () => {
    window.history.replaceState(null, "", `/pedido/confirmado?codigo=${code}&order_nsu=o&transaction_nsu=t&slug=s&paid=true`);
    mount(<ConfirmationPage />);
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith(`/acompanhar/${code}?order_nsu=o&transaction_nsu=t&slug=s`));
    expect(screen.queryByText("Agora é com a Shirley.")).not.toBeInTheDocument();
  });
});
