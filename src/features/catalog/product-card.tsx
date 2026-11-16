import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductImage } from "@/components/shared/product-image";
import { CurrencyText } from "@/components/ui";
import { buildProductHref, saveMenuPosition } from "@/lib/menu-context";
import type { Product } from "@/types/domain";

export function ProductCard({ product, menuReturnPath }: { product: Product; menuReturnPath: string }) {
  const href = buildProductHref(product.id, menuReturnPath);
  const actionLabel = product.tipo === "LANCHE" ? "Ver opções" : "Ver item";
  return (
    <article className="card product-card">
      <div className="product-card__image">
        <ProductImage product={product} sizes="(min-width: 77rem) 27rem, (min-width: 64rem) calc((100vw - 23rem) / 2), (min-width: 36rem) calc((100vw - 3rem) / 2), calc(100vw - 2rem)" />
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

