import type { Metadata } from "next";
import { CheckoutPage } from "@/features/checkout/checkout-page";
export const metadata: Metadata = { title: "Finalizar pedido" };
export default function Page() { return <CheckoutPage />; }

