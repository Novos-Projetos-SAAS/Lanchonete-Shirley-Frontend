import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearAttempt, getOrCreateAttempt, readAttempt } from "./idempotency";

describe("idempotência do checkout", () => {
  beforeEach(() => { clearAttempt(); vi.stubGlobal("crypto", { randomUUID: vi.fn().mockReturnValueOnce("11111111-1111-4111-8111-111111111111").mockReturnValueOnce("22222222-2222-4222-8222-222222222222") }); });
  it("reutiliza chave enquanto body não muda", () => { const first = getOrCreateAttempt({ itens: [1] }); const retry = getOrCreateAttempt({ itens: [1] }); expect(retry.key).toBe(first.key); expect(readAttempt()?.body).toBe(first.body); });
  it("troca a chave quando o payload muda", () => { const first = getOrCreateAttempt({ itens: [1] }); const second = getOrCreateAttempt({ itens: [2] }); expect(second.key).not.toBe(first.key); });
});

