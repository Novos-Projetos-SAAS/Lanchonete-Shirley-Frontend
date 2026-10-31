import type { Product } from "@/types/domain";

type ProductImageSource = Pick<Product, "nome" | "descricao" | "imagem_url">;

const DEMO_IMAGE_BY_NAME: Record<string, string> = {
  "hamburguer classico": "/images/produtos/hamburguer-classico.webp",
  "x salada": "/images/produtos/x-salada-corrigido.webp",
  "x bacon": "/images/produtos/x-bacon.webp",
  "x egg": "/images/produtos/x-egg.webp",
  "x tudo": "/images/produtos/x-tudo.webp",
  "x frango": "/images/produtos/x-frango.webp",
  "x calabresa": "/images/produtos/x-calabresa.webp",
  "batata frita pequena": "/images/produtos/batata-frita-pequena.webp",
  "batata frita grande": "/images/produtos/batata-frita-grande.webp",
  "calabresa acebolada": "/images/produtos/calabresa-acebolada.webp",
  "agua mineral 500 ml": "/images/produtos/agua-mineral-500ml.webp",
  "refrigerante lata 350 ml": "/images/produtos/refrigerante-lata-350ml.webp",
  "suco natural 300 ml": "/images/produtos/suco-natural-300ml.webp",
  "refrigerante 2 litros": "/images/produtos/refrigerante-2-litros.webp",
};

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function resolveDemoProductImage(product: ProductImageSource) {
  const description = normalize(product.descricao || "");
  if (!description.includes("demo shirley v1")) return null;
  return DEMO_IMAGE_BY_NAME[normalize(product.nome)] || null;
}

export function resolveProductImage(product: ProductImageSource) {
  const configured = product.imagem_url?.trim();
  return configured || resolveDemoProductImage(product);
}

