import type { Metadata } from "next";
import { TrackingSearch } from "@/features/orders/tracking-search";
export const metadata: Metadata = { title: "Acompanhar pedido", robots: { index: false, follow: false } };
export default function Page() { return <TrackingSearch />; }

