/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { ArrowRight, ImageOff } from "lucide-react";
import { Badge, CurrencyText } from "@/components/ui";
import { buildProductHref, saveMenuPosition } from "@/lib/menu-context";
import type { Product } from "@/types/domain";

export function ProductCard({ product, menuReturnPath }: { product: Product; menuReturnPath: string }) {
  const href = buildProductHref(product.id, menuReturnPath);
  const actionLabel = product.tipo === "LANCHE" ? "Personalizar" : "Ver item";
  return (
    <article className="card product-card">
      <div className="product-card__image">
        {product.imagem_url
          ? <img src={product.imagem_url} alt="" width={640} height={420} loading="lazy" />
          : <div className="product-placeholder"><ImageOff aria-hidden /><span style={{ color: "#535b66" }}>Imagem em breve</span></div>}
        <Badge>{product.tipo === "LANCHE" ? "Personalizável" : product.tipo.toLocaleLowerCase("pt-BR")}</Badge>
      </div>
      <div className="product-card__body">
        <div><h4>{product.nome}</h4>{product.descricao && <p>{product.descricao}</p>}</div>
        <div className="product-card__foot">
          <div><small>A partir de</small><CurrencyText value={product.preco_base} /></div>
          <Link href={href} onClick={() => saveMenuPosition(menuReturnPath, window.scrollY)} aria-label={`${actionLabel} ${product.nome}`}>
            <span>{actionLabel}</span><ArrowRight aria-hidden />
          </Link>
        </div>
      </div>
    </article>
  );
}

