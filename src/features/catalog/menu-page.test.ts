import { describe, expect, it } from "vitest";
import type { PublicMenu } from "@/types/domain";
import { visibleMenuCategories } from "./menu-page";

const menu: PublicMenu = [
  { id: "1", nome: "Lanches", slug: "lanches", produtos: [{ id: "10", categoria_id: "1", nome: "X-Bacon", tipo: "LANCHE", preco_base: "20.00", ativo: true, disponivel_hoje: true }] },
  { id: "2", nome: "Bebidas", slug: "bebidas", produtos: [{ id: "20", categoria_id: "2", nome: "Refrigerante", descricao: "Lata gelada", tipo: "BEBIDA", preco_base: "6.00", ativo: true, disponivel_hoje: true }] },
  { id: "3", nome: "Vazia", slug: "vazia", produtos: [] },
];

describe("organização do cardápio", () => {
  it("mantém seções ordenadas em Todos e remove categorias vazias", () => {
    expect(visibleMenuCategories(menu, "", "todos").map((category) => category.nome)).toEqual(["Lanches", "Bebidas"]);
  });

  it("mostra somente a categoria selecionada e combina com busca", () => {
    expect(visibleMenuCategories(menu, "", "2").map((category) => category.nome)).toEqual(["Bebidas"]);
    expect(visibleMenuCategories(menu, "bacon", "2")).toEqual([]);
    expect(visibleMenuCategories(menu, "gelada", "todos").map((category) => category.nome)).toEqual(["Bebidas"]);
  });
});
