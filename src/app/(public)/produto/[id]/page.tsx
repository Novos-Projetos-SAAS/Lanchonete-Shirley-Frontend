import type { Metadata } from "next";
import { ProductCustomizer } from "@/features/catalog/product-customizer";
export const metadata: Metadata = { title: "Personalizar produto" };
export default function ProductPage() { return <ProductCustomizer />; }

