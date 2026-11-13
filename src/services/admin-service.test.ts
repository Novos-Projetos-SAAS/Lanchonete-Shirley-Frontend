import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiRequest } from "@/lib/api-client";
import { adminService } from "./admin-service";

vi.mock("@/lib/api-client", () => ({ apiRequest: vi.fn() }));

const request = vi.mocked(apiRequest);

describe("adminService listagens", () => {
  beforeEach(() => request.mockReset());

  it("preserva ativo=false, busca, página e limite 10 na Equipe", () => {
    adminService.listResource("usuarios", { page: 3, busca: "ana", ativo: false });
    const params = new URL(String(request.mock.calls[0][0]), "https://local.test").searchParams;
    expect(params.get("page")).toBe("3");
    expect(params.get("limit")).toBe("10");
    expect(params.get("busca")).toBe("ana");
    expect(params.get("ativo")).toBe("false");
  });

  it("usa 10 registros nas demais tabelas administrativas", () => {
    adminService.orders({ page: 2 });
    adminService.invitations({ page: 2 });
    adminService.notifications(2);
    adminService.printJobs("PENDENTE", 2);
    for (const [endpoint] of request.mock.calls) expect(new URL(String(endpoint), "https://local.test").searchParams.get("limit")).toBe("10");
  });

  it("mantém 10 linhas na prévia paginada de relatório", () => {
    adminService.generateReport("faturamento_periodo", {}, 4);
    expect(request).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ body: { filtros: {}, page: 4, limit: 10 } }));
  });
});

describe("adminService configurações da loja", () => {
  beforeEach(() => request.mockReset());

  it("não envia o controle de recebimento pela rota de configurações", () => {
    adminService.updateStoreConfig({
      nome_fantasia: "Lanchonete Shirley",
      aceitar_pedidos: true,
      metodo_impressao: "ANDROID_BLUETOOTH",
      imprimir_automaticamente: true,
    });

    expect(request).toHaveBeenCalledWith("/admin/loja/configuracoes", {
      method: "PATCH",
      body: {
        nome_fantasia: "Lanchonete Shirley",
        metodo_impressao: "ANDROID_BLUETOOTH",
        imprimir_automaticamente: true,
      },
      csrf: true,
    });
  });
});
