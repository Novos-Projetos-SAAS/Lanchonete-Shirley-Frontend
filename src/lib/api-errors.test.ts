import { describe, expect, it } from "vitest";
import { ApiError } from "./api-client";
import { apiErrorMessage, clearFormFieldError, toFormError } from "./api-errors";

describe("feedback seguro da API", () => {
  it("mapeia detalhes e referência para campos do formulário", () => {
    const feedback = toFormError(new ApiError(
      "Informe o preço base antes de ativar o produto.",
      422,
      "PRODUCT_PRICE_REQUIRED",
      "request-123",
      [{ path: "preco_base", message: "Informe o preço base." }],
    ), { prefix: "Não foi possível ativar o produto." });
    expect(feedback).toEqual({
      message: "Não foi possível ativar o produto. Informe o preço base antes de ativar o produto.",
      fields: { preco_base: "Informe o preço base." },
      requestId: "request-123",
    });
  });

  it("usa campo conhecido quando uma API antiga não envia details", () => {
    expect(toFormError(new ApiError("Preço obrigatório", 422, "PRODUCT_PRICE_REQUIRED")).fields).toEqual({ preco_base: "Preço obrigatório" });
  });

  it("diferencia rede, timeout e falha inesperada", () => {
    expect(apiErrorMessage(new ApiError("", 0, "NETWORK_ERROR"))).toMatch(/conectar/i);
    expect(apiErrorMessage(new ApiError("", 408, "REQUEST_TIMEOUT"))).toMatch(/demorou/i);
    expect(apiErrorMessage(new Error("segredo"))).toBe("Não foi possível concluir a solicitação.");
  });

  it("limpa somente o campo corrigido", () => {
    const feedback = { message: "Revise", fields: { nome: "Obrigatório", email: "Inválido" } };
    expect(clearFormFieldError(feedback, "nome")?.fields).toEqual({ email: "Inválido" });
  });
});
