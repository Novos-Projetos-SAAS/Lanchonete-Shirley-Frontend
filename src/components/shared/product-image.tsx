"use client";

/* eslint-disable @next/next/no-img-element */
import Image from "next/image";
import { useState } from "react";
import { ImageOff } from "lucide-react";
import { resolveDemoProductImage } from "@/lib/product-images";
import type { Product } from "@/types/domain";

interface ProductImageProps {
  product: Product;
  sizes: string;
  priority?: boolean;
  largePlaceholder?: boolean;
  fill?: boolean;
}

export function ProductImage({ product, sizes, priority = false, largePlaceholder = false, fill = true }: ProductImageProps) {
  const [failedSources, setFailedSources] = useState<string[]>([]);
  const configured = product.imagem_url?.trim();
  const demo = resolveDemoProductImage(product);
  const sources = [configured, demo].filter((source, index, values): source is string => Boolean(source) && values.indexOf(source) === index);
  const source = sources.find((candidate) => !failedSources.includes(candidate));
  const markFailed = () => source && setFailedSources((current) => current.includes(source) ? current : [...current, source]);

  if (!source) {
    return <div className={`product-placeholder${largePlaceholder ? " product-placeholder--large" : ""}`}><ImageOff aria-hidden /><span>Imagem em breve</span></div>;
  }

  if (source.startsWith("/")) {
    return fill
      ? <Image src={source} alt={product.nome} fill sizes={sizes} priority={priority} onError={markFailed} />
      : <Image src={source} alt={product.nome} width={900} height={900} sizes={sizes} priority={priority} onError={markFailed} />;
  }

  return <img src={source} alt={product.nome} width={900} height={900} loading={priority ? "eager" : "lazy"} onError={markFailed} />;
}

