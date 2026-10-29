import type { Metadata } from "next";
import { ConfirmationPage } from "@/features/orders/confirmation-page";
export const metadata: Metadata = { title: "Pedido confirmado", robots: { index: false, follow: false } };
export default function Page() { return <ConfirmationPage />; }

