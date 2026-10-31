import type { AdditionalOption, DeliveryType, OrderStatus, Product } from "@/types/domain";

export const ORDER_STATUS_SEQUENCES: Record<DeliveryType, OrderStatus[]> = {
  RETIRADA: ["PENDENTE", "EM_PREPARO", "PRONTO_PARA_RETIRADA", "ENTREGUE"],
  ENTREGA: ["PENDENTE", "EM_PREPARO", "SAIU_PARA_ENTREGA", "ENTREGUE"],
};

export function orderStatusOptions(deliveryType: DeliveryType, currentStatus: OrderStatus) {
  const sequence = ORDER_STATUS_SEQUENCES[deliveryType];
  const currentIndex = sequence.indexOf(currentStatus);
  return sequence.map((status, index) => ({ status, current: index === currentIndex, past: currentIndex >= 0 && index < currentIndex, disabled: currentIndex < 0 || index <= currentIndex }));
}

export function requiresStatusConfirmation(deliveryType: DeliveryType, currentStatus: OrderStatus, nextStatus: OrderStatus) {
  const sequence = ORDER_STATUS_SEQUENCES[deliveryType];
  const currentIndex = sequence.indexOf(currentStatus);
  const nextIndex = sequence.indexOf(nextStatus);
  return nextStatus === "ENTREGUE" || nextIndex - currentIndex > 1;
}

export function validateProductSelection(
  product: Product,
  breadId: string | null,
  additionals: Record<string, number>,
) {
  const errors: string[] = [];
  if (product.tipo === "LANCHE" && !breadId) errors.push("Escolha um tipo de pão para continuar.");
  for (const item of product.adicionais || []) {
    const id = item.adicional_id || item.id;
    const quantity = additionals[id] || 0;
    if (quantity > (item.max_quantidade_por_item || 20)) {
      errors.push(`${item.nome}: o máximo é ${item.max_quantidade_por_item || 20}.`);
    }
  }
  return errors;
}

export function isAdditionalAvailable(item: AdditionalOption) {
  return item.ativo && item.disponivel_hoje;
}

