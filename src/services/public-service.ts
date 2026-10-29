import { apiRequest } from "@/lib/api-client";
import type { CreateOrderInput, InvitationValidation, OrderSummary, PaymentMethod, Product, PublicMenu, StoreStatus } from "@/types/domain";

export const publicService = {
  status: () => apiRequest<StoreStatus>("/loja/status", { retryAuth: false }),
  menu: () => apiRequest<PublicMenu>("/cardapio", { retryAuth: false }),
  product: (id: string) => apiRequest<Product>(`/cardapio/produtos/${encodeURIComponent(id)}`, { retryAuth: false }),
  paymentMethods: () => apiRequest<PaymentMethod[]>("/metodos-pagamento", { retryAuth: false }),
  createOrder: (body: CreateOrderInput, idempotencyKey: string) => apiRequest<OrderSummary>("/pedidos", { method: "POST", headers: { "Idempotency-Key": idempotencyKey }, body, retryAuth: false }),
  track: (code: string) => apiRequest<OrderSummary>(`/pedidos/acompanhar/${encodeURIComponent(code)}`, { retryAuth: false }),
  validateInvitation: (token: string) => apiRequest<InvitationValidation>("/convites/validar", { method: "POST", body: { token }, retryAuth: false }),
  acceptInvitation: (body: { token: string; nome: string; senha: string; confirmar_senha: string }) => apiRequest<{ aceito: boolean; login_necessario: boolean }>("/convites/aceitar", { method: "POST", body, retryAuth: false }),
};

