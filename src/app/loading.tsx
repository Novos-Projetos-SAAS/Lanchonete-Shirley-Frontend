import { Skeleton } from "@/components/ui";
export default function Loading() { return <main className="container route-loading" aria-busy="true" aria-label="Carregando"><Skeleton className="skeleton--title" /><Skeleton className="skeleton--hero" /><div className="product-grid"><Skeleton className="skeleton--card" /><Skeleton className="skeleton--card" /><Skeleton className="skeleton--card" /></div></main>; }

