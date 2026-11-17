import type { OrderPayment, OrderStatus, PaymentReturn } from "@/types/domain";

export function checkoutUrl(value: string | null | undefined): string | null {
  try {
    const url = new URL(value ?? "");
    return url.protocol === "https:" && !url.username && !url.password && !url.port
      && ["buy.infinitepay.io", "checkout.infinitepay.io"].includes(url.hostname) ? url.href : null;
  } catch { return null; }
}

export function paymentReturn(search: string): PaymentReturn | null {
  const params = new URLSearchParams(search);
  const keys = ["order_nsu", "transaction_nsu", "slug"] as const;
  const result = {} as PaymentReturn;
  for (const key of keys) {
    const values = params.getAll(key);
    const value = values[0];
    if (values.length !== 1 || !value || value.length > (key === "order_nsu" ? 100 : 200) || !/^[A-Za-z0-9_.:-]+$/.test(value)) return null;
    result[key] = value;
  }
  if (params.has("invoice_slug") && (params.getAll("invoice_slug").length !== 1 || params.get("invoice_slug") !== result.slug)) return null;
  return result;
}

export function trackingUrl(code: string, search = ""): string | null {
  if (!/^[a-f0-9]{32}$/.test(code)) return null;
  const signal = paymentReturn(search);
  return `/acompanhar/${code}${signal ? `?${new URLSearchParams({ ...signal })}` : ""}`;
}

export function paymentFeedback(payment: OrderPayment, status: OrderStatus) {
  if (status === "CANCELADO") return { title: "Pedido cancelado", description: "Este pedido não será preparado. Se houve pagamento, entre em contato com a loja para conferência." };
  if (payment.estado === "PAGO_VERIFICADO" && payment.liberado_operacionalmente) return { title: "Pagamento confirmado", description: "Pagamento verificado pela loja com a InfinitePay. Pedido liberado para atendimento." };
  if (payment.estado === "PAGO_EM_REVISAO" || payment.estado === "PAGO_VERIFICADO") return { title: "Pagamento em análise", description: "A loja precisa conferir este pagamento antes de liberar o pedido. Não pague novamente." };
  if (payment.estado === "EXPIRADO") return { title: "Checkout expirado", description: "Se já pagou, consulte o status e fale com a loja. Para evitar duplicidade, não faça outro pedido." };
  if (payment.estado === "CRIACAO_INCERTA") return { title: "Checkout indisponível", description: "Não foi possível confirmar a criação do checkout. Consulte o status ou fale com a loja; não faça outro pedido." };
  if (payment.estado === "AGUARDANDO_CRIACAO" || payment.estado === "CRIANDO") return { title: "Preparando pagamento", description: "O pedido está salvo. Aguarde a disponibilização do checkout, sem enviar outro pedido." };
  return { title: "Aguardando pagamento", description: "Seu pedido está salvo e aguarda confirmação oficial do pagamento para ser preparado. Se o pagamento foi recusado, confira o checkout existente; não faça outro pedido." };
}
