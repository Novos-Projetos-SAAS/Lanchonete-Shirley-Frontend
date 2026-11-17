import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api-client";
import Page from "./page";

const mocks = vi.hoisted(() => ({ read: vi.fn(), save: vi.fn(), toast: vi.fn(), permissions: new Set<string>() }));
vi.mock("@/services/admin-service", () => ({ adminService: { infinitepayConfiguration: mocks.read, updateInfinitepayConfiguration: mocks.save } }));
vi.mock("@/features/admin/resource-page", () => ({ ResourcePage: () => <div>Cadastro tradicional</div>, resourceConfigs: { "metodos-pagamento": {} } }));
vi.mock("@/features/auth/auth-provider", () => ({ useAuth: () => ({ hasPermission: (permission: string) => mocks.permissions.has(permission) }) }));
vi.mock("@/components/ui/toast", () => ({ useToast: () => ({ toast: mocks.toast }) }));

const config = { versao: 4, ativo: false, pix_habilitado: false, credito_habilitado: false, handle: "loja-fixture", has_api_key: true, backend_public_url: "https://api.example.invalid", redirect_url: "https://site.example.invalid/pedido/confirmado", assured_installments: 0 };
function mount() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  render(<QueryClientProvider client={client}><Page /></QueryClientProvider>);
  return client;
}
async function ready() { return screen.findByLabelText("InfiniteTag"); }
function save() { fireEvent.click(screen.getByRole("button", { name: "Salvar InfinitePay" })); }

describe("configuração administrativa InfinitePay", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.permissions = new Set(["metodos_pagamento.listar", "infinitepay.visualizar", "infinitepay.configurar"]);
    mocks.read.mockResolvedValue(config);
    mocks.save.mockResolvedValue({ ...config, versao: 5 });
  });

  it("carrega configuração sem mostrar a chave salva e preserva o cadastro tradicional", async () => {
    mount(); await ready();
    expect(screen.getByText("Cadastro tradicional")).toBeVisible();
    expect(screen.getByLabelText("API Key")).toHaveValue("");
    expect(screen.getByLabelText("API Key")).toHaveAttribute("type", "password");
    expect(screen.getByText("API Key cadastrada no backend.")).toBeVisible();
    expect(screen.getByLabelText("Ativar InfinitePay")).not.toBeChecked();
    expect(mocks.save).not.toHaveBeenCalled();
  });

  it("salva credencial nova com versão, limpa o campo e não mantém segredo no cache ou storage", async () => {
    mocks.save.mockResolvedValue({ ...config, versao: 5, ativo: true, credito_habilitado: true });
    const client = mount(); await ready();
    client.setQueryData(["payment-methods"], []);
    fireEvent.change(screen.getByLabelText("API Key"), { target: { value: "inchk_nova_fixture" } });
    fireEvent.click(screen.getByLabelText("Habilitar cartão"));
    fireEvent.click(screen.getByLabelText("Ativar InfinitePay"));
    save();
    await waitFor(() => expect(mocks.save).toHaveBeenCalledWith({ versao: 4, ativo: true, pix_habilitado: false, credito_habilitado: true, handle: config.handle, api_key: "inchk_nova_fixture", backend_public_url: config.backend_public_url, redirect_url: config.redirect_url }));
    await waitFor(() => expect(screen.getByLabelText("API Key")).toHaveValue(""));
    expect(client.getQueryState(["payment-methods"])?.isInvalidated).toBe(true);
    expect(JSON.stringify(client.getQueryCache().getAll().map((query) => query.state.data))).not.toContain("inchk_nova_fixture");
    expect(JSON.stringify(client.getMutationCache().getAll().map((mutation) => mutation.state.variables))).not.toContain("inchk_nova_fixture");
    expect(JSON.stringify(localStorage)).not.toContain("inchk_nova_fixture");
    expect(JSON.stringify(sessionStorage)).not.toContain("inchk_nova_fixture");
  });

  it("chave vazia preserva credencial existente e permite desligar a integração", async () => {
    mocks.read.mockResolvedValue({ ...config, ativo: true, credito_habilitado: true });
    mount(); await ready();
    fireEvent.click(screen.getByLabelText("Ativar InfinitePay")); save();
    await waitFor(() => expect(mocks.save).toHaveBeenCalledWith(expect.objectContaining({ ativo: false, versao: 4 })));
    expect(mocks.save.mock.calls[0][0]).not.toHaveProperty("api_key");
  });

  it("rejeita Pix sem cartão antes de enviar alteração", async () => {
    mount(); await ready();
    fireEvent.click(screen.getByLabelText("Habilitar Pix")); save();
    await waitFor(() => expect(screen.getAllByRole("alert").some((node) => node.textContent?.includes("Pix online exige cartão"))).toBe(true));
    expect(mocks.save).not.toHaveBeenCalled();
  });

  it("rejeita URL HTTP na ativação", async () => {
    mount(); await ready();
    fireEvent.click(screen.getByLabelText("Habilitar cartão"));
    fireEvent.click(screen.getByLabelText("Ativar InfinitePay"));
    fireEvent.change(screen.getByLabelText("URL pública do backend"), { target: { value: "http://localhost:3333" } }); save();
    await waitFor(() => expect(screen.getAllByRole("alert").some((node) => node.textContent?.includes("HTTPS"))).toBe(true));
    expect(mocks.save).not.toHaveBeenCalled();
  });

  it("exibe conflito de versão sem anunciar configuração salva", async () => {
    mocks.save.mockRejectedValue(new ApiError("Configuração alterada por outro usuário. Recarregue antes de salvar.", 409, "INFINITEPAY_CONFIG_VERSION_CONFLICT"));
    mount(); await ready(); save();
    await waitFor(() => expect(screen.getAllByRole("alert").some((node) => node.textContent?.includes("Configuração alterada"))).toBe(true));
    expect(mocks.toast).not.toHaveBeenCalledWith(expect.objectContaining({ tone: "success" }));
  });

  it("perfil de consulta não altera campos nem salva", async () => {
    mocks.permissions.delete("infinitepay.configurar");
    mount(); await ready();
    expect(screen.getByLabelText("API Key")).toBeDisabled();
    expect(screen.getByLabelText("Ativar InfinitePay")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Salvar InfinitePay" })).toBeDisabled();
  });

  it("não consulta InfinitePay sem permissão de visualização", async () => {
    mocks.permissions.delete("infinitepay.visualizar");
    mount();
    expect(screen.getByText("Cadastro tradicional")).toBeVisible();
    expect(screen.queryByLabelText("API Key")).not.toBeInTheDocument();
    expect(mocks.read).not.toHaveBeenCalled();
  });
});
