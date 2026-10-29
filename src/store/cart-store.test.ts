import { beforeEach, describe, expect, it } from "vitest";
import { cartTotalCents, useCartStore } from "./cart-store";

const item = { produtoId: "1", nome: "X-Salada", tipo: "LANCHE" as const, precoBase: "20.00", quantidade: 1, pao: { id: "2", nome: "Francês", acrescimo: "2.00" }, adicionais: [{ id: "3", nome: "Bacon", preco: "4.00", quantidade: 2 }] };
describe("carrinho", () => {
  beforeEach(() => useCartStore.setState({ items: [], hydrated: true }));
  it("agrupa itens com a mesma configuração e soma valores em centavos", () => { useCartStore.getState().addItem(item); useCartStore.getState().addItem(item); expect(useCartStore.getState().items[0].quantidade).toBe(2); expect(cartTotalCents(useCartStore.getState().items)).toBe(6000); });
  it("mantém configurações diferentes em linhas distintas", () => { useCartStore.getState().addItem(item); useCartStore.getState().addItem({ ...item, observacoes: "sem cebola" }); expect(useCartStore.getState().items).toHaveLength(2); });
});

