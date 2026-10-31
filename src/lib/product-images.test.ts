import { describe, expect, it } from "vitest";
import { resolveDemoProductImage, resolveProductImage } from "@/lib/product-images";

describe("imagens demonstrativas de produtos", () => {
  it("mantém a URL cadastrada como fonte prioritária", () => {
    expect(resolveProductImage({
      nome: "X-Bacon",
      descricao: "[DEMO-SHIRLEY-V1] Produto demonstrativo.",
      imagem_url: "https://cdn.example.invalid/x-bacon-real.webp",
    })).toBe("https://cdn.example.invalid/x-bacon-real.webp");
  });

  it("resolve o ativo local apenas para o catálogo demo identificado", () => {
    expect(resolveProductImage({
      nome: "X-Salada",
      descricao: "Hambúrguer, queijo, alface e tomate. [DEMO-SHIRLEY-V1]",
      imagem_url: null,
    })).toBe("/images/produtos/x-salada-corrigido.webp");

    expect(resolveProductImage({
      nome: "Água Mineral 500 ml",
      descricao: "Item para demonstração [DEMO-SHIRLEY-V1]",
      imagem_url: null,
    })).toBe("/images/produtos/agua-mineral-500ml.webp");
  });

  it("não associa fotografia demonstrativa a produto comercial homônimo", () => {
    const product = { nome: "X-Salada", descricao: "Hambúrguer, queijo, alface e tomate.", imagem_url: null };
    expect(resolveDemoProductImage(product)).toBeNull();
    expect(resolveProductImage(product)).toBeNull();
  });
});

