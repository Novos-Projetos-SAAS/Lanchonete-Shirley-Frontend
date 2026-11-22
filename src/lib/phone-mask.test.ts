import { describe, expect, it } from "vitest";
import { isValidBrazilianMobile, maskBrazilianMobile } from "./phone-mask";

describe("máscara de celular brasileiro", () => {
  it("permite apagar o conteúdo completamente", () => {
    expect(maskBrazilianMobile("")).toBe("");
    expect(maskBrazilianMobile("1")).toBe("(1");
    expect(maskBrazilianMobile("18")).toBe("(18");
  });

  it("aplica a máscara progressivamente", () => {
    expect(maskBrazilianMobile("189")).toBe("(18) 9");
    expect(maskBrazilianMobile("1899999")).toBe("(18) 99999");
    expect(maskBrazilianMobile("18999999999")).toBe("(18) 99999-9999");
  });

  it("ignora dígitos excedentes e caracteres não numéricos", () => {
    expect(maskBrazilianMobile("189999999991234")).toBe("(18) 99999-9999");
    expect(maskBrazilianMobile("(18) 99999-9999")).toBe("(18) 99999-9999");
  });

  it("aceita colagem com código brasileiro +55", () => {
    expect(maskBrazilianMobile("+55 (18) 99999-9999")).toBe("(18) 99999-9999");
  });

  it("valida 11 dígitos com DDD antes de enviar o pedido", () => {
    expect(isValidBrazilianMobile("(18) 99999-9999")).toBe(true);
    expect(isValidBrazilianMobile("(18) 9999-9999")).toBe(false);
    expect(isValidBrazilianMobile("(18) 99999-999")).toBe(false);
    expect(isValidBrazilianMobile("(18) 99999-99991")).toBe(false);
    expect(isValidBrazilianMobile("")).toBe(false);
  });
});
