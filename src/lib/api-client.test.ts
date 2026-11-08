import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiRequest, clearCsrfToken, isVersionConflict, SESSION_EXPIRED_EVENT } from "./api-client";

const json = (status: number, body: unknown) => Promise.resolve(new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } }));
describe("cliente HTTP seguro", () => {
  beforeEach(() => clearCsrfToken());
  it("coordena CSRF, refresh e uma única repetição em 401", async () => {
    const fetchMock = vi.fn().mockImplementationOnce(() => json(401, { status: "fail", code: "UNAUTHENTICATED", message: "Sessão vencida" })).mockImplementationOnce(() => json(200, { status: "success", data: { csrf_token: "csrf-token" } })).mockImplementationOnce(() => json(200, { status: "success", data: { usuario: { id: "1" } } })).mockImplementationOnce(() => json(200, { status: "success", data: { id: "9" } }));
    vi.stubGlobal("fetch", fetchMock); await expect(apiRequest<{ id: string }>("/admin/pedidos/9")).resolves.toEqual({ id: "9" }); expect(fetchMock).toHaveBeenCalledTimes(4);
  });
  it("renova também a consulta de sessão em /auth/me", async () => {
    const fetchMock = vi.fn().mockImplementationOnce(() => json(401, { status: "fail", code: "UNAUTHENTICATED", message: "Sessão vencida" })).mockImplementationOnce(() => json(200, { status: "success", data: { csrf_token: "csrf-token" } })).mockImplementationOnce(() => json(200, { status: "success", data: { usuario: { id: "1" } } })).mockImplementationOnce(() => json(200, { status: "success", data: { id: "1", nome: "Shirley" } }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(apiRequest<{ id: string }>("/auth/me")).resolves.toMatchObject({ id: "1" });
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });
  it("emite expiração e não repete indefinidamente quando o refresh falha", async () => {
    const expired = vi.fn();
    window.addEventListener(SESSION_EXPIRED_EVENT, expired, { once: true });
    const fetchMock = vi.fn().mockImplementationOnce(() => json(401, { status: "fail", code: "UNAUTHENTICATED", message: "Sessão vencida" })).mockImplementationOnce(() => json(200, { status: "success", data: { csrf_token: "csrf-token" } })).mockImplementationOnce(() => json(401, { status: "fail", code: "INVALID_REFRESH", message: "Sessão encerrada" }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(apiRequest("/auth/me")).rejects.toMatchObject({ status: 401 });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(expired).toHaveBeenCalledTimes(1);
  });
  it("reconhece conflito de versão 409", async () => { vi.stubGlobal("fetch", vi.fn(() => json(409, { status: "fail", code: "ORDER_VERSION_CONFLICT", message: "Atualize", request_id: "req" }))); let received: unknown; try { await apiRequest("/admin/pedidos/1/status", { method: "PATCH", body: {}, retryAuth: false }); } catch (error) { received = error; } expect(received).toBeInstanceOf(ApiError); expect(isVersionConflict(received)).toBe(true); });
  it("usa fallback por status e ignora envelope técnico malformado", async () => {
    vi.stubGlobal("fetch", vi.fn(() => json(503, { status: "fail", code: "<html>", message: { stack: "segredo" }, details: [{ path: 12, message: "raw" }] })));
    await expect(apiRequest("/indisponivel", { retryAuth: false })).rejects.toMatchObject({
      status: 503, code: "HTTP_503", message: "O serviço está temporariamente indisponível.", details: [],
    });
  });
  it.each([
    [400, /processar/i], [401, /sessão expirou/i], [403, /permissão/i], [404, /não foi encontrado/i],
    [409, /conflita/i], [413, /limite/i], [422, /revise/i], [429, /muitas tentativas/i], [500, /falha no servidor/i],
  ])("aplica fallback seguro ao HTTP %i", async (status, expected) => {
    vi.stubGlobal("fetch", vi.fn(() => json(status, { status: "fail" })));
    await expect(apiRequest(`/erro-${status}`, { retryAuth: false })).rejects.toMatchObject({ status, message: expect.stringMatching(expected) });
  });
});

