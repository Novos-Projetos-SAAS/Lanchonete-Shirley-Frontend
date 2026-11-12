import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearRecentOrders, readRecentOrders, RECENT_ORDERS_KEY, RECENT_ORDERS_LIMIT, RECENT_ORDERS_TTL_MS, rememberRecentOrder } from "./recent-orders";

describe("histórico local de pedidos", () => {
  beforeEach(() => localStorage.clear());

  it("guarda somente a referência mínima e sobrevive a uma nova leitura", () => {
    const now = new Date("2026-11-09T12:00:00.000Z");
    expect(rememberRecentOrder({ pedido_id: "42", codigo_acompanhamento: "a".repeat(32), criado_em: now.toISOString(), cliente_nome: "Não guardar", total: "99.00" }, now)).toBe(true);
    expect(JSON.parse(localStorage.getItem(RECENT_ORDERS_KEY) || "{}").items[0]).toEqual({ code: "a".repeat(32), orderId: "42", createdAt: now.toISOString(), savedAt: now.toISOString() });
    expect(readRecentOrders(now.getTime())).toHaveLength(1);
  });

  it("limita, deduplica e remove referências expiradas", () => {
    const base = new Date("2026-11-09T12:00:00.000Z");
    for (let index = 0; index < RECENT_ORDERS_LIMIT + 2; index += 1) {
      rememberRecentOrder({ pedido_id: String(index + 1), codigo_acompanhamento: index.toString(16).padStart(32, "0") }, new Date(base.getTime() + index));
    }
    expect(readRecentOrders(base.getTime() + RECENT_ORDERS_LIMIT + 2)).toHaveLength(RECENT_ORDERS_LIMIT);
    expect(readRecentOrders(base.getTime() + RECENT_ORDERS_TTL_MS + RECENT_ORDERS_LIMIT + 3)).toEqual([]);
  });

  it("descarta conteúdo corrompido e tolera falha do armazenamento", () => {
    localStorage.setItem(RECENT_ORDERS_KEY, "{invalido");
    expect(readRecentOrders()).toEqual([]);
    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("quota"); });
    expect(rememberRecentOrder({ codigo_acompanhamento: "b".repeat(32) })).toBe(false);
    spy.mockRestore();
    expect(clearRecentOrders()).toBe(true);
  });
});
