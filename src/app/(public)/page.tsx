import type { Metadata } from "next";
import { MenuPage } from "@/features/catalog/menu-page";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return <MenuPage />;
}
