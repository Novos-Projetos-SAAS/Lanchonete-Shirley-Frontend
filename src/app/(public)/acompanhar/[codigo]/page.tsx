import type { Metadata } from "next";
import { TrackingPage } from "@/features/orders/tracking-page";
export const metadata: Metadata = { title: "Andamento do pedido", robots: { index: false, follow: false } };
export default function Page() { return <TrackingPage />; }

