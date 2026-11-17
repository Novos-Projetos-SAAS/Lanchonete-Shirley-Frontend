import type { Metadata, Viewport } from "next";
import "@fontsource-variable/bricolage-grotesque";
import "@fontsource-variable/nunito-sans";
import "./globals.css";
import { Providers } from "@/components/providers";
import { ConnectionBanner } from "@/components/shared/connection-banner";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL?.trim() || (
  process.env.NODE_ENV === "production"
    ? "https://lanchonete-shirley-frontend.vercel.app"
    : "http://localhost:3000"
));

const siteTitle = "Shirley Lanches Artesanal | Peça online";
const siteDescription = "Hambúrgueres artesanais, cachorro-quente, batatas fritas e bebidas. Confira o cardápio da Shirley e faça seu pedido online em Luiziânia, SP.";
const ogImage = "/og-shirley.jpg";
const ogAlt = "Shirley Lanches Artesanal: hambúrguer, cachorro-quente e pedidos pelo cardápio online.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: siteTitle, template: "%s | Shirley Lanches Artesanal" },
  description: siteDescription,
  applicationName: "Shirley Lanches Artesanal",
  keywords: ["Shirley Lanches", "hambúrguer artesanal", "cachorro-quente", "batata frita", "lanches em Luiziânia", "cardápio online", "delivery"],
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "Shirley Lanches Artesanal",
    title: siteTitle,
    description: siteDescription,
    images: [{ url: ogImage, width: 1200, height: 630, alt: ogAlt, type: "image/jpeg" }],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: [{ url: ogImage, alt: ogAlt }],
  },
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Shirley" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#a9342b" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" data-scroll-behavior="smooth">
      <body>
        <a className="skip-link" href="#conteudo-principal">Pular para o conteúdo</a>
        <Providers>
          <ConnectionBanner />
          {children}
        </Providers>
      </body>
    </html>
  );
}
