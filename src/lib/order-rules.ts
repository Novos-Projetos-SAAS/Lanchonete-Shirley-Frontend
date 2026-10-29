import type { AdditionalOption, Product } from "@/types/domain";

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

