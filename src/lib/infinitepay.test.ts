import { describe, expect, it } from "vitest";
import { checkoutUrl, paymentFeedback, paymentReturn, trackingUrl } from "./infinitepay";

const code = "abcdef0123456789abcdef0123456789";
const signal = "order_nsu=order-1&transaction_nsu=transaction-1&slug=invoice-1";

describe("checkout hospedado InfinitePay", () => {
  it.each(["https://buy.infinitepay.io/loja/checkout", "https://checkout.infinitepay.io/checkout/1"])("aceita checkout oficial %s", (url) => {
    expect(checkoutUrl(url)).toBe(url);
  });
  it.each([undefined, "javascript:alert(1)", "http://buy.infinitepay.io/x", "https://buy.infinitepay.io.evil.invalid/x", "https://user:secret@buy.infinitepay.io/x", "https://buy.infinitepay.io:444/x"])("rejeita destino externo ou inseguro %s", (url) => {
    expect(checkoutUrl(url)).toBeNull();
  });
  it("encaminha somente identificadores, nunca uma alegação de pagamento", () => {
    expect(paymentReturn(`?${signal}&paid=true&amount=1&receipt_url=https://evil.invalid`)).toEqual({ order_nsu: "order-1", transaction_nsu: "transaction-1", slug: "invoice-1" });
    expect(trackingUrl(code, `?${signal}&paid=true`)).toBe(`/acompanhar/${code}?${signal}`);
  });
  it.each(["?paid=true", "?order_nsu=1&transaction_nsu=2", `?${signal}&slug=outro`, "?order_nsu=1&transaction_nsu=2&slug=https://evil.invalid", "?order_nsu=1&transaction_nsu=2&slug=x&invoice_slug=y"])("ignora retorno incompleto ou adulterado %s", (search) => {
    expect(paymentReturn(search)).toBeNull();
    expect(trackingUrl(code, search)).toBe(`/acompanhar/${code}`);
  });
  it("não aceita código de acompanhamento arbitrário", () => {
    expect(trackingUrl("https://evil.invalid", `?${signal}`)).toBeNull();
  });
  it("pagamento pendente não anuncia produção", () => {
    expect(paymentFeedback({ fluxo: "INFINITEPAY", estado: "AGUARDANDO_PAGAMENTO", liberado_operacionalmente: false }, "PENDENTE").title).toBe("Aguardando pagamento");
  });
  it("confirmação financeira sem liberação exige revisão", () => {
    expect(paymentFeedback({ fluxo: "INFINITEPAY", estado: "PAGO_EM_REVISAO", liberado_operacionalmente: false }, "PENDENTE").title).toBe("Pagamento em análise");
  });
  it("pagamento verificado e liberado permite produção", () => {
    expect(paymentFeedback({ fluxo: "INFINITEPAY", estado: "PAGO_VERIFICADO", liberado_operacionalmente: true }, "PENDENTE").title).toBe("Pagamento confirmado");
  });
  it.each(["CRIACAO_INCERTA", "EXPIRADO"] as const)("informa estado %s sem sugerir cobrança nova", (estado) => {
    expect(paymentFeedback({ fluxo: "INFINITEPAY", estado, liberado_operacionalmente: false }, "PENDENTE").description).toContain("não faça outro pedido");
  });
  it("pedido cancelado nunca anuncia liberação, mesmo com pagamento registrado", () => {
    expect(paymentFeedback({ fluxo: "INFINITEPAY", estado: "PAGO_VERIFICADO", liberado_operacionalmente: false }, "CANCELADO").title).toBe("Pedido cancelado");
  });
});
