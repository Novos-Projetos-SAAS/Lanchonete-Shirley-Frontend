import { describe, expect, it } from "vitest";
import { validateProductSelection } from "./order-rules";
import type { Product } from "@/types/domain";

const burger: Product = { id: "1", categoria_id: "1", nome: "X-Salada", tipo: "LANCHE", preco_base: "20.00", ativo: true, disponivel_hoje: true, tipos_pao: [{ id: "2", nome: "Francês", acrescimo: "2.00", ativo: true }], adicionais: [{ id: "3", nome: "Bacon", preco: "4.00", ativo: true, disponivel_hoje: true, max_quantidade_por_item: 2 }] };
describe("regras de montagem", () => {
  it("exige pão para lanche", () => { expect(validateProductSelection(burger, null, {})).toContainEqual(expect.stringMatching(/pão/i)); });
  it("bloqueia adicional acima do limite", () => { expect(validateProductSelection(burger, "2", { "3": 3 })).toContainEqual(expect.stringMatching(/máximo é 2/i)); });
  it("não exige pão em bebida", () => { expect(validateProductSelection({ ...burger, tipo: "BEBIDA" }, null, {})).toEqual([]); });
});

