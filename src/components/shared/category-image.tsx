"use client";

import Image from "next/image";
import { useState, type ReactNode } from "react";
import { Store } from "lucide-react";

/** Mantém os acentos e transforma apenas espaços em hífens. */
export function categoryImagePath(name: string): string {
  const filename = name.normalize("NFC").trim().toLocaleLowerCase("pt-BR").replace(/\s+/g, "-").replace(/[\\/]/g, "-");
  return `/images/produtos/categorias/${encodeURIComponent(filename)}.png`;
}

interface CategoryImageProps {
  name: string;
  sizes?: string;
  fallback?: ReactNode;
}

export function CategoryImage({ name, sizes = "72px", fallback = <Store aria-hidden /> }: CategoryImageProps) {
  const src = categoryImagePath(name);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (failedSrc === src) return <>{fallback}</>;

  return (
    <Image
      src={src}
      alt=""
      width={72}
      height={72}
      sizes={sizes}
      unoptimized
      style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "inherit" }}
      onError={() => setFailedSrc(src)}
    />
  );
}
